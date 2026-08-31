import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import { asCallableError } from './commandErrors.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { buildCustomerOperationProjection } from '../projection/customerOperationProjection.js';
const supportedPackages = new Set(['soft-revenge', 'office-prank-kit', 'anonymous-apology']);
const required = (value, label) => { if (!value?.trim())
    throw new HttpsError('invalid-argument', `${label} is required.`); return value.trim(); };
export const createOperation = onCall(async (request) => {
    const actor = requireAdmin(request);
    try {
        const input = request.data;
        required(input.customerId, 'Customer ID');
        required(input.package?.packageId, 'Package ID');
        if (!supportedPackages.has(input.package.packageId))
            throw new HttpsError('invalid-argument', 'Unsupported package.');
        if (!Number.isInteger(input.package.priceMinor) || input.package.priceMinor <= 0)
            throw new HttpsError('invalid-argument', 'A valid package price is required.');
        required(input.recipient?.name, 'Recipient name');
        required(input.recipient?.phone, 'Recipient phone');
        required(input.recipient?.campus, 'Campus');
        required(input.recipient?.deliveryLocation, 'Delivery location');
        required(input.delivery?.requestedDate, 'Requested date');
        required(input.delivery?.requestedWindow, 'Requested window');
        required(input.anonymousMessage, 'Anonymous message');
        const db = getAdminFirestore();
        const operationRef = db.collection('operations').doc();
        const internalRef = db.collection('operationInternal').doc(operationRef.id);
        const projectionRef = db.collection('customerOperations').doc(operationRef.id);
        const activityRef = db.collection('operationActivity').doc();
        const now = Timestamp.now();
        const operation = { operationId: operationRef.id, customerId: input.customerId, status: 'PAYMENT_PENDING', package: { packageId: input.package.packageId, nameSnapshot: required(input.package.name, 'Package name'), priceMinor: input.package.priceMinor, currency: 'ZAR' }, recipient: { name: input.recipient.name.trim(), phone: input.recipient.phone.trim(), campus: input.recipient.campus.trim(), residence: input.recipient.residence?.trim() ?? '', deliveryLocation: input.recipient.deliveryLocation.trim(), ...(input.recipient.deliveryInstructions?.trim() ? { deliveryInstructions: input.recipient.deliveryInstructions.trim() } : {}) }, delivery: { requestedDate: input.delivery.requestedDate, requestedWindow: input.delivery.requestedWindow }, anonymousMessage: input.anonymousMessage.trim(), paymentSummary: { status: 'PENDING', amountMinor: input.package.priceMinor, currency: 'ZAR' }, createdAt: now, updatedAt: now };
        const internal = { operationId: operation.operationId, moderation: { status: 'PENDING' }, delivery: { retryCount: 0 }, safetyFlags: [], updatedAt: now };
        await db.runTransaction(async (transaction) => { transaction.create(operationRef, operation); transaction.create(internalRef, internal); transaction.create(projectionRef, buildCustomerOperationProjection(operation)); transaction.create(activityRef, { operationId: operation.operationId, type: 'OPERATION_CREATED', timestamp: now, actorId: actor.uid, actorRole: 'ADMIN', toStatus: operation.status }); });
        return { operationId: operation.operationId, status: operation.status };
    }
    catch (error) {
        throw asCallableError(error);
    }
});
