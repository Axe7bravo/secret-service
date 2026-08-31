import { Link } from 'react-router-dom';
import type { DirectoryOperationSummary } from '../types/directory';
import { OperationStatusBadge } from './OperationStatusBadge';

const date = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium' });

export function DirectoryOperationList({ operations }: { operations: readonly DirectoryOperationSummary[] }) {
  if (!operations.length) return <div className="repository-state">No related operations.</div>;
  return <div className="operation-table-wrap"><table className="operation-table directory-operation-table"><thead><tr><th>Operation</th><th>Package</th><th>Date</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{operations.map(operation => <tr key={operation.operationId}><td data-label="Operation"><strong>{operation.operationId}</strong></td><td data-label="Package">{operation.packageName}</td><td data-label="Date">{date.format(new Date(operation.createdAt))}</td><td data-label="Status"><OperationStatusBadge status={operation.status} /></td><td className="operation-open"><Link to={`/operations/${operation.operationId}`}>Open <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div>;
}
