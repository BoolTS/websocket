export type TDisjointFrom<TJson, TBinary> = {
    [K in keyof TBinary]: K extends keyof TJson ? `Duplicate event key: ${K & string}` : BufferSource;
};
export type TBinaryLike = ArrayBuffer | ArrayBufferView<ArrayBuffer>;
export type THandler<T> = (payload: T) => void;
export type TConfig = {
    url: string;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
    blobThreshold?: number;
    debug?: boolean;
};
