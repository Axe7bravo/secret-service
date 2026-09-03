export interface YocoCheckoutRequest {paymentId:string;operationId:string;amountMinor:number;currency:'ZAR';customerId:string}
export interface YocoCheckoutResult {providerCheckoutId:string;checkoutUrl:string}
export type YocoCheckoutProvider=(request:YocoCheckoutRequest)=>Promise<YocoCheckoutResult>;

export class YocoProviderConfigurationError extends Error {
  constructor(){super('Yoco checkout is not configured. Supply and verify the current provider contract before enabling payments.');this.name='YocoProviderConfigurationError'}
}

/**
 * Server-only provider boundary. The repository contains no verified current
 * Yoco checkout or webhook contract, so this adapter deliberately fails closed
 * instead of fabricating endpoint fields or signature verification.
 */
export const createYocoCheckout:YocoCheckoutProvider=async()=>{
  throw new YocoProviderConfigurationError();
};
