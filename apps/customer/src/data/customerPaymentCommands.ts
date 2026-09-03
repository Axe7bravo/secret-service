import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import { customerDataMode } from './customerReadRepository';
import { customerOperationsRepository } from './customerOperationsRepository';
import type { OperationPaymentResult } from '../types/payment';

interface CustomerPaymentCommands {create(operationId:string):Promise<OperationPaymentResult>}
const friendlyError=(error:unknown)=>{const code=typeof error==='object'&&error!==null&&'code'in error?String(error.code):'';if(code.includes('unauthenticated'))return new Error('Your secure session expired. Sign in and try again.');if(code.includes('failed-precondition'))return new Error('Payment is not currently available for this operation.');if(code.includes('already-exists'))return new Error('This operation has already been paid.');return new Error('The secure payment service could not be started. Try again shortly.')};
const firebaseCommands:CustomerPaymentCommands={async create(operationId){try{return(await httpsCallable<{operationId:string},OperationPaymentResult>(getFirebaseFunctions(),'createOperationPayment')({operationId})).data}catch(error){throw friendlyError(error)}}};
const mockCommands:CustomerPaymentCommands={async create(operationId){customerOperationsRepository.confirmMockPayment(operationId);return{paymentId:`mock-${operationId}`,status:'PAID'}}};
export const customerPaymentCommands=customerDataMode==='firestore'?firebaseCommands:mockCommands;
