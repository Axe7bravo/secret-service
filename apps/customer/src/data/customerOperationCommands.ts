import { CAMPUS_OPERATION_PACKAGES } from '@secret-service/config';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { CreateCustomerOperationInput, CreateCustomerOperationResult } from '../types/operationCreation';
import { customerOperationsRepository } from './customerOperationsRepository';
import { customerDataMode } from './customerReadRepository';

export interface CustomerOperationCommands {
  createOperation(input: CreateCustomerOperationInput): Promise<CreateCustomerOperationResult>;
}

const friendlyCreationError = (error: unknown): Error => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code.includes('unauthenticated')) return new Error('Your secure session expired. Sign in and try again.');
  if (code.includes('invalid-argument')) return new Error('Review the operation details and correct any missing or invalid information.');
  if (code.includes('unavailable') || code.includes('network')) return new Error('The secure operations service is temporarily unavailable. Try again shortly.');
  return new Error('The operation could not be submitted. Please try again.');
};

const firebaseCommands: CustomerOperationCommands = {
  async createOperation(input) {
    try {
      const callable = httpsCallable<CreateCustomerOperationInput, CreateCustomerOperationResult>(getFirebaseFunctions(), 'createOperation');
      return (await callable(input)).data;
    } catch (error) {
      throw friendlyCreationError(error);
    }
  },
};

const mockCommands: CustomerOperationCommands = {
  async createOperation(input) {
    const selectedPackage = CAMPUS_OPERATION_PACKAGES.find(item => item.id === input.packageId);
    if (!selectedPackage) throw new Error('Select a supported operation package.');
    return customerOperationsRepository.create(input, selectedPackage);
  },
};

export const customerOperationCommands = customerDataMode === 'firestore' ? firebaseCommands : mockCommands;
