export interface ConfirmedProviderPayment {
    paymentId: string;
    providerPaymentId: string;
    amountMinor: number;
    currency: 'ZAR';
}
/** Called only after a Yoco webhook adapter has verified authenticity. */
export declare const confirmOperationPayment: (event: ConfirmedProviderPayment) => Promise<"CONFIRMED" | "ALREADY_CONFIRMED">;
//# sourceMappingURL=confirmPayment.d.ts.map