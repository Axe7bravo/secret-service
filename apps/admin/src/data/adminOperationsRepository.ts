import { transitionOperation, type TransitionContext } from '../domain/operationWorkflow';
import type { Operation, OperationStatus } from '../types/operations';

const STORAGE_KEY = 'secret-service-admin-mock-operations-v2';

const seedOperations: readonly Operation[] = [
  {
    operationId: 'SS-2601', createdAt: '2026-08-30T08:15:00Z', packageType: 'Soft Revenge', amount: 399,
    customerName: 'Naledi Mokoena', email: 'naledi@example.com', phone: '+27 71 111 2201',
    recipientName: 'Lerato Ndlovu', recipientPhone: '+27 72 200 1101', campus: 'UFS', residence: 'Kovsie Residence',
    deliveryLocation: 'Main reception', deliveryNotes: 'Call on arrival', requestedDeliveryDate: '2026-09-02', requestedDeliveryWindow: '14:00–16:00',
    paymentStatus: 'PAID', paymentReference: 'PAY-2601', paymentDate: '2026-08-30T08:15:00Z', operationStatus: 'REVIEW_REQUIRED', moderationStatus: 'PENDING', ambassador: null,
    anonymousMessage: 'A harmless reminder that deadlines matter.', activity: [{ id: 'seed-SS-2601', timestamp: '2026-08-30T08:15:00Z', actor: 'Mock system', toStatus: 'REVIEW_REQUIRED', note: 'Initial mock operation state.' }],
  },
  {
    operationId: 'SS-2602', createdAt: '2026-08-29T11:20:00Z', packageType: 'Office Prank Kit', amount: 549,
    customerName: 'Michael Adams', email: 'michael@example.com', phone: '+27 82 111 2202',
    recipientName: 'Jason Smith', recipientPhone: '+27 82 200 1102', campus: 'CUT', residence: 'Engineering Block',
    deliveryLocation: 'Security desk', deliveryNotes: 'Leave with reception', requestedDeliveryDate: '2026-09-03', requestedDeliveryWindow: '10:00–12:00',
    paymentStatus: 'PAID', paymentReference: 'PAY-2602', paymentDate: '2026-08-29T11:20:00Z', operationStatus: 'PREPARING', moderationStatus: 'APPROVED', ambassador: null,
    anonymousMessage: 'Congratulations on surviving another sprint.', activity: [{ id: 'seed-SS-2602', timestamp: '2026-08-29T11:20:00Z', actor: 'Mock system', toStatus: 'PREPARING', note: 'Initial mock operation state.' }],
  },
  {
    operationId: 'SS-2603', createdAt: '2026-08-28T09:45:00Z', packageType: 'Anonymous Apology', amount: 299,
    customerName: 'Thandi Molefe', email: 'thandi@example.com', phone: '+27 73 111 2203',
    recipientName: 'Kabelo Dube', recipientPhone: '+27 73 200 1103', campus: 'UFS', residence: 'Akasia',
    deliveryLocation: 'Residence entrance', deliveryNotes: 'Text before arrival', requestedDeliveryDate: '2026-09-01', requestedDeliveryWindow: '16:00–18:00',
    paymentStatus: 'PAID', paymentReference: 'PAY-2603', paymentDate: '2026-08-28T09:45:00Z', operationStatus: 'OUT_FOR_DELIVERY', moderationStatus: 'APPROVED', ambassador: 'Refilwe Sello',
    anonymousMessage: 'I should have listened. I am sorry.', activity: [{ id: 'seed-SS-2603', timestamp: '2026-08-28T09:45:00Z', actor: 'Mock system', toStatus: 'OUT_FOR_DELIVERY', note: 'Initial mock operation state.' }],
  },
  {
    operationId: 'SS-2604', createdAt: '2026-08-27T13:00:00Z', packageType: 'Soft Revenge', amount: 399,
    customerName: 'Anele Jacobs', email: 'anele@example.com', phone: '+27 74 111 2204',
    recipientName: 'Sibusiso Khumalo', recipientPhone: '+27 74 200 1104', campus: 'CUT', residence: 'Admin Building',
    deliveryLocation: 'Front desk', deliveryNotes: 'Recipient works upstairs', requestedDeliveryDate: '2026-08-30', requestedDeliveryWindow: '12:00–14:00',
    paymentStatus: 'PAID', paymentReference: 'PAY-2604', paymentDate: '2026-08-27T13:00:00Z', operationStatus: 'DELIVERY_FAILED', moderationStatus: 'APPROVED', ambassador: 'Tshepo Mokoena',
    anonymousMessage: 'Your coffee debt has been formally escalated.', activity: [{ id: 'seed-SS-2604', timestamp: '2026-08-27T13:00:00Z', actor: 'Mock system', toStatus: 'DELIVERY_FAILED', note: 'Initial mock operation state.' }],
  },
  {
    operationId: 'SS-2605', createdAt: '2026-08-26T10:10:00Z', packageType: 'Office Prank Kit', amount: 549,
    customerName: 'Palesa Mokoena', email: 'palesa@example.com', phone: '+27 76 111 2205',
    recipientName: 'Reuben Daniels', recipientPhone: '+27 76 200 1105', campus: 'UFS', residence: 'Commerce Building',
    deliveryLocation: 'Office 214', deliveryNotes: 'Weekdays only', requestedDeliveryDate: '2026-08-31', requestedDeliveryWindow: '09:00–11:00',
    paymentStatus: 'PAID', paymentReference: 'PAY-2605', paymentDate: '2026-08-26T10:10:00Z', operationStatus: 'COMPLETED', moderationStatus: 'APPROVED', ambassador: 'Onthatile Motsoeneng',
    anonymousMessage: 'The meeting could have been an email.', activity: [{ id: 'seed-SS-2605', timestamp: '2026-08-26T10:10:00Z', actor: 'Mock system', toStatus: 'COMPLETED', note: 'Initial mock operation state.' }],
  },
  {
    operationId: 'SS-2606', createdAt: '2026-08-30T14:05:00Z', packageType: 'Anonymous Apology', amount: 299,
    customerName: 'Zinhle Dlamini', email: 'zinhle@example.com', phone: '+27 78 111 2206',
    recipientName: 'Amogelang Radebe', recipientPhone: '+27 78 200 1106', campus: 'UFS', residence: 'Roosmaryn',
    deliveryLocation: 'Main gate', deliveryNotes: 'No special notes', requestedDeliveryDate: '2026-09-04', requestedDeliveryWindow: '15:00–17:00',
    paymentStatus: 'PENDING', paymentReference: 'PENDING-2606', paymentDate: null, operationStatus: 'PAYMENT_PENDING', moderationStatus: 'PENDING', ambassador: null,
    anonymousMessage: 'I owe you a proper apology.', activity: [{ id: 'seed-SS-2606', timestamp: '2026-08-30T14:05:00Z', actor: 'Mock system', toStatus: 'PAYMENT_PENDING', note: 'Initial mock operation state.' }],
  },
];

const freshSeed = (): Operation[] => seedOperations.map((operation) => structuredClone(operation));

let storageAvailable = true;

const loadOperations = (): readonly Operation[] => {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    if (!value) return freshSeed();
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return freshSeed();
    }
    return parsed as Operation[];
  } catch {
    storageAvailable = false;
    return freshSeed();
  }
};

const persistOperations = (operations: readonly Operation[]): void => {
  if (!storageAvailable) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
  } catch {
    storageAvailable = false;
  }
};

const clearPersistedOperations = (): void => {
  if (!storageAvailable) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    storageAvailable = false;
  }
};

let operations: readonly Operation[] = loadOperations();
const listeners = new Set<() => void>();
const emitChange = (): void => listeners.forEach((listener) => listener());

export const adminOperationsRepository = {
  list: (): readonly Operation[] => operations,
  getById: (operationId: string): Operation | undefined =>
    operations.find((operation) => operation.operationId === operationId),
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  transition(operationId: string, status: OperationStatus, context?: TransitionContext): Operation {
    const current = operations.find((operation) => operation.operationId === operationId);
    if (!current) throw new Error('Operation not found.');
    const updated = transitionOperation(current, status, context);
    operations = operations.map((operation) => operation.operationId === operationId ? updated : operation);
    persistOperations(operations);
    emitChange();
    return updated;
  },
  reset(): void {
    operations = freshSeed();
    clearPersistedOperations();
    emitChange();
  },
};
