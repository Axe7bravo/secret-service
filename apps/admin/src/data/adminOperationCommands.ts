import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { TransitionContext } from '../domain/operationWorkflow';
import type { OperationStatus } from '../types/operations';
import { adminOperationsRepository } from './adminOperationsRepository';

export interface AdminOperationCommands { transitionOperation(operationId:string,toStatus:OperationStatus,context?:TransitionContext):Promise<void> }

const safeCommandError=(error:unknown):Error=>{const code=typeof error==='object'&&error&&'code'in error?String(error.code):'';const messages:Record<string,string>={'functions/unauthenticated':'Sign in again before continuing.','functions/permission-denied':'This account does not have permission to perform that action.','functions/not-found':'The operation no longer exists.','functions/invalid-argument':'Review the action details and try again.','functions/failed-precondition':'The operation changed and this action is no longer available.','functions/internal':'The command could not be completed.'};return new Error(messages[code]??'The command could not be completed.')};

const firebaseCommands:AdminOperationCommands={
 async transitionOperation(operationId,toStatus,context={}){try{await httpsCallable(getFirebaseFunctions(),'transitionOperation')({operationId,toStatus,metadata:{reason:context.note,ambassadorId:context.ambassador,reviewConfirmed:context.reviewConfirmed}})}catch(error){throw safeCommandError(error)}},
};
const mockCommands:AdminOperationCommands={async transitionOperation(operationId,toStatus,context){adminOperationsRepository.transition(operationId,toStatus,context)}};
const env=(import.meta as ImportMeta&{env:Record<string,string|undefined>}).env;
export const adminWriteMode=env.VITE_OPERATION_WRITE_MODE==='firebase'?'firebase':'mock';
export const adminOperationCommands:AdminOperationCommands=adminWriteMode==='firebase'?firebaseCommands:mockCommands;
