import type { CustomerOperationStatus } from '../types/customer';
export type CustomerStatusKey='payment'|'confirmed'|'preparing'|'delivery'|'complete'|'attention';
export interface CustomerStatusPresentation { label:string;key:CustomerStatusKey;progress:number;description:string }
const mapping:Record<CustomerOperationStatus,CustomerStatusPresentation>={
 PAYMENT_PENDING:{label:'Payment Pending',key:'payment',progress:0,description:'Payment is required before the operation can proceed.'},
 PAID:{label:'Confirmed',key:'confirmed',progress:25,description:'Your operation has been confirmed.'},REVIEW_REQUIRED:{label:'Confirmed',key:'confirmed',progress:25,description:'Your operation has been confirmed.'},APPROVED:{label:'Confirmed',key:'confirmed',progress:25,description:'Your operation has been confirmed.'},
 PREPARING:{label:'Preparing Your Operation',key:'preparing',progress:50,description:'The package and delivery plan are being prepared.'},READY_FOR_DELIVERY:{label:'Preparing Your Operation',key:'preparing',progress:50,description:'Your operation is prepared for scheduling.'},
 AMBASSADOR_ASSIGNED:{label:'Delivery Scheduled',key:'delivery',progress:65,description:'Delivery has been scheduled.'},OUT_FOR_DELIVERY:{label:'In Progress',key:'delivery',progress:75,description:'Your operation is currently in progress.'},
 DELIVERED:{label:'Delivered',key:'complete',progress:90,description:'The package has been delivered.'},COMPLETED:{label:'Operation Complete',key:'complete',progress:100,description:'Your operation is complete.'},
 REJECTED:{label:'Requires Attention',key:'attention',progress:25,description:'This operation requires your attention.'},CANCELLED:{label:'Cancelled',key:'attention',progress:0,description:'This operation has been cancelled.'},DELIVERY_FAILED:{label:'Delivery Issue',key:'attention',progress:65,description:'There is an issue with delivery. Our team will follow up.'},REFUNDED:{label:'Refunded',key:'attention',progress:0,description:'The payment for this operation was refunded.'},
};
export const getCustomerStatus=(status:CustomerOperationStatus)=>mapping[status];
export const isCompletedStatus=(status:CustomerOperationStatus)=>['DELIVERED','COMPLETED','CANCELLED','REFUNDED'].includes(status);
export const trackingStages=[{key:'payment',label:'Payment'},{key:'confirmed',label:'Confirmed'},{key:'preparing',label:'Preparation'},{key:'delivery',label:'Delivery'},{key:'complete',label:'Complete'}] as const;
