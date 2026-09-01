import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import { validateTransition } from '../domain/operationWorkflow.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { buildCustomerOperationProjection, customerArchiveMetadataFrom } from '../projection/customerOperationProjection.js';
const normalize = (value) => value.trim().toLocaleLowerCase('en-ZA').replace(/\s+/g, '-');
const eligible = (ambassador, operation) => ambassador.campusCodes.length === 0 || ambassador.campusCodes.includes(operation.recipient.campusCode ?? normalize(operation.recipient.campus));
export const assignAmbassador = onCall(async (request) => {
    const actor = requireAdmin(request);
    const operationId = request.data.operationId?.trim();
    const ambassadorId = request.data.ambassadorId?.trim();
    if (!operationId || !ambassadorId)
        throw new HttpsError('invalid-argument', 'Operation and ambassador are required.');
    const db = getAdminFirestore();
    const operationRef = db.collection('operations').doc(operationId);
    const ambassadorRef = db.collection('ambassadors').doc(ambassadorId);
    const projectionRef = db.collection('customerOperations').doc(operationId);
    const activityRef = db.collection('operationActivity').doc();
    await db.runTransaction(async (transaction) => { const [operationSnapshot, ambassadorSnapshot, projectionSnapshot] = await Promise.all([transaction.get(operationRef), transaction.get(ambassadorRef), transaction.get(projectionRef)]); if (!operationSnapshot.exists)
        throw new HttpsError('not-found', 'Operation not found.'); if (!ambassadorSnapshot.exists)
        throw new HttpsError('failed-precondition', 'Ambassador no longer exists.'); const operation = operationSnapshot.data(); const ambassador = ambassadorSnapshot.data(); if (!ambassador.active || ambassador.availability !== 'AVAILABLE')
        throw new HttpsError('failed-precondition', 'Ambassador is not available for assignment.'); if (!eligible(ambassador, operation))
        throw new HttpsError('failed-precondition', 'Ambassador does not service this campus.'); if (!['READY_FOR_DELIVERY', 'AMBASSADOR_ASSIGNED'].includes(operation.status))
        throw new HttpsError('failed-precondition', 'Operation is not available for assignment.'); if (operation.delivery.assignedAmbassadorId === ambassadorId)
        throw new HttpsError('already-exists', 'This ambassador is already assigned.'); const nextStatus = operation.status === 'READY_FOR_DELIVERY' ? 'AMBASSADOR_ASSIGNED' : operation.status; if (operation.status === 'READY_FOR_DELIVERY')
        validateTransition(operation.status, nextStatus, { ambassadorId }); const now = Timestamp.now(); const delivery = { ...operation.delivery, assignedAmbassadorId: ambassadorId }; const next = { ...operation, status: nextStatus, delivery, updatedAt: now }; transaction.update(operationRef, { status: nextStatus, delivery, updatedAt: now }); transaction.set(projectionRef, buildCustomerOperationProjection(next, customerArchiveMetadataFrom(projectionSnapshot.data()))); transaction.create(activityRef, { operationId, type: operation.status === 'READY_FOR_DELIVERY' ? 'AMBASSADOR_ASSIGNED' : 'AMBASSADOR_REASSIGNED', timestamp: now, actorId: actor.uid, actorRole: 'ADMIN', fromStatus: operation.status, toStatus: nextStatus, note: `Ambassador reference: ${ambassadorId}` }); });
    return { operationId, ambassadorId };
});
