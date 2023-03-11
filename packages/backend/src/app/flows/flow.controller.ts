import { FastifyInstance, FastifyRequest } from "fastify";
import {
    CreateFlowRequest,
    FlowOperationRequest,
    FlowVersionId,
    ListFlowsRequest,
    SeekPage,
} from "@activepieces/shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { flowService } from "./flow.service";
import { Static, Type } from "@sinclair/typebox";
import { Flow } from "@activepieces/shared";

const FlowIdParams = Type.Object({
    flowId: Type.String(),
});
type FlowIdParams = Static<typeof FlowIdParams>;

const DEFUALT_PAGE_SIZE = 10;

export const flowController = async (fastify: FastifyInstance) => {
    fastify.post(
        "/",
        {
            schema: {
                summary: "Create a flow",
                description: "Create a flow",
                tags: ["flow"],
                body: CreateFlowRequest,
                response: {
                    200: Flow
                }
            },
        },
        async (
            request: FastifyRequest<{
                Body: CreateFlowRequest;
            }>
        ) => {
            return await flowService.create({ projectId: request.principal.projectId, request: request.body });
        }
    );

    fastify.post(
        "/:flowId",
        {
            schema: {
                summary: "Update a flow",
                description: "Update a flow",
                tags: ["flow"],
                params: FlowIdParams,
                body: FlowOperationRequest,
                response: {
                    200: Flow
                }
            },
        },
        async (
            request: FastifyRequest<{
                Params: FlowIdParams;
                Body: FlowOperationRequest;
            }>
        ) => {
            const flow = await flowService.getOne({ id: request.params.flowId, versionId: undefined, projectId: request.principal.projectId, includeArtifacts: false });
            if (flow === null) {
                throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
            }
            return await flowService.update({ flowId: request.params.flowId, request: request.body, projectId: request.principal.projectId });
        }
    );

    fastify.get(
        "/",
        {
            schema: {
                summary: "List flows",
                description: "List flows",
                tags: ["flow"],
                querystring: ListFlowsRequest,
                response: {
                    200: SeekPage(Flow)
                }
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: ListFlowsRequest;
            }>
        ) => {
            return await flowService.list({ projectId: request.principal.projectId, collectionId: request.query.collectionId, cursorRequest: request.query.cursor ?? null, limit: request.query.limit ?? DEFUALT_PAGE_SIZE });
        }
    );

    fastify.get(
        "/:flowId",
        {
            schema: {
                summary: "Get a flow",
                description: "Get a flow",
                tags: ["flow"],
                params: FlowIdParams,
                querystring: {
                    versionId: Type.String(),
                    includeArtifacts: Type.Boolean()
                },
                response: {
                    200: Flow
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: FlowIdParams;
                Querystring: {
                    versionId: FlowVersionId | undefined;
                    includeArtifacts: boolean | undefined;
                };
            }>
        ) => {
            const versionId: FlowVersionId | undefined = request.query.versionId;
            const includeArtifacts = request.query.includeArtifacts ?? false;
            const flow = await flowService.getOne({ id: request.params.flowId, versionId: versionId, projectId: request.principal.projectId, includeArtifacts });
            if (flow === null) {
                throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
            }
            return flow;
        }
    );

    fastify.delete(
        "/:flowId",
        {
            schema: {
                summary: "Delete a flow",
                description: "Delete a flow",
                tags: ["flow"],
                params: FlowIdParams,
                response: {
                    200: {}
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: FlowIdParams;
            }>,
            reply
        ) => {
            await flowService.delete({ projectId: request.principal.projectId, flowId: request.params.flowId });
            reply.status(StatusCodes.OK).send();
        }
    );
};
