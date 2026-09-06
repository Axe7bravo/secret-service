import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAssignments } from '../hooks/useAssignments';
import { StatusBadge } from '../components/DeliveryCard';
import { LoadState } from '../components/LoadState';
import { ActionDialog } from '../components/ActionDialog';
import { actionLabels, calendarDate, timestamp } from '../presentation';
import type { DeliveryAction } from '../types';

export function OperationDetailPage() {
  const { operationId = '' } = useParams();
  const { items, loading, error, retry } = useAssignments(operationId);
  const [action, setAction] = useState<DeliveryAction | null>(null);
  const operation = items[0];
  const back = <Link className="back-link" to="/operations">← My Deliveries</Link>;
  if (loading || error) return <main id="main" className="portal-main">{back}<LoadState loading={loading} error={error} retry={retry} /></main>;
  if (!operation) return <main id="main" className="portal-main">{back}<section className="panel"><h1>Assignment unavailable</h1><p>This operation may have been reassigned or removed from your delivery queue.</p></section></main>;
  const phone = /^\+?[0-9 ()-]{5,40}$/.test(operation.recipient.phone) ? operation.recipient.phone.replace(/[ ()-]/g, '') : null;
  return <main id="main" className="portal-main">{back}<header className="page-header"><span className="eyebrow">DELIVERY FILE · {operation.operationId}</span><h1>{operation.packageName}</h1><StatusBadge status={operation.status} /></header><section className="panel command-panel"><h2>Delivery Actions</h2>{operation.availableActions.length ? <div className="actions">{operation.availableActions.map(item => <button key={item} className={item === 'DELIVERY_FAILED' ? '' : 'primary'} onClick={() => setAction(item)}>{actionLabels[item]}</button>)}</div> : <p>No ambassador action is available. Admin manages retries, reassignment and final completion.</p>}{operation.status === 'DELIVERY_FAILED' && <p className="notice">Delivery issue recorded. Await Admin review; do not restart or self-assign.</p>}</section><div className="detail-grid"><section className="panel"><span className="eyebrow">RECIPIENT & DESTINATION</span><h2>{operation.recipient.name}</h2><p className="destination">{operation.recipient.location}</p><dl><div><dt>Campus / Residence</dt><dd>{operation.recipient.campus}<br />{operation.recipient.residence}</dd></div><div><dt>Recipient contact</dt><dd>{phone ? <a className="phone-link" href={`tel:${phone}`}>{operation.recipient.phone}</a> : operation.recipient.phone || 'Not provided'}</dd></div><div><dt>Delivery instructions</dt><dd className="preserve-lines">{operation.recipient.instructions || 'No additional instructions.'}</dd></div></dl></section><section className="panel"><span className="eyebrow">DELIVERY WINDOW</span><h2>{calendarDate(operation.requestedDate)}</h2><p>{operation.requestedWindow}</p><p className="muted">Requested date and window; confirm any changes with Admin.</p><dl><div><dt>Reference</dt><dd>{operation.operationId}</dd></div><div><dt>Last update</dt><dd>{timestamp(operation.updatedAt)}</dd></div></dl></section></div><section className="panel"><span className="eyebrow">DELIVERY PROGRESS</span><h2>Recorded Milestones</h2><ol className="progress-list">{[['Assigned', operation.assignedAt], ['Out for Delivery', operation.startedAt], ['Delivered', operation.deliveredAt]].map(([label, date]) => <li key={label}><strong>{label}</strong><span>{timestamp(date)}</span></li>)}</ol><p className="muted">Missing timestamps are not inferred. Internal audit notes remain with Admin.</p></section>{action && operation.availableActions.includes(action) && <ActionDialog key={`${operation.operationId}:${action}`} operationId={operation.operationId} action={action} close={() => setAction(null)} />}</main>;
}
