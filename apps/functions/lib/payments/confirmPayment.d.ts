export interface ConfirmedProviderPayment {
    paymentId: string;
    providerCheckoutId: string;
    providerPaymentId: string;
    amountMinor: number;
    currency: 'ZAR';
}
type SettlementResult = 'CONFIRMED' | 'ALREADY_CONFIRMED' | 'ADDITIONAL_SUCCESS';
/** Internal only: called after signature verification and provider payload validation. */
export declare const confirmOperationPayment: (event: ConfirmedProviderPayment) => Promise<SettlementResult>;
export {};
//# sourceMappingURL=confirmPayment.d.ts.map