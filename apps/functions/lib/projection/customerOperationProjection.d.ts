import type { Timestamp } from 'firebase-admin/firestore';
import type { OperationRecord } from '../domain/operationTypes.js';
export interface CustomerArchiveMetadata {
    archived: boolean;
    archivedAt?: Timestamp;
}
export declare const customerArchiveMetadataFrom: (value: unknown) => CustomerArchiveMetadata;
export declare const buildCustomerOperationProjection: (operation: OperationRecord, archive?: CustomerArchiveMetadata) => {
    archivedAt?: Timestamp | undefined;
    operationId: string;
    customerId: string;
    package: {
        name: string;
        amountMinor: number;
        currency: "ZAR";
    };
    status: "APPROVED" | "PREPARING" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "UNDER_REVIEW" | "PAYMENT_REQUIRED" | "CONFIRMED" | "DELIVERY_SCHEDULED" | "IN_PROGRESS" | "COMPLETE" | "REQUIRES_ATTENTION" | "DELIVERY_ISSUE";
    recipient: {
        name: string;
        campus: string;
        residence: string;
    };
    delivery: {
        deliveredAt?: Timestamp | undefined;
        requestedDate: string;
        requestedWindow: string;
        location: string;
    };
    anonymousMessage: string;
    paymentSummary: {
        status: "PAID" | "REFUNDED" | "NOT_REQUIRED_YET" | "PENDING";
        amountMinor: number;
        currency: "ZAR";
    };
    tracking: {
        status: "APPROVED" | "PREPARING" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "UNDER_REVIEW" | "PAYMENT_REQUIRED" | "CONFIRMED" | "DELIVERY_SCHEDULED" | "IN_PROGRESS" | "COMPLETE" | "REQUIRES_ATTENTION" | "DELIVERY_ISSUE";
        updatedAt: Timestamp;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
    archived: boolean;
};
//# sourceMappingURL=customerOperationProjection.d.ts.map