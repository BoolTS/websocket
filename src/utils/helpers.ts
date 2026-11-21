import type { TBinaryLike } from "./types";

export const encoder = new TextEncoder();
export const decoder = new TextDecoder("utf-8", { fatal: true });

export const isArrayBuffer = (v: unknown): v is ArrayBuffer =>
    Object.prototype.toString.call(v) === "[object ArrayBuffer]";

export const isBinary = (v: unknown): v is TBinaryLike => isArrayBuffer(v) || ArrayBuffer.isView(v);

export const toBytes = (v: TBinaryLike): Uint8Array<ArrayBuffer> =>
    isArrayBuffer(v) ? new Uint8Array(v) : new Uint8Array(v.buffer, v.byteOffset, v.byteLength);

export const signBinary = (
    event: string,
    data: TBinaryLike,
    blobThreshold: number
): Uint8Array<ArrayBuffer> | Blob => {
    const name = encoder.encode(event);

    if (name.byteLength === 0 || name.byteLength > 255) {
        throw new Error(`Event name must be 1..255 bytes (UTF-8): "${event}"`);
    }

    const src = toBytes(data);
    const head = new Uint8Array(1 + name.byteLength);

    head[0] = name.byteLength;
    head.set(name, 1);

    if (src.byteLength >= blobThreshold) {
        return new Blob([head, src]);
    }

    const out = new Uint8Array(head.byteLength + src.byteLength);

    out.set(head, 0);
    out.set(src, head.byteLength);

    return out;
};

export const unsignBinary = (
    bytes: Uint8Array<ArrayBuffer>
): { event: string; data: Uint8Array<ArrayBuffer> } | null => {
    if (bytes.byteLength < 1) {
        return null;
    }

    const nameLen = bytes[0];

    if (nameLen === 0 || bytes.byteLength < 1 + nameLen) {
        return null;
    }

    try {
        const event = decoder.decode(bytes.subarray(1, 1 + nameLen));

        return { event, data: bytes.subarray(1 + nameLen) };
    } catch {
        return null;
    }
};
