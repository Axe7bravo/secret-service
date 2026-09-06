export interface YocoCheckoutRequest {
    paymentId: string;
    operationId: string;
    amountMinor: number;
    currency: 'ZAR';
    idempotencyKey: string;
    successUrl: string;
    cancelUrl: string;
    failureUrl: string;
    secretKey: string;
}
export interface YocoCheckoutResult {
    providerCheckoutId: string;
    checkoutUrl: string;
    processingMode?: string;
    providerPaymentId?: string;
}
export type YocoCheckoutProvider = (request: YocoCheckoutRequest) => Promise<YocoCheckoutResult>;
export declare class YocoProviderConfigurationError extends Error {
    constructor(message?: string);
}
export declare class YocoProviderResponseError extends Error {
    constructor();
}
export declare const createYocoCheckout: YocoCheckoutProvider;
//# sourceMappingURL=yocoProvider.d.ts.map