import type { Timestamp } from 'firebase-admin/firestore';

export type OperationStatus = 'NEW'|'PAYMENT_PENDING'|'PAID'|'REVIEW_REQUIRED'|'APPROVED'|'PREPARING'|'READY_FOR_DELIVERY'|'AMBASSADOR_ASSIGNED'|'OUT_FOR_DELIVERY'|'DELIVERED'|'COMPLETED'|'REJECTED'|'CANCELLED'|'DELIVERY_FAILED'|'REFUNDED';
export type CustomerStatus = 'PAYMENT_PENDING'|'CONFIRMED'|'PREPARING'|'DELIVERY_SCHEDULED'|'IN_PROGRESS'|'DELIVERED'|'COMPLETE'|'REQUIRES_ATTENTION'|'CANCELLED'|'DELIVERY_ISSUE'|'REFUNDED';

export interface OperationRecord {
  operationId:string; customerId:string; status:OperationStatus;
  package:{packageId:string;nameSnapshot:string;priceMinor:number;currency:'ZAR'};
  recipient:{name:string;phone:string;campus:string;campusCode?:string;residence:string;deliveryLocation:string;deliveryInstructions?:string};
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

export interface PackageRecord {
  packageId:string;code:string;name:string;shortDescription:string;description?:string;
  priceMinor:number;currency:'ZAR';active:boolean;displayOrder:number;
  createdAt:Timestamp;updatedAt:Timestamp;
}

export interface AmbassadorRecord {
  ambassadorId:string;displayName:string;phone?:string;email?:string;campusCodes:string[];
  active:boolean;availability:'AVAILABLE'|'UNAVAILABLE';createdAt:Timestamp;updatedAt:Timestamp;
}

export interface CampusRecord {
  campusId:string;code:string;name:string;city:string;active:boolean;serviceNotes?:string;
  displayOrder:number;createdAt:Timestamp;updatedAt:Timestamp;
}
