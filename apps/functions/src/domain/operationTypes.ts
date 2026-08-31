import type { Timestamp } from 'firebase-admin/firestore';

export type OperationStatus = 'NEW'|'PAYMENT_PENDING'|'PAID'|'REVIEW_REQUIRED'|'APPROVED'|'PREPARING'|'READY_FOR_DELIVERY'|'AMBASSADOR_ASSIGNED'|'OUT_FOR_DELIVERY'|'DELIVERED'|'COMPLETED'|'REJECTED'|'CANCELLED'|'DELIVERY_FAILED'|'REFUNDED';
export type CustomerStatus = 'PAYMENT_PENDING'|'CONFIRMED'|'PREPARING'|'DELIVERY_SCHEDULED'|'IN_PROGRESS'|'DELIVERED'|'COMPLETE'|'REQUIRES_ATTENTION'|'CANCELLED'|'DELIVERY_ISSUE'|'REFUNDED';

export interface OperationRecord {
  operationId:string; customerId:string; status:OperationStatus;
  package:{packageId:string;nameSnapshot:string;priceMinor:number;currency:'ZAR'};
  recipient:{name:string;phone:string;campus:string;residence:string;deliveryLocation:string;deliveryInstructions?:string};
  delivery:{requestedDate:string;requestedWindow:string;assignedAmbassadorId?:string;deliveredAt?:Timestamp};
  anonymousMessage:string;
  paymentSummary:{status:'PENDING'|'PAID'|'REFUNDED'|'FAILED';amountMinor:number;currency:'ZAR';paidAt?:Timestamp};
  createdAt:Timestamp;updatedAt:Timestamp;
}

export interface OperationInternalRecord {
  operationId:string;
  moderation:{status:'PENDING'|'APPROVED'|'REJECTED';reviewedBy?:string;reviewedAt?:Timestamp;reasonCode?:string;reasonNote?:string};
  delivery:{retryCount:number;failureReasonCode?:string;failureDetails?:string;internalNotes?:string};
  safetyFlags:string[]; staffNotes?:string; updatedAt:Timestamp;
}
