import type { Firestore, Transaction } from 'firebase-admin/firestore';
import type { OperationRecord } from '../domain/operationTypes.js';
import { ambassadorActionsFor } from '../domain/operationWorkflow.js';

// A full replacement is deliberate: no payment, sender, moderation or staff data.
export const buildAmbassadorOperationProjection = (operation: OperationRecord) => ({
  operationId: operation.operationId,
  ambassadorUid: operation.delivery.assignedAmbassadorUid,
  ambassadorId: operation.delivery.assignedAmbassadorId,
  packageName: operation.package.nameSnapshot,
  status: operation.status,
  recipient: {
    name: operation.recipient.name, phone: operation.recipient.phone,
    campus: operation.recipient.campus, residence: operation.recipient.residence,
    location: operation.recipient.deliveryLocation,
    instructions: operation.recipient.deliveryInstructions ?? '',
  },
  requestedDate: operation.delivery.requestedDate,
  requestedWindow: operation.delivery.requestedWindow,
  assignedAt: operation.delivery.assignedAt ?? null,
  startedAt: operation.delivery.startedAt ?? null,
  deliveredAt: operation.delivery.deliveredAt ?? null,
  updatedAt: operation.updatedAt,
  availableActions: ambassadorActionsFor(operation.status),
});

export const writeAmbassadorOperationProjection = (transaction: Transaction, db: Firestore, operation: OperationRecord): void => {
  const ref = db.collection('ambassadorOperations').doc(operation.operationId);
  if (!operation.delivery.assignedAmbassadorId || !operation.delivery.assignedAmbassadorUid) {
    transaction.delete(ref);
    return;
  }
  transaction.set(ref, buildAmbassadorOperationProjection(operation));
};
