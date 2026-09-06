import { Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAuthenticatedCustomer } from '../auth/requireAuthenticatedCustomer.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { customerAppUrl, yocoSecretKey } from '../payments/paymentConfig.js';
import { createYocoCheckout, YocoProviderConfigurationError } from '../payments/yocoProvider.js';
import { asCallableError } from './commandErrors.js';
const checkoutReturnUrls = (operationId) => {
    let base;
    try {
        base = new URL(customerAppUrl.value());
    }
    catch {
        throw new YocoProviderConfigurationError('CUSTOMER_APP_URL is missing or is not an absolute URL.');
    }
    if (!['https:', 'http:'].includes(base.protocol))
        throw new YocoProviderConfigurationError('CUSTOMER_APP_URL must use http or https.');
    const operationPath = `/operations/${encodeURIComponent(operationId)}/payment`;
    return {
        successUrl: new URL(`${operationPath}/success`, base).toString(),
        cancelUrl: new URL(`${operationPath}/cancelled`, base).toString(),
        failureUrl: new URL(`${operationPath}/failed`, base).toString(),
    };
};
export const createOperationPayment = onCall({ region: 'us-central1', secrets: [yocoSecretKey] }, async (request) => {
    logger.info('createOperationPayment invoked.', { stage: 'invoked' });
    const actor = requireAuthenticatedCustomer(request);
    logger.info('createOperationPayment authenticated.', { stage: 'authenticated', customerId: actor.uid });
    try {
        const operationId = request.data.operationId?.trim();
        if (!operationId)
            throw new HttpsError('invalid-argument', 'Operation ID is required.');
        logger.info('createOperationPayment stage.', { stage: 'initializing-admin' });
        const db = getAdminFirestore();
        logger.info('createOperationPayment stage.', { stage: 'admin-initialized' });
        const operationRef = db.collection('operations').doc(operationId);
        const paymentRef = db.collection('payments').doc(operationId);
        const activityRef = db.collection('operationActivity').doc();
        const eligibility = await db.runTransaction(async (transaction) => {
            const [operationSnapshot, paymentSnapshot] = await Promise.all([transaction.get(operationRef), transaction.get(paymentRef)]);
            if (!operationSnapshot.exists)
                throw new HttpsError('not-found', 'Operation not found.');
            const operation = operationSnapshot.data();
            if (operation.customerId !== actor.uid)
                throw new HttpsError('permission-denied', 'Operation is not owned by this customer.');
            if (operation.status !== 'PAYMENT_PENDING' || operation.paymentSummary.status !== 'PENDING')
                throw new HttpsError('failed-precondition', 'This operation is not eligible for payment.');
            if (operation.package.currency !== 'ZAR' || !Number.isInteger(operation.package.priceMinor) || operation.package.priceMinor <= 0)
                throw new HttpsError('failed-precondition', 'The authoritative operation amount is invalid.');
            const existing = paymentSnapshot.exists ? paymentSnapshot.data() : undefined;
            if (existing?.status === 'PAID' || existing?.status === 'REFUNDED')
                throw new HttpsError('already-exists', 'This operation already has a settled payment.');
            if (existing?.status === 'PENDING' && existing.checkoutUrl)
                return { operation, payment: existing, checkoutReady: true };
            const attemptNumber = existing?.status === 'PENDING' ? (existing.attemptNumber ?? 1) : (existing?.attemptNumber ?? 0) + 1;
            const idempotencyKey = existing?.status === 'PENDING' && existing.idempotencyKey ? existing.idempotencyKey : `${operationId}:checkout:${attemptNumber}`;
            const now = Timestamp.now();
            const reservation = { paymentId: operationId, operationId, customerId: actor.uid, provider: 'YOCO', amountMinor: operation.package.priceMinor, currency: 'ZAR', status: 'PENDING', idempotencyKey, attemptNumber, createdAt: existing?.createdAt ?? now, updatedAt: now };
            transaction.set(paymentRef, reservation);
            return { operation, payment: reservation, idempotencyKey, checkoutReady: false };
        });
        logger.info('Payment operation loaded.', { stage: 'operation_loaded', operationId, customerId: actor.uid });
        logger.info('Payment eligibility validated.', { stage: 'eligibility_validated', operationId, status: eligibility.operation.status });
        logger.info('Authoritative payment amount derived.', { stage: 'amount_derived', operationId, amountMinor: eligibility.operation.package.priceMinor, currency: eligibility.operation.package.currency });
        logger.info('Payment record reservation completed.', { stage: 'payment_reserved', operationId, paymentId: eligibility.payment.paymentId, attemptNumber: eligibility.payment.attemptNumber, checkoutReady: eligibility.checkoutReady });
        if (eligibility.checkoutReady) {
            logger.info('Existing Yoco checkout redirect returned.', { stage: 'redirect_returned', operationId, paymentId: eligibility.payment.paymentId, providerCheckoutId: eligibility.payment.providerCheckoutId });
            return { paymentId: eligibility.payment.paymentId, checkoutUrl: eligibility.payment.checkoutUrl, status: 'PENDING' };
        }
        const paymentId = operationId;
        let checkout;
        try {
            const returnUrls = checkoutReturnUrls(operationId);
            logger.info('Yoco checkout request starting.', { stage: 'yoco_request_started', operationId, paymentId, amountMinor: eligibility.operation.package.priceMinor, currency: 'ZAR', customerAppOrigin: new URL(returnUrls.successUrl).origin });
            checkout = await createYocoCheckout({ paymentId, operationId, amountMinor: eligibility.operation.package.priceMinor, currency: 'ZAR', idempotencyKey: eligibility.idempotencyKey, ...returnUrls, secretKey: yocoSecretKey.value() });
            logger.info('Yoco checkout response received.', { stage: 'yoco_response_received', operationId, paymentId, providerCheckoutId: checkout.providerCheckoutId, processingMode: checkout.processingMode });
        }
        catch (error) {
            logger.error('Yoco checkout initiation failed.', { stage: 'yoco_request_failed', operationId, paymentId, amountMinor: eligibility.operation.package.priceMinor, currency: 'ZAR', errorName: error instanceof Error ? error.name : 'UnknownError', errorMessage: error instanceof Error ? error.message : 'Unknown provider error' });
            const now = Timestamp.now();
            await db.runTransaction(async (transaction) => {
                const currentSnapshot = await transaction.get(paymentRef);
                if (!currentSnapshot.exists)
                    return;
                const current = currentSnapshot.data();
                if (current.status === 'PENDING' && current.idempotencyKey === eligibility.idempotencyKey && !current.providerCheckoutId)
                    transaction.update(paymentRef, { status: 'FAILED', failureCategory: error instanceof YocoProviderConfigurationError ? 'PROVIDER_NOT_CONFIGURED' : 'PROVIDER_INITIATION_FAILED', failedAt: now, updatedAt: now });
            });
            if (error instanceof YocoProviderConfigurationError)
                throw error;
            throw new HttpsError('unavailable', 'The secure payment provider could not start checkout. Try again shortly.');
        }
        const now = Timestamp.now();
        const payment = { ...eligibility.payment, providerCheckoutId: checkout.providerCheckoutId, checkoutUrl: checkout.checkoutUrl, ...(checkout.processingMode ? { processingMode: checkout.processingMode } : {}), ...(checkout.providerPaymentId ? { providerPaymentId: checkout.providerPaymentId } : {}), updatedAt: now };
        const storedCheckout = await db.runTransaction(async (transaction) => {
            const [currentOperation, currentPayment] = await Promise.all([transaction.get(operationRef), transaction.get(paymentRef)]);
            if (!currentOperation.exists)
                throw new HttpsError('not-found', 'Operation not found.');
            const operation = currentOperation.data();
            if (operation.customerId !== actor.uid || operation.status !== 'PAYMENT_PENDING' || operation.paymentSummary.status !== 'PENDING')
                throw new HttpsError('failed-precondition', 'Payment eligibility changed.');
            if (currentPayment.exists) {
                const current = currentPayment.data();
                if (current.status === 'PENDING' && current.providerCheckoutId && current.checkoutUrl)
                    return { paymentId: current.paymentId, checkoutUrl: current.checkoutUrl };
                if (current.idempotencyKey !== payment.idempotencyKey)
                    throw new HttpsError('aborted', 'A newer payment attempt has started.');
            }
            transaction.set(paymentRef, payment);
            transaction.create(activityRef, { operationId, type: 'PAYMENT_INITIATED', timestamp: now, actorId: actor.uid, actorRole: 'CUSTOMER', fromStatus: 'PAYMENT_PENDING', toStatus: 'PAYMENT_PENDING', note: 'Secure payment checkout initiated.' });
            return { paymentId, checkoutUrl: checkout.checkoutUrl };
        });
        logger.info('Payment record updated with Yoco checkout.', { stage: 'payment_updated', operationId, paymentId, providerCheckoutId: checkout.providerCheckoutId });
        logger.info('Yoco checkout redirect returned.', { stage: 'redirect_returned', operationId, paymentId, providerCheckoutId: checkout.providerCheckoutId });
        return { ...storedCheckout, status: 'PENDING' };
    }
    catch (error) {
        if (error instanceof YocoProviderConfigurationError) {
            logger.error('Payment configuration validation failed.', { stage: 'configuration_failed', errorMessage: error.message });
            throw new HttpsError('failed-precondition', 'Payment is not currently available.');
        }
        if (error instanceof HttpsError)
            throw error;
        logger.error('createOperationPayment failed unexpectedly.', { stage: 'unexpected_failure', errorName: error instanceof Error ? error.name : 'UnknownError', errorMessage: error instanceof Error ? error.message : 'Unknown payment error' });
        throw asCallableError(error);
    }
});
