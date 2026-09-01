import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { CreateCustomerOperationInput, CreateCustomerOperationResult } from '../types/operationCreation';
import { customerCatalogRepository } from './customerCatalogRepository';
import { customerOperationsRepository } from './customerOperationsRepository';
import { customerDataMode } from './customerReadRepository';

interface ArchiveResult { operationId:string;archived:boolean }
export interface CustomerOperationCommands {
  createOperation(input:CreateCustomerOperationInput):Promise<CreateCustomerOperationResult>;
  setArchived(operationId:string,archived:boolean):Promise<ArchiveResult>;
}

const friendlyCreationError=(error:unknown):Error=>{
  const code=typeof error==='object'&&error!==null&&'code'in error?String(error.code):'';
  if(code.includes('unauthenticated'))return new Error('Your secure session expired. Sign in and try again.');
  if(code.includes('invalid-argument'))return new Error('Review the operation details and correct any missing or invalid information.');
  if(code.includes('failed-precondition'))return new Error('Operation availability or scheduling rules changed. Refresh the page and review your package, campus, date, and delivery window.');
  if(code.includes('unavailable')||code.includes('network'))return new Error('The secure operations service is temporarily unavailable. Try again shortly.');
  return new Error('The operation could not be submitted. Please try again.');
};

const friendlyArchiveError=(error:unknown,archived:boolean):Error=>{
  const code=typeof error==='object'&&error!==null&&'code'in error?String(error.code):'';
  if(code.includes('unauthenticated'))return new Error('Your secure session expired. Sign in and try again.');
  if(code.includes('permission-denied')||code.includes('not-found'))return new Error('This operation is not available in your private files.');
  if(code.includes('failed-precondition'))return new Error('Only completed or permanently closed operations can be archived.');
  return new Error(`The operation could not be ${archived?'archived':'restored'}. Please try again.`);
};

const firebaseCommands:CustomerOperationCommands={
  async createOperation(input){try{const callable=httpsCallable<CreateCustomerOperationInput,CreateCustomerOperationResult>(getFirebaseFunctions(),'createOperation');return(await callable(input)).data}catch(error){throw friendlyCreationError(error)}},
  async setArchived(operationId,archived){try{const callable=httpsCallable<{operationId:string;archived:boolean},ArchiveResult>(getFirebaseFunctions(),'setCustomerOperationArchived');return(await callable({operationId,archived})).data}catch(error){throw friendlyArchiveError(error,archived)}},
};

const mockCommands:CustomerOperationCommands={
  async createOperation(input){const catalog=await customerCatalogRepository.load();const selectedPackage=catalog.packages.find(item=>item.packageId===input.packageId);if(!selectedPackage)throw new Error('Select a supported operation package.');const selectedCampus=catalog.campuses.find(item=>item.code===input.recipient.campus);if(!selectedCampus)throw new Error('Select a supported campus.');return customerOperationsRepository.create({...input,recipient:{...input.recipient,campus:selectedCampus.name}},selectedPackage)},
  async setArchived(operationId,archived){const operation=customerOperationsRepository.getById(operationId);if(!operation)throw new Error('Operation not found.');if(archived&&!['COMPLETED','CANCELLED','REFUNDED','REJECTED'].includes(operation.status))throw new Error('Only completed or permanently closed operations can be archived.');return customerOperationsRepository.setArchived(operationId,archived)},
};

export const customerOperationCommands=customerDataMode==='firestore'?firebaseCommands:mockCommands;
