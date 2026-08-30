import { useSyncExternalStore } from 'react';import { adminOperationsRepository } from '../data/adminOperationsRepository';
export const useOperations=()=>useSyncExternalStore(adminOperationsRepository.subscribe,adminOperationsRepository.list,adminOperationsRepository.list);
export const useOperation=(id:string|undefined)=>useOperations().find(item=>item.operationId===id);
