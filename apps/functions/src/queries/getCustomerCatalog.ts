import { onCall } from 'firebase-functions/v2/https';
import { requireAuthenticatedCustomer } from '../auth/requireAuthenticatedCustomer.js';
import type { CampusRecord } from '../domain/operationTypes.js';
import { loadActivePackages } from './activePackageCatalog.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { customerSafeOperationalSettings,operationalSettingsFrom } from '../domain/operationalSettings.js';

export const getCustomerCatalog=onCall(async request=>{
  requireAuthenticatedCustomer(request);
  const db=getAdminFirestore();
  const [packages,campusSnapshot,settingsSnapshot]=await Promise.all([
    loadActivePackages(db),
    db.collection('campuses').orderBy('displayOrder','asc').get(),
    db.collection('systemSettings').doc('operations').get(),
  ]);
  return{
    packages,
    campuses:campusSnapshot.docs.map(document=>document.data() as CampusRecord).filter(record=>record.active).map(record=>({campusId:record.campusId,code:record.code,name:record.name,city:record.city,displayOrder:record.displayOrder})),
    settings:customerSafeOperationalSettings(operationalSettingsFrom(settingsSnapshot.data())),
  };
});
