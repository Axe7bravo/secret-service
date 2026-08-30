import type { CustomerOperationStatus } from '../types/customer';import { getCustomerStatus } from '../utils/status';
export function CustomerStatusBadge({status}:{status:CustomerOperationStatus}){const visible=getCustomerStatus(status);return <span className={`client-status status-${visible.key}`}>{visible.label}</span>}
