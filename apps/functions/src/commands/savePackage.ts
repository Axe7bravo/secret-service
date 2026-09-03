import { Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import type { PackageRecord } from '../domain/operationTypes.js';
import { getAdminFirestore } from '../firebaseAdmin.js';

interface SavePackageInput { packageId?:string;code:string;name:string;shortDescription:string;description?:string;priceMinor:number;active:boolean;displayOrder:number }
const text=(value:unknown,label:string,max:number):string=>{if(typeof value!=='string'||!value.trim())throw new HttpsError('invalid-argument',`${label} is required.`);const result=value.trim();if(result.length>max)throw new HttpsError('invalid-argument',`${label} is too long.`);return result};
const parse=(value:unknown):SavePackageInput=>{if(typeof value!=='object'||value===null)throw new HttpsError('invalid-argument','Package data is required.');const input=value as Record<string,unknown>;const code=text(input.code,'Package code',64).toLowerCase();if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code))throw new HttpsError('invalid-argument','Package code must use lowercase letters, numbers, and single hyphens.');if(typeof input.priceMinor!=='number'||!Number.isInteger(input.priceMinor)||input.priceMinor<0)throw new HttpsError('invalid-argument','Price must be a non-negative integer in cents.');if(typeof input.displayOrder!=='number'||!Number.isInteger(input.displayOrder)||input.displayOrder<0)throw new HttpsError('invalid-argument','Display order must be a non-negative integer.');if(typeof input.active!=='boolean')throw new HttpsError('invalid-argument','Active state is required.');return{...(typeof input.packageId==='string'&&input.packageId.trim()?{packageId:input.packageId.trim()}:{}),code,name:text(input.name,'Package name',120),shortDescription:text(input.shortDescription,'Short description',240),...(typeof input.description==='string'&&input.description.trim()?{description:text(input.description,'Description',2000)}:{}),priceMinor:input.priceMinor,active:input.active,displayOrder:input.displayOrder}};

export const savePackage=onCall<unknown>(async request=>{
  logger.info('savePackage invoked',{uid:request.auth?.uid??null});
  let loggedPackageId:string|undefined;
  try{
    logger.info('savePackage stage',{stage:'authorizing-admin'});
    requireAdmin(request);
    logger.info('savePackage stage',{stage:'authorized-admin'});
    const input=parse(request.data);
    const packageId=input.packageId??input.code;
    loggedPackageId=packageId;
    logger.info('savePackage stage',{stage:'validated-input',packageId});
    const db=getAdminFirestore();const ref=db.collection('packages').doc(packageId);const now=Timestamp.now();
    logger.info('savePackage stage',{stage:'starting-transaction',packageId});
    await db.runTransaction(async transaction=>{
      const snapshot=await transaction.get(ref);
      logger.info('savePackage stage',{stage:'read-package-document',packageId,exists:snapshot.exists});
      if(input.packageId&&!snapshot.exists)throw new HttpsError('not-found','Package no longer exists.');
      if(!input.packageId&&snapshot.exists)throw new HttpsError('already-exists','A package with that code already exists.');
      const existing=snapshot.exists?snapshot.data() as PackageRecord:undefined;
      if(existing&&existing.code!==input.code)throw new HttpsError('failed-precondition','Package code is a stable identifier and cannot be changed.');
      const record:PackageRecord={packageId,code:input.code,name:input.name,shortDescription:input.shortDescription,...(input.description?{description:input.description}:{}),priceMinor:input.priceMinor,currency:'ZAR',active:input.active,displayOrder:input.displayOrder,createdAt:existing?.createdAt??now,updatedAt:now};
      logger.info('savePackage stage',{stage:'constructed-write-payload',packageId});
      transaction.set(ref,record);
      logger.info('savePackage stage',{stage:'queued-package-write',packageId});
    });
    logger.info('savePackage stage',{stage:'transaction-complete',packageId});
    logger.info('savePackage completed',{packageId});
    return{packageId};
  }catch(error){
    if(error instanceof HttpsError){
      logger.warn('savePackage HttpsError',{code:error.code,message:error.message,packageId:loggedPackageId??null});
      throw error;
    }
    logger.error('savePackage unexpected failure',{
      operation:'savePackage',
      packageId:loggedPackageId??null,
      errorName:error instanceof Error?error.name:'NonErrorThrown',
      errorMessage:error instanceof Error?error.message:String(error),
      ...(error instanceof Error&&error.stack?{stack:error.stack}:{}),
      ...(typeof error==='object'&&error!==null&&'code'in error?{errorCode:String(error.code)}:{}),
    });
    throw new HttpsError('internal','Package could not be saved.');
  }
});
