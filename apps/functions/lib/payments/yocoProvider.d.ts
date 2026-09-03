export interface YocoCheckoutRequest {
    paymentId: string;
    operationId: string;
    amountMinor: number;
    currency: 'ZAR';
    customerId: string;
}
export interface YocoCheckoutResult {
    providerCheckoutId: string;
    checkoutUrl: string;
}
export type YocoCheckoutProvider = (request: YocoCheckoutRequest) => Promise<YocoCheckoutResult>;
export declare class YocoProviderConfigurationError extends Error {
    constructor();
}
/**
 * Server-only provider boundary. The repository contains no verified current
 * Yoco checkout or webhook contract, so this adapter deliberately fails closed
 * instead of fabricating endpoint fields or signature verification.
 */
export declare const createYocoCheckout: YocoCheckoutProvider;
//# sourceMappingURL=yocoProvider.d.ts.map