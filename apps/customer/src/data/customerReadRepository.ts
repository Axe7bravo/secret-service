import type { CustomerOperation } from '../types/customer';import { customerOperationsRepository } from './customerOperationsRepository';import { createFirestoreCustomerOperationsRepository,type CustomerOperationReadRepository } from './firestore/firestoreCustomerOperationsRepository';
const env=(import.meta as ImportMeta&{env:Record<string,string|undefined>}).env;
export const customerDataMode=env.VITE_DATA_SOURCE==='firestore'?'firestore':'mock';
const mockCustomerReadRepository:CustomerOperationReadRepository={list:async():Promise<readonly CustomerOperation[]>=>customerOperationsRepository.list(),getById:async(id)=>customerOperationsRepository.getById(id),subscribeList(listener){return customerOperationsRepository.subscribe(listener)}};
export const createCustomerOperationReadRepository=(authenticatedUid:string):CustomerOperationReadRepository=>customerDataMode==='firestore'?createFirestoreCustomerOperationsRepository(authenticatedUid):mockCustomerReadRepository;
