import { customerStatusFor } from '../domain/operationWorkflow.js';
export const buildCustomerOperationProjection = (operation) => ({
    operationId: operation.operationId,
    customerId: operation.customerId,
    package: { name: operation.package.nameSnapshot, amountMinor: operation.package.priceMinor, currency: operation.package.currency },
    status: customerStatusFor(operation.status),
    recipient: { name: operation.recipient.name, campus: operation.recipient.campus, residence: operation.recipient.residence },
    delivery: { requestedDate: operation.delivery.requestedDate, requestedWindow: operation.delivery.requestedWindow, location: operation.recipient.deliveryLocation, ...(operation.delivery.deliveredAt ? { deliveredAt: operation.delivery.deliveredAt } : {}) },
    anonymousMessage: operation.anonymousMessage,
    paymentSummary: { status: operation.paymentSummary.status === 'FAILED' ? 'PENDING' : operation.paymentSummary.status, amountMinor: operation.paymentSummary.amountMinor, currency: operation.paymentSummary.currency },
    tracking: { status: customerStatusFor(operation.status), updatedAt: operation.updatedAt },
    createdAt: operation.createdAt,
    updatedAt: operation.updatedAt,
});
