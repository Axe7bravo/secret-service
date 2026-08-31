import type { OperationStatus } from './operations';

export interface DirectoryOperationSummary {
  operationId: string;
  status: OperationStatus;
  packageName: string;
  createdAt: string;
}

export interface AdminCustomerDirectoryItem {
  customerId: string;
  email?: string;
  displayName?: string;
  accountState: 'ACTIVE' | 'DISABLED' | 'UNAVAILABLE';
  joinedAt?: string;
  lastSignInAt?: string;
  operationCount: number;
  activeOperationCount: number;
  completedOperationCount: number;
  operations: DirectoryOperationSummary[];
}

export interface AdminRecipientDirectoryItem {
  recipientId: string;
  name: string;
  phone: string;
  campus: string;
  residence: string;
  latestLocation: string;
  operationCount: number;
  operations: DirectoryOperationSummary[];
}

export interface AdminDirectory {
  customers: AdminCustomerDirectoryItem[];
  recipients: AdminRecipientDirectoryItem[];
  truncated: boolean;
}
