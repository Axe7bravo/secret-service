import type { OperationRecord, PaymentAttempt, PaymentRecord } from '../domain/operationTypes.js';
export declare const MAX_PAYMENT_ATTEMPTS = 20;
export declare const paymentAttemptsFor: (payment: PaymentRecord) => PaymentAttempt[];
export declare const paymentHistoryFields: (attempts: PaymentAttempt[]) => {
    attempts: PaymentAttempt[];
    providerCheckoutIds: string[];
};
export declare const validatePaymentOwnership: (payment: PaymentRecord, operation: OperationRecord) => void;
//# sourceMappingURL=paymentAttempts.d.ts.map