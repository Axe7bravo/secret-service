import type { CustomerOperationStatus } from '../types/customer';import { getCustomerStatus } from '../utils/status';
export function CustomerStatusBadge({status}:{status:CustomerOperationStatus}){const view=getCustomerStatus(status);return <span className={`customer-status customer-status--${view.key}`}>{view.label}</span>}
