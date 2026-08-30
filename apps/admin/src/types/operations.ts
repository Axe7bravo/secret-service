export const OPERATION_STATUSES = [
  'NEW', 'PAYMENT_PENDING', 'PAID', 'REVIEW_REQUIRED', 'APPROVED', 'PREPARING',
  'READY_FOR_DELIVERY', 'AMBASSADOR_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED',
  'COMPLETED', 'REJECTED', 'CANCELLED', 'DELIVERY_FAILED', 'REFUNDED',
] as const;

export type OperationStatus = typeof OPERATION_STATUSES[number];
export type PackageType = 'Soft Revenge' | 'Office Prank Kit' | 'Anonymous Apology';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Operation {
  operationId: string;
  createdAt: string;
  packageType: PackageType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  campus: string;
  residence: string;
  deliveryLocation: string;
  deliveryNotes: string;
  requestedDeliveryDate: string;
  requestedDeliveryWindow: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  paymentDate: string | null;
  operationStatus: OperationStatus;
  moderationStatus: ModerationStatus;
  ambassador: string | null;
  anonymousMessage: string;
}
