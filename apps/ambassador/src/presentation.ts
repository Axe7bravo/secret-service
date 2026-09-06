import type { AssignedOperation, DeliveryAction } from './types';

export const actionLabels: Record<DeliveryAction, string> = { OUT_FOR_DELIVERY: 'Start Delivery', DELIVERED: 'Mark Delivered', DELIVERY_FAILED: 'Report Delivery Issue' };
export const statusLabel = (status: AssignedOperation['status']): string => {
  const labels: Partial<Record<AssignedOperation['status'], string>> = { AMBASSADOR_ASSIGNED: 'Assigned', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', COMPLETED: 'Completed', DELIVERY_FAILED: 'Delivery Issue', CANCELLED: 'Cancelled', REFUNDED: 'Refunded' };
  return labels[status] ?? 'Unavailable';
};
// Calendar values are deliberately not passed to new Date(): no UTC date shifting.
export const calendarDate = (value: string): string => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value;
export const timestamp = (value: string | null): string => value ? new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded';
