import type { OperationStatus } from './operationTypes.js';
export interface TransitionMetadata {
    reason?: string;
    reasonCode?: string;
    ambassadorId?: string;
    reviewConfirmed?: boolean;
}
export declare const validateTransition: (from: OperationStatus, to: OperationStatus, metadata: TransitionMetadata) => void;
export declare const customerStatusFor: (status: OperationStatus) => "PAYMENT_PENDING" | "PREPARING" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "CONFIRMED" | "DELIVERY_SCHEDULED" | "IN_PROGRESS" | "COMPLETE" | "REQUIRES_ATTENTION" | "DELIVERY_ISSUE";
//# sourceMappingURL=operationWorkflow.d.ts.map