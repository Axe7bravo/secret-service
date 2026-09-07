import { createHmac, timingSafeEqual } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { onRequest } from 'firebase-functions/v2/https';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { confirmOperationPayment } from './confirmPayment.js';
import { yocoWebhookSecret } from './paymentConfig.js';
import { paymentAttemptsFor, paymentHistoryFields } from './paymentAttempts.js';
const MAX_WEBHOOK_AGE_SECONDS = 180;
const asRecord = (value) => typeof value === 'object' && value !== null ? value : undefined;
const stringValue = (record, key) => {
    const value = record?.[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
};
const numberValue = (record, key) => {
    const value = record?.[key];
    return typeof value === 'number' && Number.isSafeInteger(value) ? value : undefined;
};
const verifiedSignature = (rawBody, webhookId, timestamp, signatureHeader, secretValue) => {
    if (!secretValue.startsWith('whsec_'))
        return false;
    const encodedSecret = secretValue.slice('whsec_'.length);
    let secret;
    try {
        secret = Buffer.from(encodedSecret, 'base64');
    }
    catch {
        return false;
    }
    if (!secret.length)
        return false;
    const signedContent = `${webhookId}.${timestamp}.${rawBody.toString('utf8')}`;
    const expected = createHmac('sha256', secret).update(signedContent).digest();
    const candidates = [...signatureHeader.matchAll(/(?:^|\s)v1,([^\s]+)/g)].map(match => match[1]);
    return candidates.some(candidate => {
        if (!candidate)
            return false;
        let actual;
        try {
            actual = Buffer.from(candidate, 'base64');
        }
        catch {
            return false;
        }
        return actual.length === expected.length && timingSafeEqual(actual, expected);
    });
};
const parsePaymentEvent = (body) => {
    const root = asRecord(body);
    const eventId = stringValue(root, 'id');
    const type = stringValue(root, 'type');
    // Checkout API payment-notification contract, not the separate Yoco API:
    // payload.amount, payload.currency, payload.id, payload.metadata.checkoutId.
    const payload = asRecord(root?.payload);
    const metadata = asRecord(payload?.metadata);
    if (!eventId || !type)
        return undefined;
    const checkoutId = stringValue(metadata, 'checkoutId');
    const providerPaymentId = stringValue(payload, 'id');
    const amountMinor = numberValue(payload, 'amount');
    const currency = stringValue(payload, 'currency');
    return {
        eventId,
        type,
        ...(checkoutId ? { checkoutId } : {}),
        ...(providerPaymentId ? { providerPaymentId } : {}),
        ...(amountMinor !== undefined ? { amountMinor } : {}),
        ...(currency ? { currency } : {}),
    };
};
const findPaymentByCheckout = async (checkoutId) => {
    const payments = getAdminFirestore().collection('payments');
    const [history, legacy] = await Promise.all([
        payments.where('providerCheckoutIds', 'array-contains', checkoutId).limit(2).get(),
        payments.where('providerCheckoutId', '==', checkoutId).limit(2).get(),
    ]);
    const documents = new Map([...history.docs, ...legacy.docs].map(document => [document.id, document]));
    if (documents.size !== 1)
        throw new Error(documents.size === 0 ? 'Payment reconciliation failed.' : 'Checkout reference is not unique.');
    const document = [...documents.values()][0];
    if (!document)
        throw new Error('Payment reconciliation failed.');
    const payment = document.data();
    if (payment.paymentId !== document.id || payment.operationId !== document.id || payment.provider !== 'YOCO' ||
        !paymentAttemptsFor(payment).some(attempt => attempt.providerCheckoutId === checkoutId))
        throw new Error('Stored checkout identity is invalid.');
    return { reference: document.ref, payment };
};
const markPaymentFailed = async (checkoutId, paymentReference, payment) => {
    const db = getAdminFirestore();
    const activityReference = db.collection('operationActivity').doc();
    return db.runTransaction(async (transaction) => {
        const currentSnapshot = await transaction.get(paymentReference);
        if (!currentSnapshot.exists)
            throw new Error('Payment record disappeared during reconciliation.');
        const current = currentSnapshot.data();
        const attempts = paymentAttemptsFor(current);
        const attempt = attempts.find(item => item.providerCheckoutId === checkoutId);
        if (!attempt || current.paymentId !== payment.paymentId || current.customerId !== payment.customerId || current.amountMinor !== payment.amountMinor || current.currency !== payment.currency)
            throw new Error('Checkout reconciliation changed.');
        if (current.status === 'PAID' || current.status === 'REFUNDED' || attempt.status === 'SUCCEEDED')
            return 'IGNORED';
        if (attempt.status === 'FAILED')
            return 'ALREADY_FAILED';
        if (!['PENDING', 'FAILED'].includes(current.status))
            return 'IGNORED';
        const now = Timestamp.now();
        attempt.status = 'FAILED';
        transaction.update(paymentReference, { ...paymentHistoryFields(attempts), ...(current.providerCheckoutId === checkoutId ? { status: 'FAILED', failureCategory: 'PROVIDER_PAYMENT_FAILED', failedAt: now } : {}), updatedAt: now });
        transaction.create(activityReference, { operationId: payment.operationId, type: 'PAYMENT_FAILED', timestamp: now, actorId: 'yoco-webhook', actorRole: 'SYSTEM', fromStatus: 'PAYMENT_PENDING', toStatus: 'PAYMENT_PENDING', note: 'Payment attempt was not completed. The operation remains payable.', providerCheckoutId: checkoutId });
        return 'FAILED';
    });
};
export const yocoWebhook = onRequest({ region: 'us-central1', secrets: [yocoWebhookSecret] }, async (request, response) => {
    logger.info('Yoco webhook received.', { stage: 'webhook_received', method: request.method });
    if (request.method !== 'POST') {
        response.status(405).send('Method not allowed.');
        return;
    }
    const webhookId = request.get('webhook-id');
    const timestampHeader = request.get('webhook-timestamp');
    const signatureHeader = request.get('webhook-signature');
    if (!webhookId || !timestampHeader || !signatureHeader) {
        logger.warn('Yoco webhook rejected: required headers missing.');
        response.status(401).send('Invalid webhook signature.');
        return;
    }
    const timestamp = Number(timestampHeader);
    const ageSeconds = Math.abs(Date.now() / 1000 - timestamp);
    if (!Number.isInteger(timestamp) || ageSeconds > MAX_WEBHOOK_AGE_SECONDS) {
        logger.warn('Yoco webhook rejected: timestamp outside replay window.', { webhookId });
        response.status(400).send('Invalid webhook timestamp.');
        return;
    }
    const rawBody = request.rawBody;
    if (!rawBody?.length || !verifiedSignature(rawBody, webhookId, timestampHeader, signatureHeader, yocoWebhookSecret.value())) {
        logger.warn('Yoco webhook rejected: signature verification failed.', { webhookId });
        response.status(401).send('Invalid webhook signature.');
        return;
    }
    logger.info('Yoco webhook verified.', { stage: 'signature_verified', webhookId });
    let event;
    try {
        event = parsePaymentEvent(JSON.parse(rawBody.toString('utf8')));
    }
    catch {
        event = undefined;
    }
    if (!event) {
        logger.warn('Verified Yoco webhook contained malformed JSON or event metadata.', { webhookId });
        response.status(400).send('Malformed webhook event.');
        return;
    }
    logger.info('Yoco webhook event received.', { stage: 'event_parsed', webhookId, eventId: event.eventId, eventType: event.type, checkoutId: event.checkoutId });
    if (!['payment.succeeded', 'payment.failed'].includes(event.type)) {
        logger.info('Verified Yoco event ignored.', { stage: 'event_ignored', webhookId, eventId: event.eventId, eventType: event.type });
        response.status(204).send();
        return;
    }
    if (!event.checkoutId) {
        logger.warn('Verified payment event did not contain a checkout reference.', { webhookId, eventId: event.eventId, eventType: event.type });
        response.status(400).send('Missing checkout reference.');
        return;
    }
    if (event.type === 'payment.succeeded' && (!event.providerPaymentId || event.amountMinor === undefined || event.amountMinor <= 0 || event.currency !== 'ZAR')) {
        logger.warn('Verified Yoco success omitted or malformed required payment fields.', { stage: 'invalid_success_payload', webhookId, eventId: event.eventId, checkoutId: event.checkoutId });
        response.status(400).send('Invalid payment confirmation payload.');
        return;
    }
    logger.info('Yoco checkout reference extracted.', { stage: 'checkout_extracted', webhookId, eventId: event.eventId, eventType: event.type, checkoutId: event.checkoutId });
    try {
        const reconciled = await findPaymentByCheckout(event.checkoutId);
        logger.info('Payment record found for Yoco checkout.', { stage: 'payment_found', webhookId, eventId: event.eventId, checkoutId: event.checkoutId, paymentId: reconciled.payment.paymentId, localStatus: reconciled.payment.status });
        if (event.amountMinor !== undefined && event.amountMinor !== reconciled.payment.amountMinor)
            throw new Error('Payment amount did not reconcile.');
        if (event.currency !== undefined && event.currency !== reconciled.payment.currency)
            throw new Error('Payment currency did not reconcile.');
        if (event.type === 'payment.succeeded') {
            if (!event.providerPaymentId || event.amountMinor === undefined || event.currency !== 'ZAR')
                throw new Error('Successful payment event omitted required payment fields.');
            logger.info('Yoco payment settlement starting.', { stage: 'settlement_attempted', webhookId, eventId: event.eventId, checkoutId: event.checkoutId, paymentId: reconciled.payment.paymentId });
            const result = await confirmOperationPayment({ paymentId: reconciled.payment.paymentId, providerCheckoutId: event.checkoutId, providerPaymentId: event.providerPaymentId, amountMinor: event.amountMinor, currency: event.currency });
            if (result === 'ADDITIONAL_SUCCESS') {
                logger.error('Additional successful payment requires operator reconciliation; no second settlement or automatic refund performed.', { stage: 'additional_payment_success', webhookId, eventId: event.eventId, checkoutId: event.checkoutId, providerPaymentId: event.providerPaymentId, paymentId: reconciled.payment.paymentId, amountMinor: event.amountMinor, currency: event.currency });
            }
            else {
                logger.info(result === 'ALREADY_CONFIRMED' ? 'Duplicate Yoco settlement ignored.' : 'Yoco payment settled.', { stage: result === 'ALREADY_CONFIRMED' ? 'settlement_duplicate' : 'settlement_completed', webhookId, eventId: event.eventId, checkoutId: event.checkoutId, paymentId: reconciled.payment.paymentId });
            }
        }
        else {
            const result = await markPaymentFailed(event.checkoutId, reconciled.reference, reconciled.payment);
            logger.info('Yoco payment failure handled.', { webhookId, eventId: event.eventId, checkoutId: event.checkoutId, paymentId: reconciled.payment.paymentId, result });
        }
        response.status(204).send();
    }
    catch (error) {
        logger.error('Verified Yoco webhook could not be reconciled.', { webhookId, eventId: event.eventId, eventType: event.type, checkoutId: event.checkoutId, error: error instanceof Error ? error.message : 'Unknown reconciliation error' });
        response.status(500).send('Webhook processing failed.');
    }
});
