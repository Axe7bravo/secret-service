import { createHash } from 'node:crypto';
import type { UserRecord } from 'firebase-admin/auth';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requireAdmin } from '../auth/requireAdmin.js';
import type { OperationRecord, OperationStatus } from '../domain/operationTypes.js';
import { getAdminAuth, getAdminFirestore } from '../firebaseAdmin.js';

const DIRECTORY_LIMIT = 500;

interface DirectoryOperation {
  operationId: string;
  status: OperationStatus;
  packageName: string;
  createdAt: string;
}

interface CustomerAccumulator {
  customerId: string;
  email?: string;
  displayName?: string;
  accountState: 'ACTIVE' | 'DISABLED' | 'UNAVAILABLE';
  joinedAt?: string;
  lastSignInAt?: string;
  operations: DirectoryOperation[];
}

interface RecipientAccumulator {
  recipientId: string;
  name: string;
  phone: string;
  campus: string;
  residence: string;
  latestLocation: string;
  operations: DirectoryOperation[];
}

const operationSummary = (operation: OperationRecord): DirectoryOperation => ({
  operationId: operation.operationId,
  status: operation.status,
  packageName: operation.package.nameSnapshot,
  createdAt: operation.createdAt.toDate().toISOString(),
});

const customerFromAuth = (user: UserRecord): CustomerAccumulator => ({
  customerId: user.uid,
  ...(user.email ? { email: user.email } : {}),
  ...(user.displayName ? { displayName: user.displayName } : {}),
  accountState: user.disabled ? 'DISABLED' : 'ACTIVE',
  ...(user.metadata.creationTime ? { joinedAt: new Date(user.metadata.creationTime).toISOString() } : {}),
  ...(user.metadata.lastSignInTime ? { lastSignInAt: new Date(user.metadata.lastSignInTime).toISOString() } : {}),
  operations: [],
});

const isCustomerAccount = (user: UserRecord): boolean => {
  const role = user.customClaims?.role;
  return role !== 'admin' && role !== 'ambassador';
};

const normalize = (value: string): string => value.trim().toLocaleLowerCase('en-ZA').replace(/\s+/g, ' ');
const recipientReference = (operation: OperationRecord): string => createHash('sha256')
  .update([normalize(operation.recipient.name), normalize(operation.recipient.phone), normalize(operation.recipient.campus)].join('|'))
  .digest('hex')
  .slice(0, 24);

export const getAdminDirectory = onCall(async request => {
  requireAdmin(request);
  try {
    const db = getAdminFirestore();
    const [usersResult, operationsSnapshot] = await Promise.all([
      getAdminAuth().listUsers(DIRECTORY_LIMIT),
      db.collection('operations').orderBy('createdAt', 'desc').limit(DIRECTORY_LIMIT).get(),
    ]);
    const operations = operationsSnapshot.docs.map(document => document.data() as OperationRecord);
    const customers = new Map<string, CustomerAccumulator>();
    usersResult.users.filter(isCustomerAccount).forEach(user => customers.set(user.uid, customerFromAuth(user)));
    const recipients = new Map<string, RecipientAccumulator>();

    for (const operation of operations) {
      const customer = customers.get(operation.customerId) ?? {
        customerId: operation.customerId,
        accountState: 'UNAVAILABLE' as const,
        operations: [],
      };
      customer.operations.push(operationSummary(operation));
      customers.set(operation.customerId, customer);

      const recipientId = recipientReference(operation);
      const recipient = recipients.get(recipientId) ?? {
        recipientId,
        name: operation.recipient.name,
        phone: operation.recipient.phone,
        campus: operation.recipient.campus,
        residence: operation.recipient.residence,
        latestLocation: operation.recipient.deliveryLocation,
        operations: [],
      };
      recipient.operations.push(operationSummary(operation));
      recipients.set(recipientId, recipient);
    }

    return {
      customers: [...customers.values()].map(customer => ({
        ...customer,
        operationCount: customer.operations.length,
        activeOperationCount: customer.operations.filter(operation => !['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED'].includes(operation.status)).length,
        completedOperationCount: customer.operations.filter(operation => operation.status === 'COMPLETED').length,
      })),
      recipients: [...recipients.values()].map(recipient => ({
        ...recipient,
        operationCount: recipient.operations.length,
      })),
      truncated: usersResult.pageToken !== undefined || operationsSnapshot.size === DIRECTORY_LIMIT,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'The admin directory could not be loaded.');
  }
});
