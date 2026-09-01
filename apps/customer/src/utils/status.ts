import type { CustomerOperationStatus } from '../types/customer';
export type CustomerStatusKey='review'|'approved'|'payment'|'confirmed'|'preparing'|'scheduled'|'progress'|'delivered'|'complete'|'attention'|'cancelled'|'refunded'|'issue';
export interface CustomerStatusPresentation { label:string;key:CustomerStatusKey;description:string }
const mapping:Record<CustomerOperationStatus,CustomerStatusPresentation>={
 REVIEW_REQUIRED:{label:'Under Review',key:'review',description:'Your operation is being reviewed before payment is requested.'},
 APPROVED:{label:'Approved',key:'review',description:'Your operation passed review and is being prepared for payment.'},
 PAYMENT_PENDING:{label:'Payment Required',key:'payment',description:'Your operation passed review. Payment is now required.'},
 PAID:{label:'Confirmed',key:'payment',description:'Payment is confirmed and your operation can enter preparation.'},
 PREPARING:{label:'Preparing Your Operation',key:'preparing',description:'The package and delivery plan are being prepared.'},READY_FOR_DELIVERY:{label:'Preparing Your Operation',key:'preparing',description:'Your operation is prepared for scheduling.'},
 AMBASSADOR_ASSIGNED:{label:'Delivery Scheduled',key:'scheduled',description:'Delivery has been scheduled.'},OUT_FOR_DELIVERY:{label:'In Progress',key:'progress',description:'Your operation is currently in progress.'},
 DELIVERED:{label:'Delivered',key:'delivered',description:'The package has been delivered.'},COMPLETED:{label:'Operation Complete',key:'complete',description:'Your operation is complete.'},
 REJECTED:{label:'Requires Attention',key:'attention',description:'This operation requires your attention.'},CANCELLED:{label:'Cancelled',key:'cancelled',description:'This operation has been cancelled.'},DELIVERY_FAILED:{label:'Delivery Issue',key:'issue',description:'There is an issue with delivery. Our team will follow up.'},REFUNDED:{label:'Refunded',key:'refunded',description:'The payment for this operation was refunded.'},
};
export const getCustomerStatus=(status:CustomerOperationStatus)=>mapping[status];
export const isCompletedStatus=(status:CustomerOperationStatus)=>status==='COMPLETED';
export const isClosedStatus=(status:CustomerOperationStatus)=>['COMPLETED','REJECTED','CANCELLED','REFUNDED'].includes(status);
export const isArchiveEligible=(status:CustomerOperationStatus)=>['COMPLETED','REJECTED','CANCELLED','REFUNDED'].includes(status);
export const trackingStages=[{key:'review',label:'Review & Approval'},{key:'payment',label:'Payment & Confirmation'},{key:'preparing',label:'Preparing Your Operation'},{key:'scheduled',label:'Delivery Scheduled'},{key:'progress',label:'In Progress'},{key:'delivered',label:'Delivered'},{key:'complete',label:'Operation Complete'}] as const;
