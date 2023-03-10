import {
  AddActionRequest,
  DeleteActionRequest,
  FlowOperationType,
  FlowOperationRequest,
  UpdateActionRequest,
  UpdateTriggerRequest,
  StepLocationRelativeToParent,
} from './flow-operations';
import {
  Action,
  ActionType,
} from './actions/action';
import { Trigger, TriggerType } from './triggers/trigger';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { FlowVersion } from './flow-version';
import { ActivepiecesError, ErrorCode } from '../common/activepieces-error';

const actionSchemaValidator = TypeCompiler.Compile(Action);
const triggerSchemaValidation = TypeCompiler.Compile(Trigger);

function isValid(flowVersion: FlowVersion) {
  let valid = true;
  let step: Action | Trigger | undefined = flowVersion.trigger;
  while (step !== undefined) {
    valid = valid && step.valid;
    step = step.nextAction;
  }
  return valid;
}

function deleteAction(
  flowVersion: FlowVersion,
  request: DeleteActionRequest
): void {
  const steps = getAllSteps(flowVersion);
  let deleted = false;
  for (let i = 0; i < steps.length; i++) {
    const parentStep = steps[i];
    if (parentStep.nextAction && parentStep.nextAction.name === request.name) {
      const stepToUpdate: Action = parentStep.nextAction;
      parentStep.nextAction = stepToUpdate.nextAction;
      deleted = true;
    }
    if (parentStep.type === ActionType.BRANCH) {
      if (parentStep.onFailureAction && parentStep.onFailureAction.name === request.name) {
        const stepToUpdate: Action = parentStep.onFailureAction;
        parentStep.onFailureAction = stepToUpdate.nextAction;
        deleted = true;
      }
      if (parentStep.onSuccessAction && parentStep.onSuccessAction.name === request.name) {
        const stepToUpdate: Action = parentStep.onSuccessAction;
        parentStep.onSuccessAction = stepToUpdate.nextAction;
        deleted = true;
      }
    }
  }
  if (!deleted) {
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_OPERATION_INVALID,
      params: {}
    }, `Action ${request.name} not found`);
  }
}

function traverseFlowInternal(step: Trigger | Action | undefined): (Action | Trigger)[] {
  const steps: (Action | Trigger)[] = [];
  while (step !== undefined && step !== null) {
    steps.push(step);
    if (step.type === ActionType.BRANCH) {
      steps.push(...traverseFlowInternal(step.onFailureAction));
      steps.push(...traverseFlowInternal(step.onSuccessAction));
    }
    step = step.nextAction;
  }
  return steps;
}


function getAllSteps(flowVersion: FlowVersion): (Action | Trigger)[] {
  return traverseFlowInternal(flowVersion.trigger);
}

function getStep(
  flowVersion: FlowVersion,
  stepName: string
): Action | Trigger | undefined {
  return getAllSteps(flowVersion).find((step) => step.name === stepName);
}

function updateAction(
  flowVersion: FlowVersion,
  request: UpdateActionRequest
): void {
  const steps = getAllSteps(flowVersion);
  let updated = false;
  for (let i = 0; i < steps.length; i++) {
    const parentStep = steps[i];
    if (parentStep.nextAction && parentStep.nextAction.name === request.name) {
      const { nextAction, onSuccessAction, onFailureAction } = extractActions(parentStep.nextAction);
      parentStep.nextAction = createAction(request, nextAction, onFailureAction, onSuccessAction);
      updated = true;
    }
    if (parentStep.type === ActionType.BRANCH) {
      if (parentStep.onFailureAction && parentStep.onFailureAction.name === request.name) {
        const { nextAction, onSuccessAction, onFailureAction } = extractActions(parentStep.onFailureAction);
        parentStep.onFailureAction = createAction(request, nextAction, onFailureAction, onSuccessAction);
        updated = true;
      }
      if (parentStep.onSuccessAction && parentStep.onSuccessAction.name === request.name) {
        const { nextAction, onSuccessAction, onFailureAction } = extractActions(parentStep.onSuccessAction);
        parentStep.onSuccessAction = createAction(request, nextAction, onFailureAction, onSuccessAction);
        updated = true;
      }
    }
  }
  if (!updated) {
    console.log("Asdasdas");
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_OPERATION_INVALID,
      params: {}
    }, `Action ${request.name} not found`);
  }
}

function extractActions(step: Trigger | Action): { nextAction: Action, onSuccessAction?: Action, onFailureAction?: Action } {
  const nextAction = step.nextAction;
  const onSuccessAction = step.type === ActionType.BRANCH ? step.onSuccessAction : undefined;
  const onFailureAction = step.type === ActionType.BRANCH ? step.onFailureAction : undefined;
  return { nextAction, onSuccessAction, onFailureAction };
}


function addAction(flowVersion: FlowVersion, request: AddActionRequest): void {
  const parentStep = getAllSteps(flowVersion).find(step => step.name === request.parentStep);
  if (parentStep === undefined) {
    console.log("fffff " + request.parentStep);
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_OPERATION_INVALID,
      params: {}
    }, `Parent step ${request.parentStep} not found`);
  }
  if (parentStep.type === ActionType.BRANCH && request.stepLocationRelativeToParent !== undefined && request.stepLocationRelativeToParent !== null) {
    if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_TRUE_BRANCH) {
      parentStep.onSuccessAction = createAction(request.action, parentStep.onSuccessAction);
    } else if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_FALSE_BRANCH) {
      parentStep.onFailureAction = createAction(request.action, parentStep.onFailureAction);
    } 
    else if(request.stepLocationRelativeToParent === StepLocationRelativeToParent.AFTER) {
      parentStep.nextAction = createAction(request.action, parentStep.nextAction);
    }
    else {
      throw new ActivepiecesError({
        code: ErrorCode.FLOW_OPERATION_INVALID,
        params: {}
      }, `Branch ${request.stepLocationRelativeToParent} not found`);
    }
  } else {
    console.log("what " + request.parentStep);
    parentStep.nextAction = createAction(request.action, parentStep.nextAction);
  }
}

function createAction(
  request: UpdateActionRequest,
  nextAction: Action | undefined,
  onFailureAction?: Action,
  onSuccessAction?: Action
): Action {
  const baseProperties = {
    displayName: request.displayName,
    name: request.name,
    valid: false,
    nextAction: nextAction,
  };
  let action: Action;
  switch (request.type) {
    case ActionType.BRANCH:
      action = {
        ...baseProperties,
        onFailureAction: onFailureAction,
        onSuccessAction: onSuccessAction,
        type: ActionType.BRANCH,
        settings: request.settings,
      };
      break;
    case ActionType.LOOP_ON_ITEMS:
      action = {
        ...baseProperties,
        firstLoopAction: request.firstLoopAction,
        type: ActionType.LOOP_ON_ITEMS,
        settings: request.settings,
      };
      break;
    case ActionType.PIECE:
      action = {
        ...baseProperties,
        type: ActionType.PIECE,
        settings: request.settings,
      };
      break;
    case ActionType.CODE:
      action = {
        ...baseProperties,
        type: ActionType.CODE,
        settings: request.settings,
      };
      break;
  }
  console.log("asdsa");
  action.valid = (request.valid ?? true) && actionSchemaValidator.Check(action);
  return action;
}

function createTrigger(
  name: string,
  request: UpdateTriggerRequest,
  nextAction: Action | undefined
): Trigger {
  const baseProperties = {
    displayName: request.displayName,
    name: name,
    valid: false,
    nextAction: nextAction,
  };
  let trigger: Trigger;
  switch (request.type) {
    case TriggerType.EMPTY:
      trigger = {
        ...baseProperties,
        type: TriggerType.EMPTY,
        settings: request.settings,
      };
      break;
    case TriggerType.SCHEDULE:
      trigger = {
        ...baseProperties,
        type: TriggerType.SCHEDULE,
        settings: request.settings,
      };
      break;
    case TriggerType.PIECE:
      trigger = {
        ...baseProperties,
        type: TriggerType.PIECE,
        settings: request.settings,
      };
      break;
    case TriggerType.WEBHOOK:
      trigger = {
        ...baseProperties,
        type: TriggerType.WEBHOOK,
        settings: request.settings,
      };
      break;
  }
  trigger.valid =
    (request.valid ?? true) && triggerSchemaValidation.Check(trigger);
  return trigger;
}

export const flowHelper = {
  isValid: isValid,
  apply(
    flowVersion: FlowVersion,
    operation: FlowOperationRequest
  ): FlowVersion {
    const clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion));
    switch (operation.type) {
      case FlowOperationType.CHANGE_NAME:
        clonedVersion.displayName = operation.request.displayName;
        break;
      case FlowOperationType.DELETE_ACTION:
        deleteAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.ADD_ACTION:
        addAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.UPDATE_ACTION:
        updateAction(clonedVersion, operation.request);
        break;
      case FlowOperationType.UPDATE_TRIGGER:
        clonedVersion.trigger = createTrigger(
          clonedVersion.trigger.name,
          operation.request,
          clonedVersion.trigger.nextAction
        );
        break;
      default:
        throw new Error('Unknown operation type');
    }
    clonedVersion.valid = isValid(clonedVersion);
    return clonedVersion;
  },
  getStep: getStep,
  getAllSteps: getAllSteps,
  clone: (flowVersion: FlowVersion): FlowVersion => {
    return JSON.parse(JSON.stringify(flowVersion));
  },
};
