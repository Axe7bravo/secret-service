export const OPERATION_STATUSES = ['NEW','PAYMENT_PENDING','PAID','REVIEW_REQUIRED','APPROVED','PREPARING','READY_FOR_DELIVERY','AMBASSADOR_ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','REJECTED','CANCELLED','DELIVERY_FAILED','REFUNDED'] as const;
export type OperationStatus = typeof OPERATION_STATUSES[number];
export interface OperationActivity { id:string; timestamp:string; actor:string; fromStatus?:OperationStatus; toStatus:OperationStatus; note?:string }
export interface Operation {
  operationId:string; createdAt:string; packageType:string; customerName:string; email:string; phone:string;
  recipientName:string; recipientPhone:string; campus:string; residence:string; deliveryLocation:string; deliveryNotes:string;
  requestedDeliveryDate:string; requestedDeliveryWindow:string; amount:number; paymentStatus:'PENDING'|'PAID'|'REFUNDED'|'FAILED';
  paymentReference:string; paymentDate:string|null; operationStatus:OperationStatus; moderationStatus:'PENDING'|'APPROVED'|'REJECTED';
  ambassador:string|null; anonymousMessage:string; rejectionReason?:string; cancellationReason?:string; deliveryFailureReason?:string; activity:OperationActivity[];
}
