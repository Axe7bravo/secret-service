import type { OperationRecord } from '../domain/operationTypes.js';
export declare const buildCustomerOperationProjection: (operation: OperationRecord) => {
    operationId: string;
    customerId: string;
    package: {
        name: string;
        amountMinor: number;
        currency: "ZAR";
    };
    status: "PAYMENT_PENDING" | "PREPARING" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "CONFIRMED" | "DELIVERY_SCHEDULED" | "IN_PROGRESS" | "COMPLETE" | "REQUIRES_ATTENTION" | "DELIVERY_ISSUE";
    recipient: {
        name: string;
        campus: string;
        residence: string;
    };
    delivery: {
        deliveredAt?: FirebaseFirestore.Timestamp | undefined;
        requestedDate: string;
        requestedWindow: string;
        location: string;
    };
    anonymousMessage: string;
    paymentSummary: {
        status: "PAID" | "REFUNDED" | "PENDING";
        amountMinor: number;
        currency: "ZAR";
    };
    tracking: {
        status: "PAYMENT_PENDING" | "PREPARING" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "CONFIRMED" | "DELIVERY_SCHEDULED" | "IN_PROGRESS" | "COMPLETE" | "REQUIRES_ATTENTION" | "DELIVERY_ISSUE";
        updatedAt: FirebaseFirestore.Timestamp;
    };
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
};
//# sourceMappingURL=customerOperationProjection.d.ts.map