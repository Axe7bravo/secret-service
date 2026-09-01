import type { Operation, OperationStatus } from '../types/operations';
export interface TransitionContext { actor?:string; note?:string; ambassador?:string; reviewConfirmed?:boolean }
export interface WorkflowAction { id:string; label:string; from:readonly OperationStatus[]; toStatus:OperationStatus; tone?:'primary'|'danger'; form?:'reason'|'ambassador'|'retry-review' }
const cancellable:readonly OperationStatus[]=['NEW','PAYMENT_PENDING','PAID','REVIEW_REQUIRED','APPROVED','PREPARING','READY_FOR_DELIVERY','AMBASSADOR_ASSIGNED','DELIVERY_FAILED'];
export const WORKFLOW_ACTIONS:readonly WorkflowAction[]=[
 {id:'approve',label:'Approve operation',from:['REVIEW_REQUIRED'],toStatus:'APPROVED',tone:'primary'},
 {id:'reject',label:'Reject operation',from:['REVIEW_REQUIRED'],toStatus:'REJECTED',tone:'danger',form:'reason'},
 {id:'prepare',label:'Start preparation',from:['PAID'],toStatus:'PREPARING',tone:'primary'},
 {id:'ready',label:'Mark ready for delivery',from:['PREPARING'],toStatus:'READY_FOR_DELIVERY',tone:'primary'},
 {id:'assign',label:'Assign ambassador',from:['READY_FOR_DELIVERY'],toStatus:'AMBASSADOR_ASSIGNED',tone:'primary',form:'ambassador'},
 {id:'dispatch',label:'Mark out for delivery',from:['AMBASSADOR_ASSIGNED'],toStatus:'OUT_FOR_DELIVERY',tone:'primary'},
 {id:'delivered',label:'Mark delivered',from:['OUT_FOR_DELIVERY'],toStatus:'DELIVERED',tone:'primary'},
 {id:'failed',label:'Mark delivery failed',from:['OUT_FOR_DELIVERY'],toStatus:'DELIVERY_FAILED',tone:'danger',form:'reason'},
 {id:'complete',label:'Complete operation',from:['DELIVERED'],toStatus:'COMPLETED',tone:'primary'},
 {id:'retry',label:'Retry delivery',from:['DELIVERY_FAILED'],toStatus:'READY_FOR_DELIVERY',tone:'primary',form:'retry-review'},
 {id:'cancel',label:'Cancel operation',from:cancellable,toStatus:'CANCELLED',tone:'danger',form:'reason'},
];
export const getAvailableActions=(status:OperationStatus)=>WORKFLOW_ACTIONS.filter(action=>action.from.includes(status));
export function transitionOperation(operation:Operation,toStatus:OperationStatus,context:TransitionContext={}):Operation {
 const action=WORKFLOW_ACTIONS.find(item=>item.toStatus===toStatus&&item.from.includes(operation.operationStatus));
 if(!action) throw new Error(`Cannot move from ${operation.operationStatus} to ${toStatus}.`);
 const note=context.note?.trim();
 if(action.form==='reason'&&!note) throw new Error('A reason is required.');
 if(action.form==='ambassador'&&!context.ambassador) throw new Error('Select an ambassador.');
 if(action.form==='retry-review'&&!context.reviewConfirmed) throw new Error('Confirm delivery details were reviewed.');
 const reviewed=toStatus==='APPROVED'||toStatus==='REJECTED';
 const finalStatus=toStatus==='APPROVED'?'PAYMENT_PENDING':toStatus;
 const timestamp=new Date().toISOString();
 const activity:Operation['activity']=[...operation.activity,{id:`activity-${Date.now()}-${Math.random()}`,timestamp,actor:context.actor??'Admin User',fromStatus:operation.operationStatus,toStatus,note:note??(context.ambassador?`Assigned to ${context.ambassador}`:undefined)}];
 if(toStatus==='APPROVED')activity.push({id:`activity-${Date.now()}-${Math.random()}`,timestamp,actor:'Trusted workflow',fromStatus:'APPROVED',toStatus:'PAYMENT_PENDING',note:'Moderation approved; payment is now required.'});
 return {...operation,operationStatus:finalStatus,paymentStatus:toStatus==='APPROVED'?'PENDING':operation.paymentStatus,moderationStatus:toStatus==='APPROVED'?'APPROVED':toStatus==='REJECTED'?'REJECTED':operation.moderationStatus,moderationReviewedBy:reviewed?(context.actor??'Admin User'):operation.moderationReviewedBy,moderationReviewedAt:reviewed?timestamp:operation.moderationReviewedAt,
  ambassador:toStatus==='AMBASSADOR_ASSIGNED'?context.ambassador??null:operation.operationStatus==='DELIVERY_FAILED'&&toStatus==='READY_FOR_DELIVERY'?null:operation.ambassador,
  rejectionReason:toStatus==='REJECTED'?note:operation.rejectionReason,cancellationReason:toStatus==='CANCELLED'?note:operation.cancellationReason,deliveryFailureReason:toStatus==='DELIVERY_FAILED'?note:operation.deliveryFailureReason,
  activity};
}
