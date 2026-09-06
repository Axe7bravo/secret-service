import type { Firestore, Transaction } from 'firebase-admin/firestore';
import type { OperationRecord } from '../domain/operationTypes.js';
export declare const buildAmbassadorOperationProjection: (operation: OperationRecord) => {
    operationId: string;
    ambassadorUid: string | undefined;
    ambassadorId: string | undefined;
    packageName: string;
    status: import("../domain/operationTypes.js").OperationStatus;
    recipient: {
        name: string;
        phone: string;
        campus: string;
        residence: string;
        location: string;
        instructions: string;
    };
    requestedDate: string;
    requestedWindow: string;
    assignedAt: FirebaseFirestore.Timestamp | null;
    startedAt: FirebaseFirestore.Timestamp | null;
    deliveredAt: FirebaseFirestore.Timestamp | null;
    updatedAt: FirebaseFirestore.Timestamp;
    availableActions: readonly import("../domain/operationWorkflow.js").AmbassadorAction[];
};
export declare const writeAmbassadorOperationProjection: (transaction: Transaction, db: Firestore, operation: OperationRecord) => void;
//# sourceMappingURL=ambassadorOperationProjection.d.ts.map