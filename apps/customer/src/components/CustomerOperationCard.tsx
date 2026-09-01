import { Link } from 'react-router-dom';
import type { CustomerOperation } from '../types/customer';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { CustomerArchiveControl } from './CustomerArchiveControl';

const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

export function CustomerOperationCard({ operation }: { operation: CustomerOperation }) {
  return <article className="client-operation-card"><header><div><span>{operation.operationId}</span><h2>{operation.packageName}</h2></div><div className="operation-card-state"><CustomerStatusBadge status={operation.status} />{operation.archived&&<span className="archive-indicator">Archived</span>}</div></header><dl><div><dt>Recipient</dt><dd>{operation.recipient.name}</dd></div><div><dt>Requested delivery</dt><dd>{formatDate(operation.delivery.requestedDate)}</dd></div><div><dt>Amount</dt><dd>R {operation.amount.toFixed(2)}</dd></div></dl><footer className="operation-card-actions"><Link to={`/operations/${operation.operationId}`}>Open operation file <span aria-hidden="true">→</span></Link><CustomerArchiveControl operation={operation} compact /></footer></article>;
}
