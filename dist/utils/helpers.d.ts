import type { TBinaryLike } from "./types";
export declare const encoder: TextEncoder;
export declare const decoder: TextDecoder;
export declare const isArrayBuffer: (v: unknown) => v is ArrayBuffer;
export declare const isBinary: (v: unknown) => v is TBinaryLike;
export declare const toBytes: (v: TBinaryLike) => Uint8Array<ArrayBuffer>;
export declare const signBinary: (event: string, data: TBinaryLike, blobThreshold: number) => Uint8Array<ArrayBuffer> | Blob;
export declare const unsignBinary: (bytes: Uint8Array<ArrayBuffer>) => {
    event: string;
    data: Uint8Array<ArrayBuffer>;
} | null;
