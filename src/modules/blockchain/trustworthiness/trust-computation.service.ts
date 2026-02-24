import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Web3 from "web3";
import { TransactionReceipt } from "../interfaces/transaction-receipt.interface";
import { TrustRecord } from "../interfaces/trust-score-record.interface";
import { AbiEncoderDescriptor } from "../interfaces/abi-encoder-descriptor.interface";
import { trustComputationContractAbi } from "../contracts/TrustComputation";

@Injectable()
export class TrustComputationService {

    private readonly logger = new Logger(TrustComputationService.name);
    private readonly web3: Web3;
    private readonly contract: any;

    constructor(private readonly configService: ConfigService) {
        const rpcUrl = this.configService.get<string>('RPC_URL');
        const walletKey = this.configService.get<string>('WALLET_PRIVATE_KEY');
        const contractAddress = this.configService.get<string>('TRUST_COMPUTATION_CONTRACT_ADDRESS');

        if (!rpcUrl || !walletKey || !contractAddress) {
            this.logger.warn("TrustworthinessService configuration is missing, this service is disabled");
            return;
        }

        this.web3 = new Web3(rpcUrl);
        const account = this.web3.eth.accounts.privateKeyToAccount(walletKey);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;

        const abi = trustComputationContractAbi;

        this.contract = new this.web3.eth.Contract(abi, contractAddress);
    }

    async processData<T>(identifier: string, id: number, dataType: string, context: string, data: T, descriptor: AbiEncoderDescriptor<T>): Promise<TransactionReceipt> {
        try {
            const identifierBytes32 = Web3.utils.keccak256(identifier);

            this.logger.debug(`Identifier: ${identifier}`)
            this.logger.debug(`Identifier hashed: ${identifierBytes32}`)

            const result = await this.contract.methods
                .processData(identifierBytes32, id, dataType, context, this.encodeData(data, descriptor))
                .send({ from: this.web3.eth.defaultAccount });

            this.logger.debug(`Trustworthiness result: 
                ID: ${Number(result.events?.TrustProcessed.returnValues.id)}
                accept: ${result.events?.TrustProcessed.returnValues.accept}
                score: ${Number(result.events?.TrustProcessed.returnValues.trustScore)}
            `);

            return result;

        } catch (error) {
            this.logger.error(error.message);
            this.logger.error("Error name: ", error.cause.errorName);
            throw new Error(error.message);
        }
    }

    async getTrustRecord(identifier: string, id: number): Promise<TrustRecord> {
        try {
            const identifierBytes32 = Web3.utils.keccak256(identifier);
            const result = await this.contract.methods
                .getTrustRecord(identifierBytes32, id)
                .call({ from: this.web3.eth.defaultAccount });

            const record = result[2];

            return {
                identifier: identifierBytes32,
                id: id,
                accept: record.accept,
                trustScore: Number(record.trustScore),
                timestamp: new Date(Number(record.timestamp) * 1000)
            }

        } catch (error) {
            this.logger.error(error.message);
            this.logger.error("Error name: ", error.cause.errorName);
            throw new Error(error.message);
        }
    }

    async getTrustRecords(identifier: string, ids: number[]): Promise<TrustRecord[]> {
        try {

            const identifierBytes32 = Web3.utils.keccak256(identifier);

            const result = await this.contract.methods
                .getTrustRecords(identifierBytes32, ids)
                .call({ from: this.web3.eth.defaultAccount });

            const resultIds = result[1].map((id: string) => Number(id));
            const records = result[2].map((record: any, idx: number): TrustRecord => ({
                identifier: identifierBytes32,
                id: resultIds[idx],
                accept: record.accept,
                trustScore: Number(record.trustScore),
                timestamp: new Date(Number(record.timestamp) * 1000)
            }));

            return records;

        } catch (error) {
            this.logger.error(error.message);
            this.logger.error("Error name: ", error.cause.errorName);
            throw new Error(error.message);
        }
    }

    private encodeData<T>(data: T, descriptor: AbiEncoderDescriptor<T>): string {
        return this.web3.eth.abi.encodeParameters(
            [descriptor.abiType],
            [[...descriptor.map(data)]]
        );
    }
}