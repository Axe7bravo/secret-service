import type { CampusOperationPackageId } from '@secret-service/config';

export interface CreateCustomerOperationInput {
  packageId: CampusOperationPackageId;
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

export interface CreateCustomerOperationResult {
  operationId: string;
  status: 'PAYMENT_PENDING';
}
