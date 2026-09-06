import * as logger from 'firebase-functions/logger';
export class YocoProviderConfigurationError extends Error {
    constructor(message = 'Yoco checkout is not configured.') { super(message); this.name = 'YocoProviderConfigurationError'; }
}
export class YocoProviderResponseError extends Error {
    constructor() { super('Yoco returned an invalid checkout response.'); this.name = 'YocoProviderResponseError'; }
}
const asRecord = (value) => typeof value === 'object' && value !== null ? value : undefined;
const requiredString = (record, key) => {
    const value = record[key];
    if (typeof value !== 'string' || !value.trim())
        throw new YocoProviderResponseError();
    return value;
};
const safeProviderError = (body) => {
    try {
        const parsed = asRecord(JSON.parse(body));
        if (!parsed)
            return {};
        const safe = {};
        for (const key of ['code', 'type', 'error', 'message'])
            if (typeof parsed[key] === 'string')
                safe[key] = String(parsed[key]).slice(0, 500);
        return safe;
    }
    catch {
        return body.trim() ? { message: body.trim().slice(0, 500) } : {};
    }
};
export const createYocoCheckout = async (request) => {
    const secretKey = request.secretKey.trim();
    if (!/^sk_(test|live)_/.test(secretKey))
        throw new YocoProviderConfigurationError('YOCO_SECRET_KEY is missing or has an invalid key prefix.');
    logger.info('Yoco checkout request started.', { stage: 'provider_request_started', operationId: request.operationId, paymentId: request.paymentId, amountMinor: request.amountMinor, currency: request.currency });
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': request.idempotencyKey },
        body: JSON.stringify({
            amount: request.amountMinor,
            currency: request.currency,
            successUrl: request.successUrl,
            cancelUrl: request.cancelUrl,
            failureUrl: request.failureUrl,
            clientReferenceId: request.paymentId,
            externalId: request.operationId,
            metadata: { operationId: request.operationId, paymentId: request.paymentId },
        }),
    });
    const responseBody = await response.text();
    if (!response.ok) {
        logger.error('Yoco checkout HTTP request failed.', { stage: 'provider_http_failure', operationId: request.operationId, paymentId: request.paymentId, amountMinor: request.amountMinor, currency: request.currency, httpStatus: response.status, httpStatusText: response.statusText, ...safeProviderError(responseBody) });
        throw new Error(`Yoco checkout request failed with status ${response.status}.`);
    }
    let decoded;
    try {
        decoded = JSON.parse(responseBody);
    }
    catch {
        logger.error('Yoco checkout response was not valid JSON.', { stage: 'provider_response_decode_failure', operationId: request.operationId, paymentId: request.paymentId, amountMinor: request.amountMinor, currency: request.currency, httpStatus: response.status });
        throw new YocoProviderResponseError();
    }
    const body = asRecord(decoded);
    if (!body)
        throw new YocoProviderResponseError();
    const providerCheckoutId = requiredString(body, 'id');
    const checkoutUrl = requiredString(body, 'redirectUrl');
    if (body.amount !== request.amountMinor || body.currency !== request.currency)
        throw new YocoProviderResponseError();
    try {
        if (new URL(checkoutUrl).protocol !== 'https:')
            throw new YocoProviderResponseError();
    }
    catch (error) {
        if (error instanceof YocoProviderResponseError)
            throw error;
        throw new YocoProviderResponseError();
    }
    const result = { providerCheckoutId, checkoutUrl };
    if (typeof body.processingMode === 'string')
        result.processingMode = body.processingMode;
    if (typeof body.paymentId === 'string' && body.paymentId)
        result.providerPaymentId = body.paymentId;
    return result;
};
