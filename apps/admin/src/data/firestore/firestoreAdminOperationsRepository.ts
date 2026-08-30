import { collection,doc,getDoc,getDocs,orderBy,query } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS,getFirebaseFirestore } from '../../../../../packages/firebase/src';
import type { Operation } from '../../types/operations';
import { mapAdminOperation,parseOperationDocument,parseOperationInternalDocument } from './adminOperationMapper';

export interface AdminOperationReadRepository { list():Promise<readonly Operation[]>;getById(operationId:string):Promise<Operation|undefined> }
export const firestoreAdminOperationsRepository:AdminOperationReadRepository={
 async list(){const snapshot=await getDocs(query(collection(getFirebaseFirestore(),FIRESTORE_COLLECTIONS.operations),orderBy('createdAt','desc')));return snapshot.docs.map(item=>mapAdminOperation(parseOperationDocument(item.data())));},
 async getById(operationId){const db=getFirebaseFirestore();const [operationSnapshot,internalSnapshot]=await Promise.all([getDoc(doc(db,FIRESTORE_COLLECTIONS.operations,operationId)),getDoc(doc(db,FIRESTORE_COLLECTIONS.operationInternal,operationId))]);if(!operationSnapshot.exists())return undefined;return mapAdminOperation(parseOperationDocument(operationSnapshot.data()),parseOperationInternalDocument(internalSnapshot.exists()?internalSnapshot.data():undefined));},
};
