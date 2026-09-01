export interface CreateCustomerOperationInput {
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

export interface CreateCustomerOperationResult {
  operationId: string;
  status: 'PAYMENT_PENDING';
}
