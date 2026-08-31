import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { AdminPackage,PackageDraft } from '../types/packages';
import { adminWriteMode } from './adminOperationCommands';
import { updateMockPackage } from './packageRepository';
export interface AdminPackageCommands{savePackage(input:PackageDraft):Promise<void>}
const safeError=(error:unknown)=>{const code=typeof error==='object'&&error&&'code'in error?String(error.code):'';const messages:Record<string,string>={'functions/unauthenticated':'Sign in again before continuing.','functions/permission-denied':'This account cannot manage packages.','functions/already-exists':'A package with that code already exists.','functions/not-found':'The package no longer exists.','functions/failed-precondition':'The stable package code cannot be changed.','functions/invalid-argument':'Review the package fields and try again.'};return new Error(messages[code]??'The package could not be saved.')};
const firebaseCommands:AdminPackageCommands={async savePackage(input){try{await httpsCallable(getFirebaseFunctions(),'savePackage')(input)}catch(error){throw safeError(error)}}};
const mockCommands:AdminPackageCommands={async savePackage(input){const now=new Date().toISOString();const packageId=input.packageId??input.code;const record:AdminPackage={...input,packageId,createdAt:now,updatedAt:now};updateMockPackage(record)}};
export const adminPackageCommands=adminWriteMode==='firebase'?firebaseCommands:mockCommands;
