import { onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import { operationalSettingsFrom } from '../domain/operationalSettings.js';
import { getAdminFirestore } from '../firebaseAdmin.js';

export const getAdminSettings=onCall(async request=>{requireAdmin(request);const snapshot=await getAdminFirestore().collection('systemSettings').doc('operations').get();const settings=operationalSettingsFrom(snapshot.data());return{...settings,updatedAt:settings.updatedAt?.toDate().toISOString()??null,updatedBy:settings.updatedBy??null}});
