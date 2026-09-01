import { Timestamp } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import { parseOperationalSettingsInput } from '../domain/operationalSettings.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { asCallableError } from './commandErrors.js';

export const saveAdminSettings=onCall<unknown>(async request=>{const actor=requireAdmin(request);try{const settings=parseOperationalSettingsInput(request.data);const updatedAt=Timestamp.now();await getAdminFirestore().collection('systemSettings').doc('operations').set({...settings,updatedAt,updatedBy:actor.uid},{merge:true});return{updatedAt:updatedAt.toDate().toISOString()}}catch(error){throw asCallableError(error)}});
