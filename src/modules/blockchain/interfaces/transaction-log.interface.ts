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