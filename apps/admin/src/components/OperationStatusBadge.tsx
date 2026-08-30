import type { OperationStatus } from '../types/operations';
export function OperationStatusBadge({status}:{status:OperationStatus}){return <span className={`status-badge status-${status.toLowerCase()}`}>{status.replaceAll('_',' ')}</span>}
