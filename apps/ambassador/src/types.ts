import type { InternalOperationStatus } from '../../../packages/firebase/src';

export type DeliveryAction = Extract<InternalOperationStatus, 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_FAILED'>;
// Admin/server models never reach React. Times are ISO strings, dates stay date-only.
export interface AssignedOperation {
  operationId: string;
  packageName: string;
  status: InternalOperationStatus;
  recipient: { name: string; phone: string; campus: string; residence: string; location: string; instructions: string };
  requestedDate: string;
  requestedWindow: string;
  assignedAt: string | null;
  startedAt: string | null;
  deliveredAt: string | null;
  updatedAt: string;
  availableActions: readonly DeliveryAction[];
}
