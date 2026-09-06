import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseFunctions } from '../../../../packages/firebase/src';
import type { AssignedOperation, DeliveryAction } from '../types';
import { mapAssignedOperation } from './operationMapper';
import { mockRepository } from './mockRepository';

export interface OperationRepository {
  subscribe(uid: string, count: number, listener: (items: AssignedOperation[]) => void, error: (message: string) => void): () => void;
  subscribeOne(uid: string, operationId: string, listener: (item: AssignedOperation | null) => void, error: (message: string) => void): () => void;
  transition(operationId: string, toStatus: DeliveryAction, reason?: string): Promise<void>;
}
export const dataMode = import.meta.env.DEV && import.meta.env.VITE_DATA_SOURCE === 'mock' ? 'mock' : 'firestore';
const assertUser = (uid: string) => { if (!uid || getFirebaseAuth().currentUser?.uid !== uid) throw new Error('Sign in again to access your assignments.'); };
const firestoreRepository: OperationRepository = {
  subscribe(uid, count, listener, error) {
    assertUser(uid);
    const q = query(collection(getFirebaseFirestore(), 'ambassadorOperations'), where('ambassadorUid', '==', uid), orderBy('updatedAt', 'desc'), limit(Math.min(200, count)));
    return onSnapshot(q, { includeMetadataChanges: true }, snapshot => {
      try {
        assertUser(uid);
        if (snapshot.metadata.fromCache) { error('Connecting to the assignment service. Live access must be verified before delivery details are shown.'); return; }
        listener(snapshot.docs.map(item => mapAssignedOperation(item.data(), item.id, uid)));
      } catch { error('Assignments could not be read. Refresh access or retry the connection.'); }
    }, () => error('Assignments could not be loaded. Check your connection and ambassador access, then retry.'));
  },
  subscribeOne(uid, operationId, listener, error) {
    assertUser(uid);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(operationId)) { listener(null); return () => {}; }
    return onSnapshot(doc(getFirebaseFirestore(), 'ambassadorOperations', operationId), { includeMetadataChanges: true }, snapshot => {
      try {
        assertUser(uid);
        if (snapshot.metadata.fromCache) { error('Reconnecting. Delivery details are hidden until access is verified.'); return; }
        if (!snapshot.exists() || snapshot.data()?.ambassadorUid !== uid) { listener(null); return; }
        listener(mapAssignedOperation(snapshot.data(), snapshot.id, uid));
      } catch { error('This delivery could not be read. Retry or contact Admin.'); }
    }, () => error('This assignment is unavailable or has been reassigned. Return to My Deliveries, or retry if your connection failed.'));
  },
  async transition(operationId, toStatus, reason) {
    try {
      await httpsCallable<{ operationId: string; toStatus: DeliveryAction; reason?: string }, { operationId: string; toStatus: DeliveryAction }>(getFirebaseFunctions(), 'ambassadorTransitionOperation')({ operationId, toStatus, ...(reason ? { reason } : {}) });
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      const messages: Record<string, string> = {
        'functions/permission-denied': 'This assignment is no longer available to your account. Contact Admin.',
        'functions/unauthenticated': 'Your session expired. Sign out and sign in again.',
        'functions/failed-precondition': 'The delivery changed or needs Admin attention. Review the latest status before retrying.',
        'functions/invalid-argument': 'Check the action and supply a delivery issue reason of at most 500 characters.',
      };
      throw new Error(messages[code] ?? 'The action could not be confirmed. Check the current status before retrying.');
    }
  },
};
export const operationRepository = dataMode === 'mock' ? mockRepository : firestoreRepository;
