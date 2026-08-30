export type CustomerOperationStatus = 'PAYMENT_PENDING' | 'PAID' | 'REVIEW_REQUIRED' | 'APPROVED' | 'PREPARING' | 'READY_FOR_DELIVERY' | 'AMBASSADOR_ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED' | 'DELIVERY_FAILED';
export type CustomerPackageType = 'Soft Revenge' | 'Office Prank Kit' | 'Anonymous Apology';
export interface CustomerProfile { id: string; firstName: string; lastName: string; email: string; phone: string; createdAt: string }
export interface CustomerOperation {
  operationId: string; createdAt: string; packageType: CustomerPackageType; packageDescription: string;
  recipientName: string; campus: string; deliveryLocation: string; requestedDeliveryDate: string;
  requestedDeliveryWindow: string; amount: number; paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentReference: string; paymentDate: string | null; status: CustomerOperationStatus; anonymousMessage: string;
}
