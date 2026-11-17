import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import type { PackageRecord } from '../domain/operationTypes.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { packageIdPattern, packageImageFor, retirePackageImage, uploadPackageImage, verifyPackageImage } from '../domain/packageImages.js';

interface SavePackageInput { packageId?:string;code:string;name:string;shortDescription:string;description?:string;priceMinor:number;active:boolean;displayOrder:number }
const text=(value:unknown,label:string,max:number):string=>{if(typeof value!=='string'||!value.trim())throw new HttpsError('invalid-argument',`${label} is required.`);const result=value.trim();if(result.length>max)throw new HttpsError('invalid-argument',`${label} is too long.`);return result};
const parse=(value:unknown):SavePackageInput=>{if(typeof value!=='object'||value===null)throw new HttpsError('invalid-argument','Package data is required.');const input=value as Record<string,unknown>;const code=text(input.code,'Package code',64).toLowerCase();if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code))throw new HttpsError('invalid-argument','Package code must use lowercase letters, numbers, and single hyphens.');if(typeof input.priceMinor!=='number'||!Number.isInteger(input.priceMinor)||input.priceMinor<0)throw new HttpsError('invalid-argument','Price must be a non-negative integer in cents.');if(typeof input.displayOrder!=='number'||!Number.isInteger(input.displayOrder)||input.displayOrder<0)throw new HttpsError('invalid-argument','Display order must be a non-negative integer.');if(typeof input.active!=='boolean')throw new HttpsError('invalid-argument','Active state is required.');return{...(typeof input.packageId==='string'&&input.packageId.trim()?{packageId:input.packageId.trim()}:{}),code,name:text(input.name,'Package name',120),shortDescription:text(input.shortDescription,'Short description',240),...(typeof input.description==='string'&&input.description.trim()?{description:text(input.description,'Description',2000)}:{}),priceMinor:input.priceMinor,active:input.active,displayOrder:input.displayOrder}};

export const savePackage=onCall<unknown>({ memory: '512MiB', concurrency: 2, maxInstances: 5 }, async request=>{
  logger.info('savePackage invoked',{uid:request.auth?.uid??null});
  let loggedPackageId:string|undefined;
  try{
    requireAdmin(request);
    const input=parse(request.data);
    const packageId=input.packageId??input.code;
    if (!packageIdPattern.test(packageId)) throw new HttpsError('invalid-argument','Invalid package ID.');
    if (!Number.isSafeInteger(input.priceMinor) || (input.active && input.priceMinor <= 0)) {
      throw new HttpsError('invalid-argument','Published packages need a positive price in cents.');
    }
    if (!Number.isSafeInteger(input.displayOrder)) throw new HttpsError('invalid-argument','Display order is outside the supported range.');
    loggedPackageId=packageId;
    const db=getAdminFirestore();const ref=db.collection('packages').doc(packageId);const now=Timestamp.now();
    const encoded = (request.data as Record<string, unknown>).imageBase64;
    const editedPackage=(snapshot: DocumentSnapshot) => {
      if(input.packageId&&!snapshot.exists)throw new HttpsError('not-found','Package no longer exists.');
      if(!input.packageId&&snapshot.exists)throw new HttpsError('already-exists','A package with that code already exists.');
      const existing = snapshot.data() as PackageRecord | undefined;
      if(existing && (existing.code!==input.code || existing.packageId!==packageId))throw new HttpsError('failed-precondition','Package code is a stable identifier and cannot be changed.');
      return existing;
    };
    const before = await ref.get();
    editedPackage(before);
    const replacement = encoded === undefined ? undefined : await uploadPackageImage(packageId, encoded);
    const commit = () => db.runTransaction(async transaction=>{
      const snapshot=await transaction.get(ref);
      const existing=editedPackage(snapshot);
      const previous = packageImageFor(packageId, existing?.image);
      const image = replacement ?? previous;
      if(input.active && !image) throw new HttpsError('failed-precondition','Upload a valid primary image before publishing this package.');
      if(input.active && image && !replacement) await verifyPackageImage(image);
      if(replacement && before.updateTime && (!snapshot.updateTime || !before.updateTime.isEqual(snapshot.updateTime))) {
        throw new HttpsError('aborted','This package changed during upload. Reopen it and try again.');
      }
      const record:PackageRecord={packageId,code:input.code,name:input.name,shortDescription:input.shortDescription,...(input.description?{description:input.description}:{}),priceMinor:input.priceMinor,currency:'ZAR',active:input.active,displayOrder:input.displayOrder,createdAt:existing?.createdAt??now,updatedAt:now,...(image?{image}:{})};
      transaction.set(ref,record);
      return replacement ? previous : undefined;
    });
    const retired = await commit().catch(async (error: unknown) => {
      if (replacement && error instanceof HttpsError) {
        // Application validation failed before any write. Infrastructure errors
        // can have an unknown commit outcome, so retain the new object then.
        try { await retirePackageImage(replacement); }
        catch { logger.warn('Unattached package image needs cleanup', { packageId, imageId: replacement.id }); }
      }
      throw error;
    });
    if (retired) {
      try { await retirePackageImage(retired); }
      catch { logger.warn('Package image retirement needs cleanup', { packageId, imageId: retired.id }); }
    }
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
