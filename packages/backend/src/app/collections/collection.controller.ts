import { FastifyInstance, FastifyRequest } from "fastify";
import { collectionService } from "./collection.service";
import {
    Collection,
    CreateCollectionRequest,
    ListCollectionsRequest,
    SeekPage,
    UpdateCollectionRequest
} from "@activepieces/shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

const CollectionIdParams = Type.Object({
    collectionId: Type.String(),
});
type CollectionIdParams = Static<typeof CollectionIdParams>;

const DEFAULT_PAGE_SIZE = 10;


export const collectionController = async (fastify: FastifyInstance) => {
    fastify.delete(
        "/:collectionId",
        {
            schema: {
                description: "Delete a collection",
                tags: ["collection"],
                summary: "Delete a collection",
                params: CollectionIdParams,
                response: {
                    200: {}
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: CollectionIdParams;
            }>,
            reply
        ) => {
            await collectionService.delete({ projectId: request.principal.projectId, collectionId: request.params.collectionId });
            reply.status(StatusCodes.OK).send();
        }
    );

    fastify.get(
        "/:collectionId",
        {
            schema: {
                description: "Get a collection",
                tags: ["collection"],
                summary: "Get a collection",
                params: CollectionIdParams,
                response: {
                    200: Collection
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: CollectionIdParams
            }>
        ) => {
            const collection = await collectionService.getOne({ id: request.params.collectionId, projectId: request.principal.projectId });
            if (collection === null) {
                throw new ActivepiecesError({
                    code: ErrorCode.COLLECTION_NOT_FOUND,
                    params: { id: request.params.collectionId },
                });
            }
            return collection;
        }
    );

    fastify.post(
        "/:collectionId",
        {
            schema: {
                description: "Update a collection",
                tags: ["collection"],
                summary: "Update a collection",
                params: CollectionIdParams,
                body: UpdateCollectionRequest,
                response: {
                    200: Collection
                }
            },
        },
        async (
            request: FastifyRequest<{
                Params: CollectionIdParams;
                Body: UpdateCollectionRequest;
            }>
        ) => {
            const collection = await collectionService.getOne({ id: request.params.collectionId, projectId: request.principal.projectId });
            if (collection === null) {
                throw new ActivepiecesError({
                    code: ErrorCode.COLLECTION_NOT_FOUND,
                    params: { id: request.params.collectionId },
                });
            }
            return await collectionService.update({ projectId: request.principal.projectId, collectionId: request.params.collectionId, request: request.body });
        }
    );

    fastify.get(
        "/",
        {
            schema: {
                description: "List Collections",
                tags: ["collection"],
                summary: "List Collections",
                querystring: ListCollectionsRequest,
                response: {
                    200: SeekPage(Collection)
                }
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: ListCollectionsRequest;
            }>
        ) => {
            return await collectionService.list(request.principal.projectId, request.query.cursor, request.query.limit ?? DEFAULT_PAGE_SIZE);
        }
    );

    fastify.post(
        "/",
        {
            schema: {
                description: "Create a collection",
                tags: ["collection"],
                summary: "Create a collection",
                body: CreateCollectionRequest,
                response: {
                    200: Collection
                }
            },
        },
        async (
            request: FastifyRequest<{
                Body: CreateCollectionRequest;
            }>
        ) => {
            return await collectionService.create({ projectId: request.principal.projectId, request: request.body });
        }
    );
};
