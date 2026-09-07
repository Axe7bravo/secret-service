import { Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError,onCall } from 'firebase-functions/v2/https';
import { requireAuthenticatedCustomer } from '../auth/requireAuthenticatedCustomer.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import type { OperationRecord,PaymentCheckoutRequest,PaymentRecord } from '../domain/operationTypes.js';
import { customerAppUrl,yocoSecretKey } from '../payments/paymentConfig.js';
import { createYocoCheckout,YocoProviderConfigurationError,type YocoCheckoutResult } from '../payments/yocoProvider.js';
import { MAX_PAYMENT_ATTEMPTS,paymentAttemptsFor,paymentHistoryFields,validatePaymentOwnership } from '../payments/paymentAttempts.js';
import { asCallableError } from './commandErrors.js';

interface Input {operationId:string}

const checkoutReturnUrls=(operationId:string)=>{
  let base:URL;
  try{base=new URL(customerAppUrl.value())}catch{throw new YocoProviderConfigurationError('CUSTOMER_APP_URL is missing or is not an absolute URL.')}
  if(!['https:','http:'].includes(base.protocol))throw new YocoProviderConfigurationError('CUSTOMER_APP_URL must use http or https.');
  const operationPath=`/operations/${encodeURIComponent(operationId)}/payment`;
  return{
    successUrl:new URL(`${operationPath}/success`,base).toString(),
    cancelUrl:new URL(`${operationPath}/cancelled`,base).toString(),
    failureUrl:new URL(`${operationPath}/failed`,base).toString(),
  };
};

export const createOperationPayment=onCall<Input>({region:'us-central1',secrets:[yocoSecretKey]},async request=>{
  logger.info('createOperationPayment invoked.',{stage:'invoked'});
  const actor=requireAuthenticatedCustomer(request);
  logger.info('createOperationPayment authenticated.',{stage:'authenticated',customerId:actor.uid});
  try{
    const operationId=request.data.operationId?.trim();
    if(!operationId)throw new HttpsError('invalid-argument','Operation ID is required.');
    const secretKey=yocoSecretKey.value().trim();
    const mode=secretKey.startsWith('sk_test_')?'test':secretKey.startsWith('sk_live_')?'live':undefined;
    if(!mode)throw new YocoProviderConfigurationError('The checkout secret has an unsupported mode.');
    const configuredReturnUrls=checkoutReturnUrls(operationId);
    const db=getAdminFirestore();
    const operationRef=db.collection('operations').doc(operationId);
    const paymentRef=db.collection('payments').doc(operationId);
    const activityRef=db.collection('operationActivity').doc();
    const eligibility=await db.runTransaction(async transaction=>{
      const [operationSnapshot,paymentSnapshot]=await Promise.all([transaction.get(operationRef),transaction.get(paymentRef)]);
      if(!operationSnapshot.exists)throw new HttpsError('not-found','Operation not found.');
      const operation=operationSnapshot.data() as OperationRecord;
      if(operation.customerId!==actor.uid)throw new HttpsError('permission-denied','Operation is not owned by this customer.');
      if(operation.status!=='PAYMENT_PENDING'||operation.paymentSummary.status!=='PENDING')throw new HttpsError('failed-precondition','This operation is not eligible for payment.');
      if(operation.package.currency!=='ZAR'||!Number.isSafeInteger(operation.package.priceMinor)||operation.package.priceMinor<=0)throw new HttpsError('failed-precondition','The authoritative operation amount is invalid.');
      const existing=paymentSnapshot.exists?paymentSnapshot.data() as PaymentRecord:undefined;
      if(existing)validatePaymentOwnership(existing,operation);
      if(existing?.status==='PAID'||existing?.status==='REFUNDED')throw new HttpsError('already-exists','This operation already has a settled payment.');
      if(existing?.status==='CANCELLED')throw new HttpsError('failed-precondition','This payment requires operator review.');
      const previousMode=existing?.checkoutRequest?.mode??existing?.processingMode?.toLowerCase();
      if(existing&&!previousMode)throw new HttpsError('failed-precondition','The existing payment mode needs operator verification before retrying.');
      if(previousMode&&previousMode!==mode)throw new HttpsError('failed-precondition','A payment cannot switch between test and live checkout.');
      const attempts=existing?paymentAttemptsFor(existing):[];
      if(existing?.status==='PENDING'&&existing.checkoutUrl){
        if(!existing.providerCheckoutId)throw new HttpsError('failed-precondition','The existing checkout reference needs operator review.');
        return{operation,payment:existing,checkoutReady:true as const};
      }
      // Only a verified failure of a saved checkout permits a new key. A network
      // error can occur after Yoco created a checkout, so it must reuse its key.
      const rotate=existing?.status==='FAILED'&&Boolean(existing.providerCheckoutId)&&existing.failureCategory==='PROVIDER_PAYMENT_FAILED';
      if(existing&&!rotate&&!existing.idempotencyKey)throw new HttpsError('failed-precondition','The existing checkout reservation needs operator review.');
      if(attempts.length>=MAX_PAYMENT_ATTEMPTS)throw new HttpsError('resource-exhausted','Payment checkout history is full. Contact support before retrying.');
      const attemptNumber=rotate?(existing?.attemptNumber??1)+1:(existing?.attemptNumber??1);
      const idempotencyKey=!rotate&&existing?.idempotencyKey?existing.idempotencyKey:`${operationId}:checkout:${attemptNumber}`;
      const now=Timestamp.now();
      const checkoutRequest:PaymentCheckoutRequest=!rotate&&existing?.checkoutRequest?existing.checkoutRequest:{...configuredReturnUrls,mode};
      const reservation:PaymentRecord={...existing,paymentId:operationId,operationId,customerId:actor.uid,provider:'YOCO',amountMinor:operation.package.priceMinor,currency:'ZAR',status:'PENDING',idempotencyKey,attemptNumber,checkoutRequest,...paymentHistoryFields(attempts),createdAt:existing?.createdAt??now,updatedAt:now};
      if(rotate){delete reservation.providerCheckoutId;delete reservation.providerPaymentId;delete reservation.checkoutUrl;delete reservation.failedAt;delete reservation.failureCategory;}
      transaction.set(paymentRef,reservation);
      return{operation,payment:reservation,idempotencyKey,checkoutRequest,checkoutReady:false as const};
    });
    logger.info('Payment operation loaded.',{stage:'operation_loaded',operationId,customerId:actor.uid});
    logger.info('Payment eligibility validated.',{stage:'eligibility_validated',operationId,status:eligibility.operation.status});
    logger.info('Authoritative payment amount derived.',{stage:'amount_derived',operationId,amountMinor:eligibility.operation.package.priceMinor,currency:eligibility.operation.package.currency});
    logger.info('Payment record reservation completed.',{stage:'payment_reserved',operationId,paymentId:eligibility.payment.paymentId,attemptNumber:eligibility.payment.attemptNumber,checkoutReady:eligibility.checkoutReady});
    if(eligibility.checkoutReady){
      logger.info('Existing Yoco checkout redirect returned.',{stage:'redirect_returned',operationId,paymentId:eligibility.payment.paymentId,providerCheckoutId:eligibility.payment.providerCheckoutId});
      return{paymentId:eligibility.payment.paymentId,checkoutUrl:eligibility.payment.checkoutUrl,status:'PENDING' as const};
    }
    const paymentId=operationId;
    let checkout:YocoCheckoutResult;
    try{
      const {successUrl,cancelUrl,failureUrl}=eligibility.checkoutRequest;
      const returnUrls={successUrl,cancelUrl,failureUrl};
      logger.info('Yoco checkout request starting.',{stage:'yoco_request_started',operationId,paymentId,amountMinor:eligibility.operation.package.priceMinor,currency:'ZAR',customerAppOrigin:new URL(returnUrls.successUrl).origin});
      checkout=await createYocoCheckout({paymentId,operationId,amountMinor:eligibility.operation.package.priceMinor,currency:'ZAR',idempotencyKey:eligibility.idempotencyKey,...returnUrls,secretKey});
      logger.info('Yoco checkout response received.',{stage:'yoco_response_received',operationId,paymentId,providerCheckoutId:checkout.providerCheckoutId,processingMode:checkout.processingMode});
    }catch(error){
      logger.error('Yoco checkout initiation failed.',{stage:'yoco_request_failed',operationId,paymentId,amountMinor:eligibility.operation.package.priceMinor,currency:'ZAR',errorName:error instanceof Error?error.name:'UnknownError',errorMessage:error instanceof Error?error.message:'Unknown provider error'});
      const now=Timestamp.now();
      await db.runTransaction(async transaction=>{
        const currentSnapshot=await transaction.get(paymentRef);
        if(!currentSnapshot.exists)return;
        const current=currentSnapshot.data() as PaymentRecord;
        if(current.status==='PENDING'&&current.idempotencyKey===eligibility.idempotencyKey&&!current.providerCheckoutId)transaction.update(paymentRef,{failureCategory:error instanceof YocoProviderConfigurationError?'PROVIDER_NOT_CONFIGURED':'PROVIDER_INITIATION_FAILED',updatedAt:now});
      });
      if(error instanceof YocoProviderConfigurationError)throw error;
      throw new HttpsError('unavailable','The secure payment provider could not start checkout. Try again shortly.');
    }
    const now=Timestamp.now();
    const storedCheckout=await db.runTransaction(async transaction=>{
      const [currentOperation,currentPayment]=await Promise.all([transaction.get(operationRef),transaction.get(paymentRef)]);
      if(!currentOperation.exists)throw new HttpsError('not-found','Operation not found.');
      const operation=currentOperation.data() as OperationRecord;
      if(operation.customerId!==actor.uid)throw new HttpsError('permission-denied','Operation ownership changed.');
      if(!currentPayment.exists)throw new HttpsError('failed-precondition','Payment reservation is missing.');
      const current=currentPayment.data() as PaymentRecord;
      validatePaymentOwnership(current,operation);
      const attempts=paymentAttemptsFor(current);
      const known=attempts.some(attempt=>attempt.providerCheckoutId===checkout.providerCheckoutId);
      if(!known){
        if(current.idempotencyKey!==eligibility.idempotencyKey)throw new HttpsError('aborted','Checkout reservation changed. Operator reconciliation is required.');
        if(current.status==='PENDING'&&current.providerCheckoutId)throw new HttpsError('failed-precondition','The provider returned conflicting checkout references for one reservation.');
        if(attempts.length>=MAX_PAYMENT_ATTEMPTS)throw new HttpsError('resource-exhausted','Payment checkout history is full.');
        attempts.push({providerCheckoutId:checkout.providerCheckoutId,amountMinor:current.amountMinor,currency:current.currency,status:'PENDING'});
        // Merge the freshly read record, never the pre-provider reservation: an
        // older checkout may have settled while this request was in flight.
        const payment:PaymentRecord={...current,...paymentHistoryFields(attempts),updatedAt:now};
        if(current.status==='PENDING'){
          payment.providerCheckoutId=checkout.providerCheckoutId;payment.checkoutUrl=checkout.checkoutUrl;
          if(checkout.processingMode)payment.processingMode=checkout.processingMode;
          if(checkout.providerPaymentId)payment.providerPaymentId=checkout.providerPaymentId;
          delete payment.failureCategory;
        }
        transaction.set(paymentRef,payment);
        transaction.create(activityRef,{operationId,type:'PAYMENT_INITIATED',timestamp:now,actorId:actor.uid,actorRole:'CUSTOMER',fromStatus:'PAYMENT_PENDING',toStatus:'PAYMENT_PENDING',note:'Secure payment checkout initiated.'});
      }
      if(current.status!=='PENDING'||operation.status!=='PAYMENT_PENDING'||operation.paymentSummary.status!=='PENDING')return undefined;
      if(known&&current.providerCheckoutId!==checkout.providerCheckoutId)return undefined;
      return{paymentId,checkoutUrl:checkout.checkoutUrl};
    });
    if(!storedCheckout)throw new HttpsError('failed-precondition','Payment eligibility changed. Refresh the operation before continuing.');
    logger.info('Payment record updated with Yoco checkout.',{stage:'payment_updated',operationId,paymentId,providerCheckoutId:checkout.providerCheckoutId});
    logger.info('Yoco checkout redirect returned.',{stage:'redirect_returned',operationId,paymentId,providerCheckoutId:checkout.providerCheckoutId});
    return{...storedCheckout,status:'PENDING' as const};
  }catch(error){
    if(error instanceof YocoProviderConfigurationError){logger.error('Payment configuration validation failed.',{stage:'configuration_failed',errorMessage:error.message});throw new HttpsError('failed-precondition','Payment is not currently available.');}
    if(error instanceof HttpsError)throw error;
    logger.error('createOperationPayment failed unexpectedly.',{stage:'unexpected_failure',errorName:error instanceof Error?error.name:'UnknownError',errorMessage:error instanceof Error?error.message:'Unknown payment error'});
    throw asCallableError(error);
  }
});
