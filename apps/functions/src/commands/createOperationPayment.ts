import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError,onCall } from 'firebase-functions/v2/https';
import { requireAuthenticatedCustomer } from '../auth/requireAuthenticatedCustomer.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import type { OperationRecord,PaymentRecord } from '../domain/operationTypes.js';
import { createYocoCheckout,YocoProviderConfigurationError,type YocoCheckoutResult } from '../payments/yocoProvider.js';
import { asCallableError } from './commandErrors.js';

interface Input {operationId:string}
export const createOperationPayment=onCall<Input>(async request=>{
  const actor=requireAuthenticatedCustomer(request);
  try{
    const operationId=request.data.operationId?.trim();
    if(!operationId)throw new HttpsError('invalid-argument','Operation ID is required.');
    const db=getAdminFirestore();const operationRef=db.collection('operations').doc(operationId);const paymentRef=db.collection('payments').doc(operationId);const activityRef=db.collection('operationActivity').doc();
    const eligibility=await db.runTransaction(async transaction=>{
      const [operationSnapshot,paymentSnapshot]=await Promise.all([transaction.get(operationRef),transaction.get(paymentRef)]);
      if(!operationSnapshot.exists)throw new HttpsError('not-found','Operation not found.');
      const operation=operationSnapshot.data() as OperationRecord;
      if(operation.customerId!==actor.uid)throw new HttpsError('permission-denied','Operation is not owned by this customer.');
      if(operation.status!=='PAYMENT_PENDING'||operation.paymentSummary.status!=='PENDING')throw new HttpsError('failed-precondition','This operation is not eligible for payment.');
      if(operation.package.currency!=='ZAR'||!Number.isInteger(operation.package.priceMinor)||operation.package.priceMinor<=0)throw new HttpsError('failed-precondition','The authoritative operation amount is invalid.');
      const existing=paymentSnapshot.exists?paymentSnapshot.data() as PaymentRecord:undefined;
      if(existing?.status==='PAID'||existing?.status==='REFUNDED')throw new HttpsError('already-exists','This operation already has a settled payment.');
      if(existing?.status==='PENDING')return{operation,payment:existing,reuse:true as const};
      const now=Timestamp.now();const reservation:PaymentRecord={paymentId:operationId,operationId,customerId:actor.uid,provider:'YOCO',amountMinor:operation.package.priceMinor,currency:'ZAR',status:'PENDING',createdAt:existing?.createdAt??now,updatedAt:now};transaction.set(paymentRef,reservation);return{operation,payment:reservation,reuse:false as const};
    });
    if(eligibility.reuse)return{paymentId:eligibility.payment.paymentId,checkoutUrl:eligibility.payment.checkoutUrl,status:'PENDING' as const};
    const paymentId=operationId;
    let checkout:YocoCheckoutResult;
    try{checkout=await createYocoCheckout({paymentId,operationId,amountMinor:eligibility.operation.package.priceMinor,currency:'ZAR',customerId:actor.uid})}catch(error){const now=Timestamp.now();await paymentRef.update({status:'FAILED',failureCategory:error instanceof YocoProviderConfigurationError?'PROVIDER_NOT_CONFIGURED':'PROVIDER_INITIATION_FAILED',failedAt:now,updatedAt:now});throw error}
    const now=Timestamp.now();const payment:PaymentRecord={paymentId,operationId,customerId:actor.uid,provider:'YOCO',amountMinor:eligibility.operation.package.priceMinor,currency:'ZAR',status:'PENDING',providerCheckoutId:checkout.providerCheckoutId,checkoutUrl:checkout.checkoutUrl,createdAt:eligibility.payment?.createdAt??now,updatedAt:now};
    await db.runTransaction(async transaction=>{const current=await transaction.get(operationRef);if(!current.exists)throw new HttpsError('not-found','Operation not found.');const operation=current.data() as OperationRecord;if(operation.customerId!==actor.uid||operation.status!=='PAYMENT_PENDING'||operation.paymentSummary.status!=='PENDING')throw new HttpsError('failed-precondition','Payment eligibility changed.');transaction.set(paymentRef,payment);transaction.create(activityRef,{operationId,type:'PAYMENT_INITIATED',timestamp:now,actorId:actor.uid,actorRole:'CUSTOMER',fromStatus:'PAYMENT_PENDING',toStatus:'PAYMENT_PENDING',note:'Secure payment checkout initiated.'})});
    return{paymentId,checkoutUrl:checkout.checkoutUrl,status:'PENDING' as const};
  }catch(error){if(error instanceof YocoProviderConfigurationError)throw new HttpsError('failed-precondition',error.message);throw asCallableError(error)}
});
