import { customerStatusFor } from '../domain/operationWorkflow.js';
export const customerArchiveMetadataFrom = (value) => {
    if (typeof value !== 'object' || value === null)
        return { archived: false };
    const record = value;
    return record.archived === true ? { archived: true, ...(record.archivedAt ? { archivedAt: record.archivedAt } : {}) } : { archived: false };
};
export const buildCustomerOperationProjection = (operation, archive = { archived: false }) => ({
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
    archived: archive.archived,
    ...(archive.archivedAt ? { archivedAt: archive.archivedAt } : {}),
});
