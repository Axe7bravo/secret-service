import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { getAdminFirestore } from '../firebaseAdmin.js';
import type { AmbassadorRecord, OperationInternalRecord, OperationRecord } from '../domain/operationTypes.js';
import { ambassadorActionsFor, validateTransition, type AmbassadorAction } from '../domain/operationWorkflow.js';
import { buildCustomerOperationProjection, customerArchiveMetadataFrom } from '../projection/customerOperationProjection.js';
import { writeAmbassadorOperationProjection } from '../projection/ambassadorOperationProjection.js';
import { asCallableError } from './commandErrors.js';

export const ambassadorTransitionOperation = onCall<unknown>(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to continue.');
  if (request.auth.token.role !== 'ambassador') throw new HttpsError('permission-denied', 'Ambassador access is required.');
  const uid = request.auth.uid;
  try {
    if (typeof request.data !== 'object' || request.data === null) throw new HttpsError('invalid-argument', 'An operation and action are required.');
    const data = request.data as Record<string, unknown>;
    if (Object.keys(data).some(key => !['operationId', 'toStatus', 'reason'].includes(key))) throw new HttpsError('invalid-argument', 'Unsupported action fields.');
    if (typeof data.operationId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(data.operationId)) throw new HttpsError('invalid-argument', 'Invalid operation reference.');
    if (data.toStatus !== 'OUT_FOR_DELIVERY' && data.toStatus !== 'DELIVERED' && data.toStatus !== 'DELIVERY_FAILED') throw new HttpsError('permission-denied', 'This action is not available to ambassadors.');
    const operationId = data.operationId;
    const toStatus: AmbassadorAction = data.toStatus;
    if (data.reason !== undefined && (typeof data.reason !== 'string' || data.reason.length > 500)) throw new HttpsError('invalid-argument', 'Use a reason of at most 500 characters.');
    const reason = typeof data.reason === 'string' ? data.reason.trim() : '';
    if (toStatus === 'DELIVERY_FAILED' && !reason) throw new HttpsError('invalid-argument', 'A delivery issue reason is required.');
    const db = getAdminFirestore();
    const ref = db.collection('operations').doc(operationId);
    const customerRef = db.collection('customerOperations').doc(operationId);
    const internalRef = db.collection('operationInternal').doc(operationId);
    const activityRef = db.collection('operationActivity').doc();
    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      const operation = snapshot.data() as OperationRecord | undefined;
      // Same safe response for missing and unrelated operations.
      if (!operation || operation.delivery.assignedAmbassadorUid !== uid || !operation.delivery.assignedAmbassadorId) throw new HttpsError('permission-denied', 'This assignment is no longer available to you.');
      const [rosterSnapshot, customerSnapshot, internalSnapshot, accountSnapshot] = await Promise.all([
        transaction.get(db.collection('ambassadors').doc(operation.delivery.assignedAmbassadorId)),
        transaction.get(customerRef), transaction.get(internalRef),
        transaction.get(db.collection('ambassadorAccounts').doc(uid)),
      ]);
      const roster = rosterSnapshot.data() as AmbassadorRecord | undefined;
      if (!roster?.active || roster.authUid !== uid) throw new HttpsError('permission-denied', 'Your operational access is unavailable. Contact Admin.');
      if (accountSnapshot.data()?.ambassadorId !== operation.delivery.assignedAmbassadorId) throw new HttpsError('permission-denied', 'Your operational account link needs Admin attention.');
      // Availability controls new assignments; it does not strand an existing delivery.
      if (!ambassadorActionsFor(operation.status).includes(toStatus)) throw new HttpsError('failed-precondition', 'The operation changed. Review its latest status before trying again.');
      validateTransition(operation.status, toStatus, { reason });
      const now = Timestamp.now();
      const delivery = { ...operation.delivery,
        ...(toStatus === 'OUT_FOR_DELIVERY' ? { startedAt: now } : {}),
        ...(toStatus === 'DELIVERED' ? { deliveredAt: now } : {}),
      };
      const next: OperationRecord = { ...operation, status: toStatus, delivery, updatedAt: now };
      transaction.update(ref, { status: toStatus, delivery, updatedAt: now });
      if (toStatus === 'DELIVERY_FAILED') {
        const internal = internalSnapshot.data() as OperationInternalRecord | undefined;
        if (!internal) throw new HttpsError('failed-precondition', 'Delivery records need Admin attention.');
        transaction.update(internalRef, { delivery: { ...internal.delivery, failureDetails: reason }, updatedAt: now });
      }
      transaction.create(activityRef, {
        operationId, type: 'STATUS_TRANSITION', timestamp: now, actorId: uid, actorRole: 'AMBASSADOR',
        fromStatus: operation.status, toStatus,
        ...(toStatus === 'DELIVERY_FAILED' ? { note: reason } : {}),
      });
      transaction.set(customerRef, buildCustomerOperationProjection(next, customerArchiveMetadataFrom(customerSnapshot.data())));
      writeAmbassadorOperationProjection(transaction, db, next);
    });
    return { operationId, toStatus };
  } catch (error) { throw asCallableError(error); }
});
