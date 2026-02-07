import { TransactionLog } from "./transaction-log.interface";

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