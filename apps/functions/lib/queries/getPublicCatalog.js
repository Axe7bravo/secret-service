import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { loadActivePackages } from './activePackageCatalog.js';
// Intentionally anonymous: only marketing fields, no writes or caller-supplied query.
export const getPublicCatalog = onCall(async () => {
    try {
        return { packages: await loadActivePackages(getAdminFirestore()) };
    }
    catch (error) {
        logger.error('Public catalogue load failed', { message: error instanceof Error ? error.message : 'Unknown catalogue error' });
        throw new HttpsError('unavailable', 'The package catalogue is temporarily unavailable. Please try again.');
    }
});
