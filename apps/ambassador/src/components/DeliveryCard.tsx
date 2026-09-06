import { Link } from 'react-router-dom';
import type { AssignedOperation } from '../types';
import { statusLabel, calendarDate } from '../presentation';

export function StatusBadge({ status }: { status: AssignedOperation['status'] }) {
  return <span className={`status-pill${status === 'DELIVERY_FAILED' ? ' is-issue' : ''}`}>{statusLabel(status)}</span>;
}
export function DeliveryCard({ operation }: { operation: AssignedOperation }) {
  return <article className="delivery-card"><header><div><span className="reference">{operation.operationId}</span><h3>{operation.packageName}</h3></div><StatusBadge status={operation.status} /></header><dl><div><dt>Recipient</dt><dd>{operation.recipient.name}</dd></div><div><dt>Delivery location</dt><dd>{operation.recipient.campus}<br />{operation.recipient.residence}</dd></div><div><dt>Requested date / window</dt><dd>{calendarDate(operation.requestedDate)} · {operation.requestedWindow}</dd></div></dl><Link className="card-link" to={`/operations/${encodeURIComponent(operation.operationId)}`}>Open delivery <span aria-hidden="true">→</span></Link></article>;
}
