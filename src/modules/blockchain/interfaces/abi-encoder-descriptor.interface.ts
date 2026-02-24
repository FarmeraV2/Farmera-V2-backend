export interface AbiEncoderDescriptor<T> {
    abiType: string;
    map: (data: T) => any[];
}
