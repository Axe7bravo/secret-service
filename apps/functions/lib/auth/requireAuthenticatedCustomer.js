import { HttpsError } from 'firebase-functions/v2/https';
export const requireAuthenticatedCustomer = (request) => {
    if (!request.auth)
        throw new HttpsError('unauthenticated', 'Authentication is required.');
    return { uid: request.auth.uid };
};
