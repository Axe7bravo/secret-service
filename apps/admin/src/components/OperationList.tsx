import { Link } from 'react-router-dom';
import type { Operation } from '../types/operations';
import { OperationStatusBadge } from './OperationStatusBadge';

const money = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });
const date = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });

export function OperationList({ operations, compact = false }: { operations: readonly Operation[]; compact?: boolean }) {
  if (!operations.length) return <div className="empty-state"><strong>No operations located</strong><p>Adjust the active filters or search term.</p></div>;
  return <div className={`operation-table-wrap${compact ? ' is-compact' : ''}`}><table className="operation-table"><thead><tr><th>Operation</th><th>Package</th><th>Recipient</th>{!compact && <th>Campus</th>}<th>Status</th>{!compact && <th>Delivery</th>}<th>Amount</th><th>Created</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{operations.map((operation) => <tr key={operation.operationId}><td data-label="Operation"><strong>{operation.operationId}</strong><span>{operation.customerName}</span></td><td data-label="Package">{operation.packageType}</td><td data-label="Recipient"><strong>{operation.recipientName}</strong><span>{operation.recipientPhone}</span></td>{!compact && <td data-label="Campus">{operation.campus}</td>}<td data-label="Status"><OperationStatusBadge status={operation.operationStatus} /></td>{!compact && <td data-label="Delivery"><strong>{operation.requestedDeliveryDate}</strong><span>{operation.requestedDeliveryWindow}</span></td>}<td data-label="Amount">{money.format(operation.amount)}</td><td data-label="Created">{date.format(new Date(operation.createdAt))}</td><td className="operation-open"><Link to={`/operations/${operation.operationId}`} aria-label={`Open operation ${operation.operationId}`}>Open <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div>;
}
