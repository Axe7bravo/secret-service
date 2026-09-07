import { HttpsError } from 'firebase-functions/v2/https';
// Never evict a checkout that can still receive a signed provider event.
export const MAX_PAYMENT_ATTEMPTS = 20;
export const paymentAttemptsFor = (payment) => {
    const attempts = (payment.attempts ?? []).map(attempt => ({ ...attempt }));
    // Backwards compatibility: retain the checkout still present on legacy records.
    // References already overwritten by old code cannot be reconstructed here.
    if (payment.providerCheckoutId && !attempts.some(attempt => attempt.providerCheckoutId === payment.providerCheckoutId)) {
        attempts.push({ providerCheckoutId: payment.providerCheckoutId, amountMinor: payment.amountMinor, currency: payment.currency,
            status: payment.status === 'PAID' ? 'SUCCEEDED' : payment.status === 'FAILED' ? 'FAILED' : 'PENDING',
            ...(payment.providerPaymentId ? { providerPaymentId: payment.providerPaymentId } : {}) });
    }
    if (attempts.length > MAX_PAYMENT_ATTEMPTS || new Set(attempts.map(attempt => attempt.providerCheckoutId)).size !== attempts.length ||
        attempts.some(attempt => !attempt.providerCheckoutId || attempt.amountMinor !== payment.amountMinor || attempt.currency !== payment.currency || !['PENDING', 'FAILED', 'SUCCEEDED'].includes(attempt.status))) {
        throw new HttpsError('failed-precondition', 'Payment checkout history needs operator review.');
    }
    return attempts;
};
export const paymentHistoryFields = (attempts) => ({
    attempts, providerCheckoutIds: attempts.map(attempt => attempt.providerCheckoutId),
});
export const validatePaymentOwnership = (payment, operation) => {
    if (payment.provider !== 'YOCO' || payment.paymentId !== operation.operationId || payment.operationId !== operation.operationId ||
        payment.customerId !== operation.customerId || payment.amountMinor !== operation.package.priceMinor ||
        payment.currency !== operation.package.currency || payment.amountMinor !== operation.paymentSummary.amountMinor ||
        payment.currency !== operation.paymentSummary.currency || payment.currency !== 'ZAR' || !Number.isSafeInteger(payment.amountMinor) || payment.amountMinor <= 0) {
        throw new HttpsError('failed-precondition', 'Payment ownership or amount does not match the operation snapshot.');
    }
};
