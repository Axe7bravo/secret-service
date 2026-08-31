import type { OperationStatus } from '../domain/operationTypes.js';
interface DirectoryOperation {
    operationId: string;
    status: OperationStatus;
    packageName: string;
    createdAt: string;
}
export declare const getAdminDirectory: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    customers: {
        operationCount: number;
        activeOperationCount: number;
        completedOperationCount: number;
        customerId: string;
        email?: string;
        displayName?: string;
        accountState: "ACTIVE" | "DISABLED" | "UNAVAILABLE";
        joinedAt?: string;
        lastSignInAt?: string;
        operations: DirectoryOperation[];
    }[];
    recipients: {
        operationCount: number;
        recipientId: string;
        name: string;
        phone: string;
        campus: string;
        residence: string;
        latestLocation: string;
        operations: DirectoryOperation[];
    }[];
    truncated: boolean;
}>, unknown>;
export {};
//# sourceMappingURL=getAdminDirectory.d.ts.map