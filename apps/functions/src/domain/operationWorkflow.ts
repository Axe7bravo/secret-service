import type { OperationStatus } from './operationTypes.js';

const normalTransitions: Readonly<Record<OperationStatus, readonly OperationStatus[]>> = {
  NEW:['PAYMENT_PENDING','CANCELLED'], PAYMENT_PENDING:['PAID','CANCELLED'], PAID:['REVIEW_REQUIRED','REFUNDED','CANCELLED'],
  REVIEW_REQUIRED:['APPROVED','REJECTED','CANCELLED'], APPROVED:['PREPARING','CANCELLED'], PREPARING:['READY_FOR_DELIVERY','CANCELLED'],
  READY_FOR_DELIVERY:['AMBASSADOR_ASSIGNED','CANCELLED'], AMBASSADOR_ASSIGNED:['OUT_FOR_DELIVERY','CANCELLED'],
  OUT_FOR_DELIVERY:['DELIVERED','DELIVERY_FAILED'], DELIVERED:['COMPLETED'], DELIVERY_FAILED:['READY_FOR_DELIVERY','CANCELLED'],
  COMPLETED:[], REJECTED:[], CANCELLED:[], REFUNDED:[],
};

export interface TransitionMetadata { reason?:string;reasonCode?:string;ambassadorId?:string;reviewConfirmed?:boolean }

export const validateTransition = (from:OperationStatus,to:OperationStatus,metadata:TransitionMetadata):void => {
  if (!normalTransitions[from].includes(to)) throw new Error(`Transition ${from} -> ${to} is not allowed.`);
  if (['REJECTED','CANCELLED','DELIVERY_FAILED'].includes(to) && !metadata.reason?.trim()) throw new Error('A reason is required.');
  if (to==='AMBASSADOR_ASSIGNED' && !metadata.ambassadorId?.trim()) throw new Error('An ambassador is required.');
  if (from==='DELIVERY_FAILED' && to==='READY_FOR_DELIVERY' && metadata.reviewConfirmed!==true) throw new Error('Delivery details review must be confirmed.');
};

export const customerStatusFor = (status:OperationStatus) => {
  if (status==='PAYMENT_PENDING'||status==='NEW') return 'PAYMENT_PENDING' as const;
  if (['PAID','REVIEW_REQUIRED','APPROVED'].includes(status)) return 'CONFIRMED' as const;
  if (['PREPARING','READY_FOR_DELIVERY'].includes(status)) return 'PREPARING' as const;
  const map:Partial<Record<OperationStatus,string>>={AMBASSADOR_ASSIGNED:'DELIVERY_SCHEDULED',OUT_FOR_DELIVERY:'IN_PROGRESS',DELIVERED:'DELIVERED',COMPLETED:'COMPLETE',REJECTED:'REQUIRES_ATTENTION',CANCELLED:'CANCELLED',DELIVERY_FAILED:'DELIVERY_ISSUE',REFUNDED:'REFUNDED'};
  return map[status] as 'DELIVERY_SCHEDULED'|'IN_PROGRESS'|'DELIVERED'|'COMPLETE'|'REQUIRES_ATTENTION'|'CANCELLED'|'DELIVERY_ISSUE'|'REFUNDED';
};
