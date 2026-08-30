import type { Operation } from '../types/operations';import { adminOperationsRepository } from './adminOperationsRepository';import { firestoreAdminOperationsRepository,type AdminOperationReadRepository } from './firestore/firestoreAdminOperationsRepository';
const env=(import.meta as ImportMeta&{env:Record<string,string|undefined>}).env;
export const adminDataMode=env.VITE_DATA_SOURCE==='firestore'?'firestore':'mock';
const mockAdminReadRepository:AdminOperationReadRepository={list:async():Promise<readonly Operation[]>=>adminOperationsRepository.list(),getById:async(id)=>adminOperationsRepository.getById(id)};
export const adminOperationReadRepository:AdminOperationReadRepository=adminDataMode==='firestore'?firestoreAdminOperationsRepository:mockAdminReadRepository;
