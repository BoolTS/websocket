import type { core } from "zod";
export declare const messageSchema: import("zod").ZodCodec<import("zod").ZodString, import("zod").ZodObject<{
    event: import("zod").ZodString;
    payload: import("zod").ZodUnknown;
}, core.$strip>>;
