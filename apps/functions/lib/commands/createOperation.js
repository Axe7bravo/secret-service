import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAuthenticatedCustomer } from '../auth/requireAuthenticatedCustomer.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import { buildCustomerOperationProjection } from '../projection/customerOperationProjection.js';
import { asCallableError } from './commandErrors.js';
const asRecord = (value, label) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new HttpsError('invalid-argument', `${label} is invalid.`);
    }
    return value;
};
const requiredString = (value, label, maximumLength) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new HttpsError('invalid-argument', `${label} is required.`);
    }
    const normalized = value.trim();
    if (normalized.length > maximumLength) {
        throw new HttpsError('invalid-argument', `${label} is too long.`);
    }
    return normalized;
};
const optionalString = (value, label, maximumLength) => {
    if (value === undefined || value === null || value === '')
        return undefined;
    return requiredString(value, label, maximumLength);
};
const parseInput = (value) => {
    const input = asRecord(value, 'Operation request');
    const recipient = asRecord(input.recipient, 'Recipient');
    const delivery = asRecord(input.delivery, 'Delivery');
    const requestedDate = requiredString(delivery.requestedDate, 'Requested date', 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
        throw new HttpsError('invalid-argument', 'Requested date is invalid.');
    }
    return {
        packageId: requiredString(input.packageId, 'Package', 64),
        recipient: {
            name: requiredString(recipient.name, 'Recipient name', 120),
            phone: requiredString(recipient.phone, 'Recipient phone', 40),
            campus: requiredString(recipient.campus, 'Campus', 160),
            residence: requiredString(recipient.residence, 'Residence or building', 160),
            deliveryLocation: requiredString(recipient.deliveryLocation, 'Delivery location', 240),
            deliveryInstructions: optionalString(recipient.deliveryInstructions, 'Delivery instructions', 1000),
        },
        delivery: {
            requestedDate,
            requestedWindow: requiredString(delivery.requestedWindow, 'Requested window', 80),
        },
        anonymousMessage: requiredString(input.anonymousMessage, 'Anonymous message', 2000),
    };
};
export const createOperation = onCall(async (request) => {
    const actor = requireAuthenticatedCustomer(request);
    try {
        const input = parseInput(request.data);
        const db = getAdminFirestore();
        const packageRef = db.collection('packages').doc(input.packageId);
        const campusCode = input.recipient.campus.trim().toLocaleLowerCase('en-ZA').replace(/\s+/g, '-');
        const campusRef = db.collection('campuses').doc(campusCode);
        const operationRef = db.collection('operations').doc();
        const internalRef = db.collection('operationInternal').doc(operationRef.id);
        const projectionRef = db.collection('customerOperations').doc(operationRef.id);
        const activityRef = db.collection('operationActivity').doc();
        const operation = await db.runTransaction(async (transaction) => {
            const [packageSnapshot, campusSnapshot] = await Promise.all([transaction.get(packageRef), transaction.get(campusRef)]);
            if (!packageSnapshot.exists)
                throw new HttpsError('invalid-argument', 'Selected package is unavailable.');
            const selectedPackage = packageSnapshot.data();
            if (selectedPackage.packageId !== input.packageId || typeof selectedPackage.name !== 'string' || !Number.isInteger(selectedPackage.priceMinor) || selectedPackage.priceMinor < 0 || selectedPackage.currency !== 'ZAR')
                throw new HttpsError('failed-precondition', 'Selected package record is invalid.');
            if (!selectedPackage.active)
                throw new HttpsError('failed-precondition', 'Selected package is inactive.');
            if (campusSnapshot.exists && campusSnapshot.data()?.active !== true)
                throw new HttpsError('failed-precondition', 'Selected campus is inactive.');
            const now = Timestamp.now();
            const nextOperation = {
                operationId: operationRef.id,
                customerId: actor.uid,
                status: 'PAYMENT_PENDING',
                package: {
                    packageId: selectedPackage.packageId,
                    nameSnapshot: selectedPackage.name,
                    priceMinor: selectedPackage.priceMinor,
                    currency: selectedPackage.currency,
                },
                recipient: {
                    name: input.recipient.name,
                    phone: input.recipient.phone,
                    campus: input.recipient.campus,
                    residence: input.recipient.residence,
                    deliveryLocation: input.recipient.deliveryLocation,
                    ...(input.recipient.deliveryInstructions
                        ? { deliveryInstructions: input.recipient.deliveryInstructions }
                        : {}),
                },
                delivery: {
                    requestedDate: input.delivery.requestedDate,
                    requestedWindow: input.delivery.requestedWindow,
                },
                anonymousMessage: input.anonymousMessage,
                paymentSummary: {
                    status: 'PENDING',
                    amountMinor: selectedPackage.priceMinor,
                    currency: selectedPackage.currency,
                },
                createdAt: now,
                updatedAt: now,
            };
            const internal = {
                operationId: nextOperation.operationId,
                moderation: { status: 'PENDING' },
                delivery: { retryCount: 0 },
                safetyFlags: [],
                updatedAt: now,
            };
            transaction.create(operationRef, nextOperation);
            transaction.create(internalRef, internal);
            transaction.create(projectionRef, buildCustomerOperationProjection(nextOperation));
            transaction.create(activityRef, {
                operationId: nextOperation.operationId,
                type: 'OPERATION_CREATED',
                timestamp: now,
                actorId: actor.uid,
                actorRole: 'CUSTOMER',
                toStatus: nextOperation.status,
            });
            return nextOperation;
        });
        return { operationId: operation.operationId, status: operation.status };
    }
    catch (error) {
        throw asCallableError(error);
    }
});
