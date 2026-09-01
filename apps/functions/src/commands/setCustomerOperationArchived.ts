import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAuthenticatedCustomer } from '../auth/requireAuthenticatedCustomer.js';
import type { OperationRecord, OperationStatus } from '../domain/operationTypes.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { asCallableError } from './commandErrors.js';

interface SetCustomerOperationArchivedInput { operationId:string;archived:boolean }
const archiveEligibleStatuses:readonly OperationStatus[]=['COMPLETED','CANCELLED','REFUNDED','REJECTED'];

export const setCustomerOperationArchived=onCall<SetCustomerOperationArchivedInput>(async request=>{
  const actor=requireAuthenticatedCustomer(request);
  try{
    const operationId=request.data.operationId?.trim();
    if(!operationId||typeof request.data.archived!=='boolean')throw new HttpsError('invalid-argument','Operation ID and archive preference are required.');
    const db=getAdminFirestore();
    const operationRef=db.collection('operations').doc(operationId);
    const projectionRef=db.collection('customerOperations').doc(operationId);
    const archived=request.data.archived;
    await db.runTransaction(async transaction=>{
      const [operationSnapshot,projectionSnapshot]=await Promise.all([transaction.get(operationRef),transaction.get(projectionRef)]);
      if(!operationSnapshot.exists||!projectionSnapshot.exists)throw new HttpsError('not-found','Operation not found.');
      const operation=operationSnapshot.data() as OperationRecord;
      const projection=projectionSnapshot.data();
      if(operation.customerId!==actor.uid||projection?.customerId!==actor.uid)throw new HttpsError('permission-denied','You cannot change this operation.');
      if(archived&&!archiveEligibleStatuses.includes(operation.status))throw new HttpsError('failed-precondition','Only completed or permanently closed operations can be archived.');
      transaction.update(projectionRef,archived?{archived:true,archivedAt:Timestamp.now()}:{archived:false,archivedAt:FieldValue.delete()});
    });
    return{operationId,archived};
  }catch(error){throw asCallableError(error)}
});
