import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { createHash } from "crypto";
import { contractAbi } from "src/contracts/ProcessTracking";
import { HashedLog } from "src/modules/crop-management/dtos/log/hashed-log.dto";
import { HashedStep } from "src/modules/crop-management/dtos/step/hashed-step.dto";
import { SeasonDetailDto } from "src/modules/crop-management/dtos/step/season-detail.dto";
import { StepDto } from "src/modules/crop-management/dtos/step/step.dto";
import { Log } from "src/modules/crop-management/entities/log.entity";
import { SeasonDetail } from "src/modules/crop-management/entities/season-detail.entity";
import Web3 from "web3";

export interface TransactionLog {
    address: string;
    topics: string[];
    data: string;
    blockHash: string;
    blockNumber: bigint;
    transactionHash: string;
    transactionIndex: bigint;
    logIndex: bigint;
    removed: boolean;
    returnValues?: Record<string, any>;
    event?: string;
    signature?: string;
    raw?: {
        data: string;
        topics: string[];
    };
}

export interface TransactionReceipt {
    type: bigint;
    status: bigint;
    cumulativeGasUsed: bigint;
    gasUsed: bigint;
    effectiveGasPrice: bigint;
    from: string;
    to: string;
    transactionHash: string;
    transactionIndex: bigint;
    blockHash: string;
    blockNumber: bigint;
    logsBloom: string;
    logs: TransactionLog[];
    events?: Record<string, TransactionLog>;
}


@Injectable()
export class BlockchainService {

    private readonly logger = new Logger(BlockchainService.name);
    private readonly web3: Web3;
    private readonly contract: any;

    constructor(private readonly configService: ConfigService) {
        const rpcUrl = this.configService.get<string>('RPC_URL');
        const walletKey = this.configService.get<string>('WALLET_PRIVATE_KEY');
        const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

        if (!rpcUrl || !walletKey || !contractAddress) {
            this.logger.warn("Blockchain service configuration is missing, this service is disabled");
            return;
        }

        this.web3 = new Web3(rpcUrl);
        const account = this.web3.eth.accounts.privateKeyToAccount(walletKey);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;

        const abi = contractAbi;

        this.contract = new this.web3.eth.Contract(abi, contractAddress);
    }

    async addLog(log: Log): Promise<TransactionReceipt> {
        try {
            const hashedData = this.hashData(HashedLog, log);

            // todo!("handle gas spent");

            return await this.contract.methods
                .addLog(log.season_detail_id, log.id, hashedData)
                .send({ from: this.web3.eth.defaultAccount });

        } catch (error) {
            this.logger.error(error.message);
            this.logger.error("Error name: ", error.cause.errorName);
            throw new Error(error.message);
        }
    }

    async addStep(step: StepDto): Promise<TransactionReceipt> {
        try {
            const hashedData = this.hashData(HashedStep, step);

            return await this.contract.methods
                .addStep(step.season_id, step.id, hashedData)
                .send({ from: this.web3.eth.defaultAccount });

        } catch (error) {
            this.logger.error(error.message);
            this.logger.error("Error name: ", error.cause.errorName);
            throw new Error(error.message);
        }
    }

    async getHashedLog(logId: number): Promise<string> {
        try {
            return await this.contract.methods
                .getLog(logId)
                .call();

        } catch (error) {
            this.logger.error(error.message);
            this.logger.error("Error name: ", error.cause.errorName);
            throw new Error(error.message);
        }
    }

    async getHashedLogs(seasonDetailId: number): Promise<{ id: number, hash: string }[]> {
        try {
            const result = await this.contract.methods
                .getLogs(seasonDetailId)
                .call();

            const ids = result[0].map((id: bigint | string) => Number(id));
            const hashes = result[1];

            return ids.map((id: number, index: number) => ({
                id,
                hash: hashes[index],
            }));

        } catch (error) {
            this.logger.error(error.message);
            throw new Error(error.message);
        }
    }

    async getStep(seasonId: number, stepId: number): Promise<string> {
        try {
            return await this.contract.methods
                .getStep(seasonId, stepId)
                .call();

        } catch (error) {
            this.logger.error(error.message);
            this.logger.error("Error name: ", error.cause.errorName);
            throw new Error(error.message);
        }
    }

    async getHashedSteps(seasonId: number): Promise<{ id: number, hash: string }[]> {
        try {
            const result = await this.contract.methods
                .getSteps(seasonId)
                .call();

            const ids = result[0].map((id: bigint | string) => Number(id));
            const hashes = result[1];

            return ids.map((id: number, index: number) => ({
                id,
                hash: hashes[index],
            }));

        } catch (error) {
            this.logger.error(error.message);
            this.logger.error("Error name: ", error.cause.errorName);
            throw new Error(error.message);
        }
    }

    hashData<T>(cls: new () => T, data: unknown): string {
        const instance = plainToInstance(cls, data, { excludeExtraneousValues: true, });
        console.log(instance);
        return createHash('sha256')
            .update(JSON.stringify(instance))
            .digest('hex');
    }
}