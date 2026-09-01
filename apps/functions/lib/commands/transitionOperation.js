import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import { asCallableError } from './commandErrors.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { validateTransition } from '../domain/operationWorkflow.js';
import { buildCustomerOperationProjection, customerArchiveMetadataFrom } from '../projection/customerOperationProjection.js';
export const transitionOperation = onCall(async (request) => {
    const actor = requireAdmin(request);
    try {
        const { operationId, toStatus } = request.data;
        const metadata = request.data.metadata ?? {};
        if (!operationId?.trim() || !toStatus)
            throw new HttpsError('invalid-argument', 'Operation ID and target status are required.');
        const db = getAdminFirestore();
        const operationRef = db.collection('operations').doc(operationId);
        const internalRef = db.collection('operationInternal').doc(operationId);
        const projectionRef = db.collection('customerOperations').doc(operationId);
        const activityRef = db.collection('operationActivity').doc();
        await db.runTransaction(async (transaction) => {
            const [operationSnapshot, internalSnapshot, projectionSnapshot] = await Promise.all([transaction.get(operationRef), transaction.get(internalRef), transaction.get(projectionRef)]);
            if (!operationSnapshot.exists)
                throw new HttpsError('not-found', 'Operation not found.');
            const operation = operationSnapshot.data();
            const internal = (internalSnapshot.exists ? internalSnapshot.data() : { operationId, moderation: { status: 'PENDING' }, delivery: { retryCount: 0 }, safetyFlags: [] });
            validateTransition(operation.status, toStatus, metadata);
            if (toStatus === 'AMBASSADOR_ASSIGNED' && metadata.ambassadorId) {
                const ambassadorSnapshot = await transaction.get(db.collection('ambassadors').doc(metadata.ambassadorId));
                if (!ambassadorSnapshot.exists)
                    throw new HttpsError('failed-precondition', 'Ambassador no longer exists.');
                const ambassador = ambassadorSnapshot.data();
                const campus = operation.recipient.campusCode ?? operation.recipient.campus.trim().toLocaleLowerCase('en-ZA').replace(/\s+/g, '-');
                if (!ambassador.active || ambassador.availability !== 'AVAILABLE' || (ambassador.campusCodes.length > 0 && !ambassador.campusCodes.includes(campus)))
                    throw new HttpsError('failed-precondition', 'Ambassador is not eligible for this operation.');
            }
            const now = Timestamp.now();
            const nextDelivery = { ...operation.delivery };
            if (toStatus === 'AMBASSADOR_ASSIGNED')
                nextDelivery.assignedAmbassadorId = metadata.ambassadorId;
            if (toStatus === 'DELIVERED')
                nextDelivery.deliveredAt = now;
            if (operation.status === 'DELIVERY_FAILED' && toStatus === 'READY_FOR_DELIVERY')
                delete nextDelivery.assignedAmbassadorId;
            const next = { ...operation, status: toStatus, updatedAt: now, delivery: nextDelivery };
            const operationUpdate = { status: toStatus, updatedAt: now, delivery: nextDelivery };
            const nextModeration = { ...internal.moderation };
            if (toStatus === 'APPROVED')
                Object.assign(nextModeration, { status: 'APPROVED', reviewedBy: actor.uid, reviewedAt: now });
            if (toStatus === 'REJECTED')
                Object.assign(nextModeration, { status: 'REJECTED', reviewedBy: actor.uid, reviewedAt: now, reasonNote: metadata.reason?.trim() }, metadata.reasonCode ? { reasonCode: metadata.reasonCode } : {});
            const nextInternalDelivery = { ...internal.delivery };
            if (toStatus === 'DELIVERY_FAILED')
                Object.assign(nextInternalDelivery, { failureDetails: metadata.reason?.trim() }, metadata.reasonCode ? { failureReasonCode: metadata.reasonCode } : {});
            if (operation.status === 'DELIVERY_FAILED' && toStatus === 'READY_FOR_DELIVERY') {
                nextInternalDelivery.retryCount += 1;
                delete nextInternalDelivery.failureReasonCode;
                delete nextInternalDelivery.failureDetails;
            }
            const nextInternal = { ...internal, updatedAt: now, moderation: nextModeration, delivery: nextInternalDelivery, ...(toStatus === 'CANCELLED' ? { staffNotes: metadata.reason?.trim() } : {}) };
            const activityNote = metadata.reason?.trim() ?? (toStatus === 'AMBASSADOR_ASSIGNED' && metadata.ambassadorId ? `Assigned ambassador: ${metadata.ambassadorId}` : operation.status === 'DELIVERY_FAILED' && toStatus === 'READY_FOR_DELIVERY' ? 'Delivery details reviewed for retry' : undefined);
            transaction.update(operationRef, operationUpdate);
            transaction.set(internalRef, nextInternal);
            transaction.set(projectionRef, buildCustomerOperationProjection(next, customerArchiveMetadataFrom(projectionSnapshot.data())));
            transaction.create(activityRef, { operationId, type: 'STATUS_TRANSITION', timestamp: now, actorId: actor.uid, actorRole: 'ADMIN', fromStatus: operation.status, toStatus, ...(metadata.reasonCode ? { reasonCode: metadata.reasonCode } : {}), ...(activityNote ? { note: activityNote } : {}) });
        });
        return { operationId, toStatus };
    }
    catch (error) {
        throw asCallableError(error);
    }
});
