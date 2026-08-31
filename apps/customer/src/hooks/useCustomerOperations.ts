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
    let active = true;
    if (!user) {
      setOperations([]);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError(null);
    const repository = createCustomerOperationReadRepository(user.uid);
    void repository.list()
      .then(result => { if (active) setOperations(result); })
      .catch(() => { if (active) setError('Your operation files could not be loaded. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [user, revision]);

  return { operations, loading, error, refresh };
};

export const useCustomerOperation = (operationId: string | undefined) => {
  const state = useCustomerOperations();
  return { ...state, operation: state.operations.find(item => item.operationId === operationId) };
};
