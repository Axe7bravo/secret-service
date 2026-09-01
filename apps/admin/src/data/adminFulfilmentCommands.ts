import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { AdminAmbassador,AdminCampus,AmbassadorDraft,CampusDraft } from '../types/fulfilment';
import { adminWriteMode } from './adminOperationCommands';
import { adminOperationsRepository } from './adminOperationsRepository';
import { updateMockAmbassador,updateMockCampus } from './adminFulfilmentRepository';

export interface AdminFulfilmentCommands { saveAmbassador(input:AmbassadorDraft):Promise<void>;saveCampus(input:CampusDraft):Promise<void>;assignAmbassador(operationId:string,ambassadorId:string):Promise<void> }
const call=async(name:string,input:unknown)=>{try{await httpsCallable(getFirebaseFunctions(),name)(input)}catch(error){const code=typeof error==='object'&&error&&'code'in error?String(error.code):'';const messages:Record<string,string>={'functions/unauthenticated':'Sign in again before continuing.','functions/permission-denied':'This account cannot manage fulfilment.','functions/not-found':'The requested record no longer exists.','functions/already-exists':'That record already exists or is already assigned.','functions/invalid-argument':'Review the submitted details.','functions/failed-precondition':'The requested fulfilment action is not currently valid.'};throw new Error(messages[code]??'The fulfilment action could not be completed.')}};
const firebaseCommands:AdminFulfilmentCommands={saveAmbassador:input=>call('saveAmbassador',input),saveCampus:input=>call('saveCampus',input),assignAmbassador:(operationId,ambassadorId)=>call('assignAmbassador',{operationId,ambassadorId})};
const mockCommands:AdminFulfilmentCommands={async saveAmbassador(input){const now=new Date().toISOString();const ambassadorId=input.ambassadorId??`amb-${Date.now()}`;const record:AdminAmbassador={...input,ambassadorId,createdAt:now,updatedAt:now};updateMockAmbassador(record)},async saveCampus(input){const now=new Date().toISOString();const campusId=input.campusId??input.code;const record:AdminCampus={...input,campusId,createdAt:now,updatedAt:now};updateMockCampus(record)},async assignAmbassador(operationId,ambassadorId){adminOperationsRepository.assignAmbassador(operationId,ambassadorId)}};
export const adminFulfilmentCommands=adminWriteMode==='firebase'?firebaseCommands:mockCommands;
