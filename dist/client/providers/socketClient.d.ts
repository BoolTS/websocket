import type { TConfig, THandler } from "../../utils/types";
export declare class SocketClient<TSend extends Record<string, unknown> = Record<string, unknown>, TReceive extends Record<string, THandler<unknown>> = Record<string, THandler<unknown>>> {
    #private;
    constructor({ url, reconnectDelay, maxReconnectAttempts, blobThreshold, debug }: TConfig);
    connect(): this;
    close({ code, reason }: {
        code?: number;
        reason?: string;
    }): this;
    send<T extends keyof TSend & string>(event: T, payload: TSend[T]): this;
    on<K extends keyof TReceive>(event: K, handler: TReceive[K]): () => boolean;
    get readyState(): 0 | 1 | 2 | 3 | undefined;
}
