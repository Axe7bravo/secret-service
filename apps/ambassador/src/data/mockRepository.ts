import { getFirebaseAuth } from '../../../../packages/firebase/src';
import type { AssignedOperation } from '../types';
import type { OperationRepository } from './repository';

const stores = new Map<string, AssignedOperation[]>();
const listeners = new Set<() => void>();
const itemsFor = (uid: string) => {
  let items = stores.get(uid);
  if (!items) {
    items = [{
      operationId: 'DEMO-DELIVERY-001', packageName: 'Anonymous Apology', status: 'AMBASSADOR_ASSIGNED',
      recipient: { name: 'Demo Recipient', phone: '', campus: 'Demonstration Campus', residence: 'Reception', location: 'Main reception desk', instructions: 'Synthetic development record. Do not perform a real delivery.' },
      requestedDate: '2026-09-06', requestedWindow: '14:00–16:00', assignedAt: '2026-09-06T10:00:00.000Z', startedAt: null, deliveredAt: null, updatedAt: '2026-09-06T10:00:00.000Z', availableActions: ['OUT_FOR_DELIVERY'],
    }];
    stores.set(uid, items);
  }
  return items;
};
export const mockRepository: OperationRepository = {
  subscribe(uid, count, listener) {
    const emit = () => listener(itemsFor(uid).slice(0, count));
    listeners.add(emit); emit(); return () => { listeners.delete(emit); };
  },
  subscribeOne(uid, id, listener) {
    const emit = () => listener(itemsFor(uid).find(item => item.operationId === id) ?? null);
    listeners.add(emit); emit(); return () => { listeners.delete(emit); };
  },
  async transition(id, toStatus, reason) {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) throw new Error('Sign in again.');
    const items = itemsFor(uid), item = items.find(entry => entry.operationId === id);
    if (!item || !item.availableActions.includes(toStatus)) throw new Error('This action is no longer available.');
    if (toStatus === 'DELIVERY_FAILED' && (!reason?.trim() || reason.length > 500)) throw new Error('Provide a reason of at most 500 characters.');
    const now = new Date().toISOString();
    stores.set(uid, items.map(entry => entry !== item ? entry : { ...item, status: toStatus, updatedAt: now,
      startedAt: toStatus === 'OUT_FOR_DELIVERY' ? now : item.startedAt,
      deliveredAt: toStatus === 'DELIVERED' ? now : item.deliveredAt,
      availableActions: toStatus === 'OUT_FOR_DELIVERY' ? ['DELIVERED', 'DELIVERY_FAILED'] : [],
    }));
    listeners.forEach(emit => emit());
  },
};
