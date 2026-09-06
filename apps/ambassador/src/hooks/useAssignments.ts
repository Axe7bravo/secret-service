import { useEffect, useState } from 'react';
import { useAmbassadorAuth } from '../auth/authContext';
import { operationRepository } from '../data/repository';
import type { AssignedOperation } from '../types';

export function useAssignments(operationId?: string, count = 50) {
  const { user, claims } = useAmbassadorAuth();
  const uid = claims.role === 'ambassador' ? user?.uid : undefined;
  const [attempt, setAttempt] = useState(0);
  const key = `${uid ?? ''}:${operationId ?? ''}:${count}:${attempt}`;
  const [state, setState] = useState<{ key: string; loading: boolean; error: string; items: AssignedOperation[] }>({ key: '', loading: true, error: '', items: [] });
  useEffect(() => {
    let live = true;
    const receive = (items: AssignedOperation[]) => { if (live) setState({ key, items, loading: false, error: '' }); };
    const fail = (error: string) => { if (live) setState({ key, items: [], loading: false, error }); };
    let unsubscribe: (() => void) | undefined;
    if (!uid) { receive([]); return () => { live = false; }; }
    try {
      unsubscribe = operationId
        ? operationRepository.subscribeOne(uid, operationId, item => receive(item ? [item] : []), fail)
        : operationRepository.subscribe(uid, count, receive, fail);
    } catch { fail('Assignments are unavailable. Check your configuration and retry.'); }
    return () => { live = false; unsubscribe?.(); };
  }, [uid, operationId, count, key]);
  return { ...(state.key === key ? state : { items: [], loading: true, error: '' }), retry: () => setAttempt(value => value + 1) };
}
