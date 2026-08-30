import { collection,getDocs,orderBy,query,where } from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS,getFirebaseFirestore } from '../../../../../packages/firebase/src';
import type { CustomerOperation } from '../../types/customer';
import { mapCustomerOperation,parseCustomerOperationDocument } from './customerOperationMapper';
export interface CustomerOperationReadRepository { list():Promise<readonly CustomerOperation[]>;getById(operationId:string):Promise<CustomerOperation|undefined> }
export const createFirestoreCustomerOperationsRepository=(authenticatedUid:string):CustomerOperationReadRepository=>{
 if(!authenticatedUid)throw new Error('An authenticated customer UID is required.');
 const list=async()=>{const snapshot=await getDocs(query(collection(getFirebaseFirestore(),FIRESTORE_COLLECTIONS.customerOperations),where('customerId','==',authenticatedUid),orderBy('createdAt','desc')));return snapshot.docs.map(item=>mapCustomerOperation(parseCustomerOperationDocument(item.data())));};
 return {list,async getById(operationId){const operations=await list();return operations.find(item=>item.operationId===operationId);}};
};
