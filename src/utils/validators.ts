import type { core } from "zod";

import { codec, NEVER, object, string, unknown } from "zod";

const jsonCodec = <T extends core.$ZodType>(schema: T) =>
    codec(string(), schema, {
        decode: (decodedValue, context) => {
            try {
                return JSON.parse(decodedValue);
            } catch (error) {
                context.issues.push({
                    code: "invalid_format",
                    format: "json",
                    input: decodedValue,
                    message:
                        error &&
                        typeof error === "object" &&
                        "message" in error &&
                        typeof error.message === "string"
                            ? error.message
                            : "unknown error"
                });
                return NEVER;
            }
        },
        encode: (value) => JSON.stringify(value)
    });

export const messageSchema = jsonCodec(object({ event: string(), payload: unknown() }));
