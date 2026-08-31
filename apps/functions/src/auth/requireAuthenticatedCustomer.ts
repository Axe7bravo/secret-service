import type { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';

export const requireAuthenticatedCustomer = (request: CallableRequest<unknown>): { uid: string } => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required.');
  return { uid: request.auth.uid };
};
