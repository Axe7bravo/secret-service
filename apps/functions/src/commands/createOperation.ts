import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAuthenticatedCustomer } from '../auth/requireAuthenticatedCustomer.js';
import { getAdminFirestore } from '../firebaseAdmin.js';
import type { OperationInternalRecord, OperationRecord } from '../domain/operationTypes.js';
import { buildCustomerOperationProjection } from '../projection/customerOperationProjection.js';
import { asCallableError } from './commandErrors.js';

interface CreateOperationInput {
  packageId: string;
  recipient: {
    name: string;
    phone: string;
    campus: string;
    residence: string;
    deliveryLocation: string;
    deliveryInstructions?: string;
  };
  delivery: {
    requestedDate: string;
    requestedWindow: string;
  };
  anonymousMessage: string;
}

interface ServerPackage {
  packageId: string;
  name: string;
  priceMinor: number;
}

const packagesById: Readonly<Record<string, ServerPackage>> = {
  'soft-revenge': { packageId: 'soft-revenge', name: 'Soft Revenge', priceMinor: 29900 },
  'office-prank-kit': { packageId: 'office-prank-kit', name: 'Office Prank Kit', priceMinor: 45000 },
  'anonymous-apology': { packageId: 'anonymous-apology', name: 'Anonymous Apology', priceMinor: 18000 },
};

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', `${label} is invalid.`);
  }
  return value as Record<string, unknown>;
};

const requiredString = (value: unknown, label: string, maximumLength: number): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', `${label} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    throw new HttpsError('invalid-argument', `${label} is too long.`);
  }
  return normalized;
};

const optionalString = (value: unknown, label: string, maximumLength: number): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return requiredString(value, label, maximumLength);
};

const parseInput = (value: unknown): CreateOperationInput => {
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

export const createOperation = onCall<unknown>(async request => {
  const actor = requireAuthenticatedCustomer(request);

  try {
    const input = parseInput(request.data);
    const selectedPackage = packagesById[input.packageId];
    if (!selectedPackage) throw new HttpsError('invalid-argument', 'Unsupported package.');

    const db = getAdminFirestore();
    const operationRef = db.collection('operations').doc();
    const internalRef = db.collection('operationInternal').doc(operationRef.id);
    const projectionRef = db.collection('customerOperations').doc(operationRef.id);
    const activityRef = db.collection('operationActivity').doc();
    const now = Timestamp.now();
    const operation: OperationRecord = {
      operationId: operationRef.id,
      customerId: actor.uid,
      status: 'PAYMENT_PENDING',
      package: {
        packageId: selectedPackage.packageId,
        nameSnapshot: selectedPackage.name,
        priceMinor: selectedPackage.priceMinor,
        currency: 'ZAR',
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
        currency: 'ZAR',
      },
      createdAt: now,
      updatedAt: now,
    };
    const internal: OperationInternalRecord = {
      operationId: operation.operationId,
      moderation: { status: 'PENDING' },
      delivery: { retryCount: 0 },
      safetyFlags: [],
      updatedAt: now,
    };

    await db.runTransaction(async transaction => {
      transaction.create(operationRef, operation);
      transaction.create(internalRef, internal);
      transaction.create(projectionRef, buildCustomerOperationProjection(operation));
      transaction.create(activityRef, {
        operationId: operation.operationId,
        type: 'OPERATION_CREATED',
        timestamp: now,
        actorId: actor.uid,
        actorRole: 'CUSTOMER',
        toStatus: operation.status,
      });
    });

    return { operationId: operation.operationId, status: operation.status };
  } catch (error) {
    throw asCallableError(error);
  }
});
