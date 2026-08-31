import { adminOperationsRepository } from './adminOperationsRepository';
import { firestoreAdminOperationsRepository,type AdminOperationReadRepository } from './firestore/firestoreAdminOperationsRepository';
const env=(import.meta as ImportMeta&{env:Record<string,string|undefined>}).env;
export const adminDataMode=env.VITE_DATA_SOURCE==='firestore'?'firestore':'mock';
const mockAdminReadRepository:AdminOperationReadRepository={list:async()=>adminOperationsRepository.list(),getById:async id=>adminOperationsRepository.getById(id),subscribeList(listener){listener(adminOperationsRepository.list());return adminOperationsRepository.subscribe(()=>listener(adminOperationsRepository.list()))},subscribeById(id,listener){listener(adminOperationsRepository.getById(id));return adminOperationsRepository.subscribe(()=>listener(adminOperationsRepository.getById(id)))}};
export const adminOperationReadRepository=adminDataMode==='firestore'?firestoreAdminOperationsRepository:mockAdminReadRepository;
