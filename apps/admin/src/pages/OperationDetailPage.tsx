import { useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { OperationActionDialog } from '../components/OperationActionDialog';
import { OperationStatusBadge } from '../components/OperationStatusBadge';
import { adminOperationCommands, adminWriteMode } from '../data/adminOperationCommands';
import { adminOperationsRepository } from '../data/adminOperationsRepository';
import { getAvailableActions, type WorkflowAction } from '../domain/operationWorkflow';
import { useOperationState } from '../hooks/useOperations';

const money = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });
const date = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
const Field = ({ label, children }: { label: string; children: ReactNode }) => <div className="operation-field"><dt>{label}</dt><dd>{children || '—'}</dd></div>;

export function OperationDetailPage() {
  const { operationId } = useParams();
  const location=useLocation();const fromModeration=location.pathname.startsWith('/moderation/');const backTo=fromModeration?'/moderation':'/operations';const backLabel=fromModeration?'moderation queue':'operations';
  const { data: operation, loading, error: loadError } = useOperationState(operationId);
  const [action, setAction] = useState<WorkflowAction | null>(null);
  const [error, setError] = useState('');
  if (loading) return <main className="admin-main"><div className="repository-state panel-state" aria-live="polite">Loading operation file…</div></main>;
  if (loadError) return <main className="admin-main"><div className="admin-notice is-error" role="alert">{loadError}</div><Link className="back-link" to={backTo}>← Return to {backLabel}</Link></main>;
  if (!operation) return <main className="admin-main"><p className="eyebrow">OPERATION FILE</p><h1>Operation not found</h1><Link to={backTo}>Return to {backLabel}</Link></main>;
  const actions = getAvailableActions(operation.operationStatus);
  const confirm = async (value: { note?: string; ambassador?: string; reviewConfirmed?: boolean }) => { if (!action) return; try { await adminOperationCommands.transitionOperation(operation.operationId, action.toStatus, { ...value, actor: 'Admin User' }); setAction(null); setError(''); } catch (issue) { const message=issue instanceof Error?issue.message:'Unable to update operation.';setError(message);throw new Error(message); } };
  const reset = () => { if (window.confirm('Reset all mock operations?')) adminOperationsRepository.reset(); };

  return <main className="admin-main operation-detail-page">
    <Link className="back-link" to={backTo}>← Back to {backLabel}</Link>
    <header className="operation-detail-header"><div><p className="eyebrow">CLASSIFIED OPERATION FILE</p><h1>{operation.operationId}</h1><p>{operation.packageType} · Created {date.format(new Date(operation.createdAt))}</p></div><OperationStatusBadge status={operation.operationStatus} /></header>
    <section className="operation-command-panel" aria-labelledby="available-actions-title"><div><p className="eyebrow">WORKFLOW CONTROL</p><h2 id="available-actions-title">Available Actions</h2></div>{actions.length ? <div className="available-actions">{actions.map((item) => <button key={item.id} type="button" className={`button ${item.tone === 'danger' ? 'button--danger' : 'button--primary'}`} onClick={() => setAction(item)}>{item.label}</button>)}</div> : <p className="workflow-empty-state">No further workflow actions are available for this operation.</p>}{error && <p role="alert" className="workflow-dialog__error">{error}</p>}{adminWriteMode === 'mock' && <button type="button" className="mock-reset-control" onClick={reset}>Reset mock data</button>}</section>
    <div className="operation-file-grid"><section className="operation-section"><p className="eyebrow">CUSTOMER</p><h2>Customer Details</h2><dl className="operation-fields"><Field label="Customer reference">{operation.customerId ? <Link to={`/customers/${encodeURIComponent(operation.customerId)}`}>{operation.customerId}</Link> : '—'}</Field><Field label="Name">{operation.customerName}</Field><Field label="Email">{operation.email}</Field><Field label="Phone">{operation.phone}</Field></dl></section><section className="operation-section"><p className="eyebrow">RECIPIENT</p><h2>Recipient Details</h2><dl className="operation-fields"><Field label="Name">{operation.recipientName}</Field><Field label="Phone">{operation.recipientPhone}</Field><Field label="Campus">{operation.campus}</Field><Field label="Residence">{operation.residence}</Field></dl></section><section className="operation-section"><p className="eyebrow">PACKAGE</p><h2>Package & Message</h2><dl className="operation-fields"><Field label="Package">{operation.packageType}</Field><Field label="Amount">{money.format(operation.amount)}</Field><Field label="Anonymous message"><span className="classified-copy">{operation.anonymousMessage}</span></Field></dl></section><section className="operation-section"><p className="eyebrow">DELIVERY</p><h2>Delivery Details</h2><dl className="operation-fields"><Field label="Location">{operation.deliveryLocation}</Field><Field label="Date">{operation.requestedDeliveryDate}</Field><Field label="Window">{operation.requestedDeliveryWindow}</Field><Field label="Notes">{operation.deliveryNotes}</Field><Field label="Ambassador">{operation.ambassador}</Field></dl></section><section className="operation-section"><p className="eyebrow">PAYMENT</p><h2>Payment</h2><dl className="operation-fields"><Field label="Status">{operation.paymentStatus}</Field><Field label="Reference">{operation.paymentReference}</Field></dl></section><section className="operation-section"><p className="eyebrow">MODERATION</p><h2>Internal Review</h2><dl className="operation-fields"><Field label="Status">{operation.moderationStatus}</Field><Field label="Rejection">{operation.rejectionReason}</Field><Field label="Cancellation">{operation.cancellationReason}</Field><Field label="Delivery failure">{operation.deliveryFailureReason}</Field></dl></section></div>
    <section className="operation-section operation-activity"><p className="eyebrow">AUDIT TRAIL</p><h2>Activity</h2><ActivityTimeline activity={operation.activity} /></section>
    {action && <OperationActionDialog action={action} operationId={operation.operationId} campus={operation.campus} onCancel={() => setAction(null)} onConfirm={confirm} />}
  </main>;
}
