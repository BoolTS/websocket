import type { TConfig, THandler } from "../../utils/types";

import { isArrayBuffer, isBinary, signBinary, unsignBinary } from "../../utils/helpers";
import { messageSchema } from "../../utils/validators";

export class SocketClient<
    TSend extends Record<string, unknown> = Record<string, unknown>,
    TReceive extends Record<string, THandler<unknown>> = Record<string, THandler<unknown>>
> {
    #socket: WebSocket | undefined;
    #configuration: Required<TConfig>;
    #retriedCount = 0;
    #reconnectTimer: number | undefined = undefined;
    #handlers = new Map<keyof TReceive, Set<TReceive[keyof TReceive]>>();

    #openListener = this.#onOpen.bind(this);
    #closeListener = this.#onClose.bind(this);
    #errorListener = this.#onError.bind(this);
    #messageListener = this.#onMessage.bind(this);

    constructor({
        url,
        reconnectDelay = 100,
        maxReconnectAttempts = 0,
        blobThreshold = 1024 * 1024,
        debug = false
    }: TConfig) {
        this.#configuration = {
            url: url,
            debug: debug || false,
            blobThreshold: blobThreshold < 0 ? 1024 * 1024 : blobThreshold,
            reconnectDelay: reconnectDelay < 100 ? 100 : reconnectDelay,
            maxReconnectAttempts: maxReconnectAttempts < 1 ? 0 : maxReconnectAttempts
        };
    }

    connect() {
        this.#socket = new WebSocket(this.#configuration.url);

        this.#socket.addEventListener("open", this.#openListener, { once: true });
        this.#socket.addEventListener("close", this.#closeListener, { once: true });
        this.#socket.addEventListener("error", this.#errorListener);
        this.#socket.addEventListener("message", this.#messageListener);

        return this;
    }

    close({ code, reason }: { code?: number; reason?: string }) {
        this.#socket?.close(code, reason);
        return this;
    }

    send<T extends keyof TSend & string>(event: T, payload: TSend[T]) {
        if (!this.#socket) {
            throw new Error("WebSocket is not connected.");
        }

        if (isBinary(payload)) {
            this.#socket.send(signBinary(event, payload, this.#configuration.blobThreshold));
        } else {
            this.#socket.send(JSON.stringify({ event, payload }));
        }

        this.#configuration.debug && console.info("WebSocket message sent", event, payload);

        return this;
    }

    on<K extends keyof TReceive>(event: K, handler: TReceive[K]): () => boolean {
        let set = this.#handlers.get(event);

        if (!set) {
            this.#handlers.set(event, (set = new Set<TReceive[K]>()));
        }

        set.add(handler);

        return () => set.delete(handler);
    }

    #onOpen(event: Event) {
        this.#configuration.debug && console.info(event);
        this.#retriedCount = 0;
    }

    #onClose(event: CloseEvent) {
        this.#configuration.debug && console.info("WebSocket connection closed", event);

        if (!this.#socket || event.wasClean) {
            return;
        }

        this.#reconnectTimer = setTimeout(
            () => this.#reconnect(),
            this.#configuration.reconnectDelay
        );
    }

    #onError(event: Event) {
        this.#configuration.debug && console.error("WebSocket error", event);
    }

    #onMessage(event: MessageEvent) {
        this.#dispatch(event.data);
        this.#configuration.debug && console.info("WebSocket message received", event);
    }

    #reconnect() {
        clearTimeout(this.#reconnectTimer);

        if (this.#configuration.maxReconnectAttempts < 1) {
            return this.connect();
        }

        if (this.#retriedCount < this.#configuration.maxReconnectAttempts) {
            this.#retriedCount++;
            this.connect();
        }

        return this;
    }

    #dispatch(raw: unknown) {
        let event: string;
        let payload: unknown;

        if (typeof raw === "string") {
            const validation = messageSchema.safeDecode(raw);

            if (!validation.success) {
                return;
            }

            event = validation.data.event;
            payload = validation.data.payload;
        } else if (isArrayBuffer(raw)) {
            const parsed = unsignBinary(new Uint8Array(raw));

            if (!parsed) {
                return;
            }

            event = parsed.event;
            payload = parsed.data;
        } else {
            return;
        }

        const listenerSet = this.#handlers.get(event);

        if (!listenerSet) {
            return;
        }

        for (const listener of [...listenerSet]) {
            try {
                listener(payload);
            } catch (err) {
                console.error(`Handler error for "${event}"`, err);
            }
        }
    }

    get readyState() {
        return this.#socket?.readyState;
    }
}
