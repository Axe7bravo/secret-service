import { Timestamp } from 'firebase/firestore';
import type { AssignedOperation, DeliveryAction } from '../types';
import type { InternalOperationStatus } from '../../../../packages/firebase/src';

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid delivery record.');
  return value as Record<string, unknown>;
};
const string = (value: unknown): string => { if (typeof value !== 'string') throw new Error('Invalid delivery field.'); return value; };
const time = (value: unknown): string | null => {
  if (value === null) return null;
  if (!(value instanceof Timestamp)) throw new Error('Invalid delivery timestamp.');
  return value.toDate().toISOString();
};
// Restrict the read model to actual fulfilment/terminal states; this is not a lifecycle validator.
const states: readonly InternalOperationStatus[] = ['AMBASSADOR_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'DELIVERY_FAILED', 'CANCELLED', 'REFUNDED'];
export const mapAssignedOperation = (value: unknown, id: string, uid: string): AssignedOperation => {
  const data = record(value), recipient = record(data.recipient);
  if (data.operationId !== id || data.ambassadorUid !== uid) throw new Error('Assignment ownership changed.');
  const status = states.find(item => item === data.status);
  if (!status || !Array.isArray(data.availableActions)) throw new Error('Invalid delivery state.');
  const availableActions = data.availableActions.map((action: unknown): DeliveryAction => {
    if (action !== 'OUT_FOR_DELIVERY' && action !== 'DELIVERED' && action !== 'DELIVERY_FAILED') throw new Error('Invalid delivery action.');
    return action;
  });
  const updatedAt = time(data.updatedAt);
  if (!updatedAt) throw new Error('Missing delivery update timestamp.');
  return {
    operationId: id, status, packageName: string(data.packageName),
    recipient: { name: string(recipient.name), phone: string(recipient.phone), campus: string(recipient.campus), residence: string(recipient.residence), location: string(recipient.location), instructions: string(recipient.instructions) },
    requestedDate: string(data.requestedDate), requestedWindow: string(data.requestedWindow),
    assignedAt: time(data.assignedAt), startedAt: time(data.startedAt), deliveredAt: time(data.deliveredAt), updatedAt, availableActions,
  };
};
