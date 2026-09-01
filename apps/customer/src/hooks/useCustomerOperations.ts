import { useCallback, useEffect, useState } from 'react';
import { useCustomerAuth } from '../auth/customerAuthContext';
import { createCustomerOperationReadRepository } from '../data/customerReadRepository';
import type { CustomerOperation } from '../types/customer';

interface CustomerOperationsState {
  operations: readonly CustomerOperation[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useCustomerOperations = (): CustomerOperationsState => {
  const { user } = useCustomerAuth();
  const [operations, setOperations] = useState<readonly CustomerOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!user) {
      setOperations([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);
    const repository = createCustomerOperationReadRepository(user.uid);
    return repository.subscribeList(result=>{setOperations(result);setLoading(false);setError(null)},()=>{setLoading(false);setError('Your operation files could not be loaded. Please try again.')});
  }, [user, revision]);

  return { operations, loading, error, refresh };
};

export const useCustomerOperation = (operationId: string | undefined) => {
  const state = useCustomerOperations();
  return { ...state, operation: state.operations.find(item => item.operationId === operationId) };
};
