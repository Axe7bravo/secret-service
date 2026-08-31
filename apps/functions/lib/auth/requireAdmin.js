import { HttpsError } from 'firebase-functions/v2/https';
export const requireAdmin = (request) => {
    if (!request.auth)
        throw new HttpsError('unauthenticated', 'Authentication is required.');
    if (request.auth.token.role !== 'admin')
        throw new HttpsError('permission-denied', 'Trusted admin authorization is required.');
    return { uid: request.auth.uid };
};
