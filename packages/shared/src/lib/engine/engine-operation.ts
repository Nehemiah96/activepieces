import { CollectionId } from "../collections/collection";
import { FlowVersion, FlowVersionId } from "../flows/flow-version";
import { ProjectId } from "../project/project";

export enum EngineOperationType {
    EXECUTE_FLOW = "EXECEUTE_FLOW",
    EXECUTE_PROPERTY = "EXECUTE_PROPERTY",
    EXECUTE_TRIGGER_HOOK = "EXECUTE_TRIGGER_HOOK",
    EXTRACT_EVENT_DATA = "EXTRACT_EVENT_DATA",
}

export enum TriggerHookType {
    ON_ENABLE = "ON_ENABLE",
    ON_DISABLE = "ON_DISABLE",
    RUN = "RUN"
}

export type EngineOperation = ExecuteFlowOperation | ExecutePropsOptions | ExecuteTriggerOperation | ExecuteEventParserOperation;

export interface ExecuteEventParserOperation {
    pieceName: string;
    event: EventPayload
}

export interface ExecutePropsOptions {
    pieceName: string;
    pieceVersion: string;
    propertyName: string;
    stepName: string;
    input: Record<string, any>;
    projectId: ProjectId;
    collectionId: CollectionId,
    apiUrl?: string;
    workerToken?: string;
}

export interface ExecuteFlowOperation {
    flowVersionId: FlowVersionId,
    collectionId: CollectionId;
    projectId: ProjectId,
    triggerPayload: unknown,
    workerToken?: string;
    apiUrl?: string;
}

export interface ExecuteTriggerOperation {
    hookType: TriggerHookType,
    flowVersion: FlowVersion,
    webhookUrl: string,
    triggerPayload?: unknown,
    projectId: ProjectId,
    collectionId: CollectionId,
    workerToken?: string;
    apiUrl?: string;
    edition?: string;
    webhookSecret?: string;
}

export interface EventPayload {
    body: any,
    rawBody?: any;
    method: string,
    headers: Record<string, string>,
    queryParams: Record<string, string>,
}

export type ParseEventResponse = {
    event?: string;
    identifierValue?: string,
    reply?: {
        headers: Record<string, string>,
        body: unknown
    }
}

export interface AppEventListener {
    events: string[],
    identifierValue: string,
};

export interface ExecuteTriggerResponse {
    listeners: AppEventListener[];
}