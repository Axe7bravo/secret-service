import type { Timestamp } from 'firebase-admin/firestore';
export interface OperationalSettingsRecord {
    operationCreationEnabled: boolean;
    minimumLeadTimeDays: number;
    maximumFutureDays: number;
    deliveryWindows: string[];
    availabilityMessage: string;
    updatedAt?: Timestamp;
    updatedBy?: string;
}
export declare const DEFAULT_OPERATIONAL_SETTINGS: OperationalSettingsRecord;
export declare const parseOperationalSettingsInput: (value: unknown) => OperationalSettingsRecord;
export declare const operationalSettingsFrom: (value: unknown) => OperationalSettingsRecord;
export declare const customerSafeOperationalSettings: (settings: OperationalSettingsRecord) => {
    operationCreationEnabled: boolean;
    minimumLeadTimeDays: number;
    maximumFutureDays: number;
    deliveryWindows: string[];
    availabilityMessage: string;
};
//# sourceMappingURL=operationalSettings.d.ts.map