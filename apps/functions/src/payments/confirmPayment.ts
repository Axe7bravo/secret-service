import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { getAdminFirestore } from '../firebaseAdmin.js';
import type { OperationRecord,PaymentRecord } from '../domain/operationTypes.js';
import { validateTransition } from '../domain/operationWorkflow.js';
import { buildCustomerOperationProjection,customerArchiveMetadataFrom } from '../projection/customerOperationProjection.js';
import { paymentAttemptsFor,paymentHistoryFields,validatePaymentOwnership } from './paymentAttempts.js';

export interface ConfirmedProviderPayment {paymentId:string;providerCheckoutId:string;providerPaymentId:string;amountMinor:number;currency:'ZAR'}
type SettlementResult='CONFIRMED'|'ALREADY_CONFIRMED'|'ADDITIONAL_SUCCESS';

/** Internal only: called after signature verification and provider payload validation. */
export const confirmOperationPayment=async(event:ConfirmedProviderPayment):Promise<SettlementResult>=>{
  const db=getAdminFirestore();
  const paymentRef=db.collection('payments').doc(event.paymentId);
  const activityRef=db.collection('operationActivity').doc();
  return db.runTransaction<SettlementResult>(async transaction=>{
    const paymentSnapshot=await transaction.get(paymentRef);
    if(!paymentSnapshot.exists)throw new HttpsError('not-found','Payment record not found.');
    const payment=paymentSnapshot.data() as PaymentRecord;
    const attempts=paymentAttemptsFor(payment);
    const attempt=attempts.find(item=>item.providerCheckoutId===event.providerCheckoutId);
    if(payment.paymentId!==event.paymentId||payment.operationId!==event.paymentId||payment.provider!=='YOCO'||!attempt||
      !event.providerPaymentId.trim()||!Number.isSafeInteger(event.amountMinor)||event.amountMinor<=0||payment.amountMinor!==event.amountMinor||payment.currency!==event.currency){
      throw new HttpsError('failed-precondition','Provider payment does not match the authoritative payment record.');
    }
    if(payment.status==='PAID'){
      const settledCheckoutId=payment.settledCheckoutId??payment.providerCheckoutId;
      if(settledCheckoutId===event.providerCheckoutId&&payment.providerPaymentId===event.providerPaymentId)return'ALREADY_CONFIRMED';
      // Another checkout may also have charged. Preserve the winning payment and
      // paidAt; record only this attempt's outcome for operator reconciliation.
      if(attempt.status!=='SUCCEEDED'){
        attempt.status='SUCCEEDED';attempt.providerPaymentId=event.providerPaymentId;
        transaction.update(paymentRef,paymentHistoryFields(attempts));
      }
      return'ADDITIONAL_SUCCESS';
    }
    if(!['PENDING','FAILED'].includes(payment.status))throw new HttpsError('failed-precondition','Payment is not eligible for provider-confirmed settlement.');
    const operationRef=db.collection('operations').doc(payment.operationId);
    const projectionRef=db.collection('customerOperations').doc(payment.operationId);
    const [operationSnapshot,projectionSnapshot]=await Promise.all([transaction.get(operationRef),transaction.get(projectionRef)]);
    if(!operationSnapshot.exists)throw new HttpsError('not-found','Operation not found.');
    const operation=operationSnapshot.data() as OperationRecord;
    validatePaymentOwnership(payment,operation);
    if(operation.paymentSummary.status!=='PENDING')throw new HttpsError('failed-precondition','Operation payment summary needs reconciliation.');
    validateTransition(operation.status,'PAID',{});
    const now=Timestamp.now();
    const next:OperationRecord={...operation,status:'PAID',paymentSummary:{...operation.paymentSummary,status:'PAID',paidAt:now},updatedAt:now};
    attempt.status='SUCCEEDED';attempt.providerPaymentId=event.providerPaymentId;
    const nextPayment:PaymentRecord={...payment,...paymentHistoryFields(attempts),status:'PAID',settledCheckoutId:event.providerCheckoutId,providerCheckoutId:event.providerCheckoutId,providerPaymentId:event.providerPaymentId,paidAt:now,updatedAt:now};
    // Existing Admin reads show this top-level reference. Keep it aligned with
    // the winning payment, not a newer unconfirmed checkout's redirect.
    if(payment.providerCheckoutId!==event.providerCheckoutId)delete nextPayment.checkoutUrl;
    delete nextPayment.failureCategory;
    transaction.set(paymentRef,nextPayment);
    transaction.update(operationRef,{status:'PAID',paymentSummary:next.paymentSummary,updatedAt:now});
    transaction.set(projectionRef,buildCustomerOperationProjection(next,customerArchiveMetadataFrom(projectionSnapshot.data())));
    transaction.create(activityRef,{operationId:operation.operationId,type:'PAYMENT_CONFIRMED',timestamp:now,actorId:'yoco-webhook',actorRole:'SYSTEM',fromStatus:operation.status,toStatus:'PAID',note:'Trusted payment confirmation received.'});
    return'CONFIRMED';
  });
};
