import { Configuration, OpenAIApi } from "openai";
import { system } from "./system/system";
import { SystemProp } from "./system/system-prop";
import fs from "node:fs/promises";
import { Action, ActionType, ActivepiecesError, BranchAction, ErrorCode, Trigger, TriggerType } from "@activepieces/shared";
import { getPiece, pieces } from "@activepieces/pieces-apps";
import { logger } from "./logger";
import { jsonrepair } from 'jsonrepair'

const configuration = new Configuration({
    apiKey: system.get(SystemProp.OPENAI_KEY),
});

export const flowGuessService = {
    async guessFlow(question: string): Promise<Trigger> {
        try {
            const context = await buildContext();
            const flowPrompt = (await fs.readFile('./packages/backend/src/assets/openai/main_prompt.txt', 'utf8')).replace('{question}', question).replace('{context}', context);
            const openAiResponse = await callOpenAI(flowPrompt);
            console.log("OpenAI Response: ", openAiResponse);
            const flowJson = extractJson(openAiResponse);
            return cleanAndValidateTrigger(flowJson.trigger);
        }
        catch (e) {
            logger.error(e);
            throw new ActivepiecesError({
                code: ErrorCode.OPENAI_FAILED,
                params: {}
            }, e);
        }
    }
}

function cleanAndValidateTrigger(step: Trigger): Trigger {
    const basicStep = {
        name: "trigger",
        displayName: step.displayName ?? "Untitled Trigger",
        type: step.type,
        valid: false,
        nextAction: cleanAction(step.nextAction, 1),
    }
    switch (step.type) {
    case TriggerType.PIECE:{
        const pieceName = getPiece(step.settings.pieceName);
        if (!pieceName) {
            throw new Error(`Unknown piece ${step.settings.pieceName}`);
        }
        return {
            ...basicStep,
            settings: {
                pieceName: step.settings.pieceName,
                triggerName: step.settings.triggerName,
                pieceVersion: "0.0.1",
                input: {}
            },
        } as Trigger
    }
    case TriggerType.SCHEDULE:
        return {
            ...basicStep,
            settings: {
                cronExpression: step.settings.cronExpression,
            },
        } as Trigger
    case TriggerType.WEBHOOK:
        return {
            ...basicStep,
            settings: {},
        } as Trigger
    default:
        throw new Error(`Unknown trigger type ${step.type}`);
    }
}

function cleanAction(step: any, count: number): Action {
    if(step === undefined || step === null) {
        return undefined;
    }
    const basicStep = {
        name: "step-" + count,
        displayName: step.displayName ?? "Untitled Step",
        type: step.type,
        valid: false,
        nextAction: cleanAction(step.nextAction, 3*count),
    }
    switch (basicStep.type) {
    case ActionType.BRANCH:{
        return {
            ...basicStep,
            settings: {
                // TODO support this in the prompt
                firstValue: "",
                secondValue: "",
                conditions: []
            },
            onFailureAction: cleanAction(step.onFailureAction, 3*count+1),
            onSuccessAction: cleanAction(step.onSuccessAction, 3*count+2),
        } as BranchAction
    }
    case ActionType.PIECE:{
        const pieceName = getPiece(step.settings.pieceName);
        if (!pieceName) {
            throw new Error(`Unknown piece ${step.settings.pieceName}`);
        }
        const action = pieceName.getAction(step.settings.actionName);
        if (!action) {
            throw new Error(`Unknown action ${step.settings.actionName} for piece ${step.settings.pieceName}`);
        }
        return {
            ...basicStep,
            displayName: step.displayName ?? snakeToNormal(step.settings.actionName),
            settings: {
                pieceName: step.settings.pieceName,
                // TODO FIX
                pieceVersion: "0.0.1",
                input: {},
                actionName: step.settings.actionName,
            }
        }
    }
    default:
        throw new Error(`Unknown Action type ${step.type}`);
    }
}

function snakeToNormal(str: string): string {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

  
async function buildContext(): Promise<string> {
    const context = [];
    for (const piece of pieces) {
        const actions = Object.keys(piece.metadata().actions);
        const triggers =Object.keys(piece.metadata().triggers);
        context.push(`For the following pieceName ${piece.name} These are the action: ${actions}, and triggers are: ${triggers}.`);
    }
    return context.join("\n");
}

function extractJson(text: string): { trigger: any} {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonStr = text.substring(start, end + 1).replace(/'/g, '"');
    const jsonArray = JSON.parse(jsonrepair(jsonStr));
    return jsonArray;
}

async function callOpenAI(prompt: string): Promise<string> {
    const openai = new OpenAIApi(configuration);
    const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: "user",
                content: prompt
            }],
        temperature: 0.3,
        top_p: 1,
        frequency_penalty: 0,
    });
    return response.data.choices[0].message!.content;
}


