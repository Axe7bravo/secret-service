import { type TransitionMetadata } from '../domain/operationWorkflow.js';
import type { OperationStatus } from '../domain/operationTypes.js';
interface TransitionInput {
    operationId: string;
    toStatus: OperationStatus;
    metadata?: TransitionMetadata;
}
export declare const transitionOperation: import("firebase-functions/v2/https").CallableFunction<TransitionInput, any, unknown>;
export {};
//# sourceMappingURL=transitionOperation.d.ts.map