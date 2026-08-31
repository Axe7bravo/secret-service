import type { OperationStatus } from '../types/operations';

const statusTone: Record<OperationStatus, string> = {
  NEW: 'neutral', PAYMENT_PENDING: 'attention', PAID: 'neutral', REVIEW_REQUIRED: 'attention', APPROVED: 'neutral', PREPARING: 'active', READY_FOR_DELIVERY: 'active', AMBASSADOR_ASSIGNED: 'active', OUT_FOR_DELIVERY: 'active', DELIVERED: 'success', COMPLETED: 'success', REJECTED: 'danger', CANCELLED: 'danger', DELIVERY_FAILED: 'danger', REFUNDED: 'neutral',
};

export function OperationStatusBadge({ status }: { status: OperationStatus }) {
  return <span className={`status-badge status-${statusTone[status]}`}>{status.replaceAll('_', ' ')}</span>;
}
