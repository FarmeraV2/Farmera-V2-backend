import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Web3, { Address } from "web3";
import { auditRegistryAbi } from "../contracts/AuditRegistry";
import { AuditorInfo, VerificationRecord } from "../interfaces/auditor.interface";
import { VerificationFinalized, VerificationRequested } from "../interfaces/auditor-event.interface";
import { StateService } from "../state/state.service";

const AUDIT_SYNC_STATE_KEY = 'BSS01';

@Injectable()
export class AuditorRegistryService {

    private readonly logger = new Logger(AuditorRegistryService.name);
    private readonly web3: Web3;
    private readonly contract: any;
    private readonly devMode: boolean;
    private currentBlock: bigint = 0n;

    constructor(
        private readonly configService: ConfigService,
        private readonly blockchainSyncStateService: StateService
    ) {
        const rpcUrl = this.configService.get<string>('RPC_URL');
        const walletKey = this.configService.get<string>('WALLET_PRIVATE_KEY');
        const contractAddress = this.configService.get<string>('AUDIT_REGISTRY_CONTRACT_ADDRESS');
        const mode = this.configService.get<string>('NODE_ENV')

        if (!rpcUrl || !walletKey || !contractAddress) {
            this.logger.warn("AuditorService configuration is missing, this service is disabled");
            return;
        }

        this.devMode = mode !== 'production';

        this.web3 = new Web3(rpcUrl);
        const account = this.web3.eth.accounts.privateKeyToAccount(walletKey);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;

        this.contract = new this.web3.eth.Contract(auditRegistryAbi, contractAddress);
    }

    async requestVerfication(identifier: string, id: number, deadline: Date): Promise<void> {
        try {
            const identifierBytes32 = Web3.utils.keccak256(identifier);
            await this.contract.methods.requestVerification(identifierBytes32, id, Math.floor(deadline.getTime() / 1000))
                .send({ from: this.web3.eth.defaultAccount });
        } catch (error) {
            this.logger.error(`Failed to get auditor: ${error.message}`);
            throw new Error(error.message);
        }
    }

    async finalizeExpired(identifier: string, id: number): Promise<void> {
        try {
            const identifierBytes32 = Web3.utils.keccak256(identifier);
            const result = await this.contract.methods.finalizeExpired(identifierBytes32, id).call();
            console.log(result);
        } catch (error) {
            this.logger.error(`Failed to get verification finalize: ${error.message}`);
            throw new Error(error.message);
        }
    }


    async getAuditor(address: Address): Promise<AuditorInfo> {
        try {
            const result = await this.contract.methods.getAuditor(address).call();
            return {
                isActive: result.isActive,
                auditorAddress: result.auditorAddress,
                reputationScore: Number(result.reputationScore),
                stakedTokens: result.stakedTokens.toString(),
                name: result.name,
            };
        } catch (error) {
            this.logger.error(`Failed to get auditor: ${error.message}`);
            throw new Error(error.message);
        }
    }

    async getVerifications(identifier: string, id: number): Promise<VerificationRecord[]> {
        try {
            const identifierBytes32 = Web3.utils.keccak256(identifier);
            const result = await this.contract.methods.getVerifications(identifierBytes32, id).call();
            return result.map((v: any) => ({
                isValid: v.isValid,
                auditor: v.auditor,
                timestamp: Number(v.timestamp),
            }));
        } catch (error) {
            this.logger.error(`Failed to get verifications: ${error.message}`);
            throw new Error(error.message);
        }
    }

    async getVerificationDeadline(identifier: string, id: number): Promise<{ deadline: Date }> {
        try {
            const identifierBytes32 = Web3.utils.keccak256(identifier);
            const result = await this.contract.methods.getVerificationDeadline(identifierBytes32, id).call();
            return { deadline: new Date(Number(result)) }
        } catch (error) {
            this.logger.error(`Failed to get verification deadline: ${error.message}`);
            throw new Error(error.message);
        }
    }

    async getVerificationsFinalize(identifier: string, id: number): Promise<{ result: boolean }> {
        try {
            const identifierBytes32 = Web3.utils.keccak256(identifier);
            const result = await this.contract.methods.finalized(identifierBytes32, id).call();
            return { result }
        } catch (error) {
            this.logger.error(`Failed to get verification finalize: ${error.message}`);
            throw new Error(error.message);
        }
    }

    async getRecentVerificationFinalizedEvents(fromBlock: number | string, toBlock?: number | string): Promise<VerificationFinalized[]> {
        try {
            const events = await this.contract.getPastEvents('VerificationFinalized', {
                fromBlock,
                toBlock: toBlock ? toBlock : 'latest',
            });
            return events.map((e: any): VerificationFinalized => ({
                identifier: e.returnValues.identifier,
                id: Number(e.returnValues.id),
                consensus: e.returnValues.consensus,
                blockNumber: Number(e.blockNumber),
            }));
        } catch (error) {
            this.logger.error(`Failed to get VerificationFinalized events: ${error.message}`);
            return [];
        }
    }

    async getRecentVerificationRequestEvents(fromBlock: number | string, toBlock?: number | string): Promise<VerificationRequested[]> {
        try {
            const events = await this.contract.getPastEvents('VerificationRequested', {
                fromBlock,
                toBlock: toBlock ? toBlock : 'latest',
            });

            return events.map((e: any): VerificationRequested => ({
                identifier: e.returnValues.identifier,
                id: Number(e.returnValues.id),
                assignedAuditors: e.returnValues.assignedAuditors,
                deadline: Number(e.returnValues.deadline),
                blockNumber: Number(e.blockNumber),
            }));
        } catch (error) {
            this.logger.error(`Failed to get VerificationFinalized events: ${error.message}`);
            return [];
        }
    }

    async getCurrentBlockNumber(): Promise<bigint> {
        try {
            return await this.web3.eth.getBlockNumber();
        } catch (error) {
            this.logger.error(`Failed to get block number: ${error.message}`);
            return BigInt(0);
        }
    }

    async handleRequestEvents(callback: (events: VerificationRequested[]) => Promise<void>) {
        let fromBlock: number | string = this.currentBlock.toString();
        if (!this.devMode) {
            const state = await this.blockchainSyncStateService.getState(AUDIT_SYNC_STATE_KEY);
            if (state) {
                fromBlock = state.latest_block_processed.toString();
            }
        }
        const latestBlock = (await this.getCurrentBlockNumber());
        const toBlock = latestBlock.toString();

        if (fromBlock > toBlock) return;

        const events = await this.getRecentVerificationRequestEvents(fromBlock, toBlock);

        await callback(events);

        if (!this.devMode) {
            await this.blockchainSyncStateService.updateState({ key: AUDIT_SYNC_STATE_KEY, latest_block_processed: latestBlock + 1n })
        } else {
            this.currentBlock = latestBlock + 1n
        }
    }
}