import { onCall } from 'firebase-functions/v2/https';
import { requireAuthenticatedCustomer } from '../auth/requireAuthenticatedCustomer.js';
import type { CampusRecord,PackageRecord } from '../domain/operationTypes.js';
import { getAdminFirestore } from '../firebaseAdmin.js';

export const getCustomerCatalog=onCall(async request=>{
  requireAuthenticatedCustomer(request);
  const db=getAdminFirestore();
  const [packageSnapshot,campusSnapshot]=await Promise.all([
    db.collection('packages').orderBy('displayOrder','asc').get(),
    db.collection('campuses').orderBy('displayOrder','asc').get(),
  ]);
  return{
    packages:packageSnapshot.docs.map(document=>document.data() as PackageRecord).filter(record=>record.active).map(record=>({packageId:record.packageId,code:record.code,name:record.name,description:record.description??record.shortDescription,priceMinor:record.priceMinor,currency:record.currency,displayOrder:record.displayOrder})),
    campuses:campusSnapshot.docs.map(document=>document.data() as CampusRecord).filter(record=>record.active).map(record=>({campusId:record.campusId,code:record.code,name:record.name,city:record.city,displayOrder:record.displayOrder})),
  };
});
