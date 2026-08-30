import type { CustomerOperationStatus } from '../types/customer';
export type VisibleStatusKey = 'payment'|'confirmed'|'preparing'|'scheduled'|'progress'|'delivered'|'complete'|'attention'|'cancelled'|'refunded';
const mapping: Record<CustomerOperationStatus,{label:string;key:VisibleStatusKey;progress:number}> = {
  PAYMENT_PENDING:{label:'Payment Pending',key:'payment',progress:0}, PAID:{label:'Confirmed',key:'confirmed',progress:0}, REVIEW_REQUIRED:{label:'Confirmed',key:'confirmed',progress:0}, APPROVED:{label:'Confirmed',key:'confirmed',progress:0}, PREPARING:{label:'Preparing Your Operation',key:'preparing',progress:1}, READY_FOR_DELIVERY:{label:'Preparing Your Operation',key:'preparing',progress:1}, AMBASSADOR_ASSIGNED:{label:'Delivery Scheduled',key:'scheduled',progress:2}, OUT_FOR_DELIVERY:{label:'In Progress',key:'progress',progress:3}, DELIVERED:{label:'Delivered',key:'delivered',progress:4}, COMPLETED:{label:'Operation Complete',key:'complete',progress:4}, REJECTED:{label:'Requires Attention',key:'attention',progress:0}, CANCELLED:{label:'Cancelled',key:'cancelled',progress:0}, REFUNDED:{label:'Refunded',key:'refunded',progress:0}, DELIVERY_FAILED:{label:'Delivery Issue',key:'attention',progress:3},
};
export const getCustomerStatus=(status:CustomerOperationStatus)=>mapping[status];
export const isCompletedStatus=(status:CustomerOperationStatus)=>['DELIVERED','COMPLETED','CANCELLED','REFUNDED'].includes(status);
export const trackingSteps=['Operation Confirmed','Preparation Underway','Agent Assigned','Operation In Progress','Delivery Complete'] as const;
