import { ApId } from "../common/id-generator";
import { FlowVersion } from "./flow-version";
import { Type, Static } from "@sinclair/typebox";
import { BaseModelSchema } from "../common/base-model";

export type FlowId = ApId;

export const Flow = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String({
        example: "9m7dpndtY3IUvUvCv5WY0",
    }),
    collectionId: Type.String({
        example: "517dpndtY3IU2UvCv5WY0",
    }),
    version: FlowVersion,
})

export type Flow = Static<typeof Flow> & { version: FlowVersion | null };