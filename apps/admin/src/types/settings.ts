import type { CustomerOperationalSettings } from '@secret-service/config';
export interface AdminOperationalSettings extends CustomerOperationalSettings {updatedAt:string|null;updatedBy:string|null}
export type OperationalSettingsDraft=CustomerOperationalSettings;
