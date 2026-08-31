import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { AdminCustomerDirectoryItem, AdminDirectory, AdminRecipientDirectoryItem, DirectoryOperationSummary } from '../types/directory';
import type { Operation } from '../types/operations';
import { adminDataMode } from './adminReadRepository';
import { adminOperationsRepository } from './adminOperationsRepository';

export interface AdminDirectoryRepository {
  load(): Promise<AdminDirectory>;
}

const summary = (operation: Operation): DirectoryOperationSummary => ({
  operationId: operation.operationId,
  status: operation.operationStatus,
  packageName: operation.packageType,
  createdAt: operation.createdAt,
});

const mockDirectory = (): AdminDirectory => {
  const operations = adminOperationsRepository.list();
  const customers = new Map<string, AdminCustomerDirectoryItem>();
  const recipients = new Map<string, AdminRecipientDirectoryItem>();
  for (const operation of operations) {
    const customerId = operation.customerId ?? `mock-${operation.email || operation.operationId}`;
    const customer = customers.get(customerId) ?? {
      customerId,
      ...(operation.email ? { email: operation.email } : {}),
      ...(operation.customerName ? { displayName: operation.customerName } : {}),
      accountState: 'ACTIVE' as const,
      joinedAt: operation.createdAt,
      operationCount: 0,
      activeOperationCount: 0,
      completedOperationCount: 0,
      operations: [],
    };
    customer.operations.push(summary(operation));
    customer.operationCount += 1;
    if (operation.operationStatus === 'COMPLETED') customer.completedOperationCount += 1;
    else if (!['CANCELLED', 'REJECTED', 'REFUNDED'].includes(operation.operationStatus)) customer.activeOperationCount += 1;
    customers.set(customerId, customer);

    const recipientId = `mock-${operation.operationId}`;
    recipients.set(recipientId, {
      recipientId,
      name: operation.recipientName,
      phone: operation.recipientPhone,
      campus: operation.campus,
      residence: operation.residence,
      latestLocation: operation.deliveryLocation,
      operationCount: 1,
      operations: [summary(operation)],
    });
  }
  return { customers: [...customers.values()], recipients: [...recipients.values()], truncated: false };
};

const firebaseRepository: AdminDirectoryRepository = {
  async load() {
    try {
      const callable = httpsCallable<Record<string, never>, AdminDirectory>(getFirebaseFunctions(), 'getAdminDirectory');
      const result = await callable({});
      return result.data;
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      if (code === 'functions/unauthenticated') throw new Error('Sign in again before opening the directory.');
      if (code === 'functions/permission-denied') throw new Error('This account cannot access the admin directory.');
      throw new Error('The admin directory could not be loaded.');
    }
  },
};

const mockRepository: AdminDirectoryRepository = { async load() { return mockDirectory(); } };
export const adminDirectoryRepository = adminDataMode === 'firestore' ? firebaseRepository : mockRepository;
