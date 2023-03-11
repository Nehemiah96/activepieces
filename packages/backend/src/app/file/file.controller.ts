import { FastifyInstance, FastifyRequest } from "fastify";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { fileService } from "./file.service";
import { StatusCodes } from "http-status-codes";
import { Static, Type } from "@sinclair/typebox";

const FileIdParams = Type.Object({
    fileId: Type.String(),
});
type FileIdParams = Static<typeof FileIdParams>;

export const fileController = async (fastify: FastifyInstance) => {
    fastify.get(
        "/:fileId",
        {
            schema: {
                params: FileIdParams
            }
        },
        async (
            request: FastifyRequest<{
                Params: FileIdParams;
            }>,
            reply
        ) => {
            const file = await fileService.getOne({ projectId: request.principal.projectId, fileId: request.params.fileId });
            if (file === null) {
                throw new ActivepiecesError({ code: ErrorCode.FILE_NOT_FOUND, params: { id: request.params.fileId } });
            }
            reply.type("application/zip").status(StatusCodes.OK).send(file.data);
        }
    );
};
