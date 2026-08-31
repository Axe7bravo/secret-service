import { Link } from 'react-router-dom';
import { OperationList } from '../components/OperationList';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { useOperationsState } from '../hooks/useOperations';
import type { OperationStatus } from '../types/operations';

export function DashboardPage() {
  const { data: operations, loading, error } = useOperationsState();
  const count = (...statuses: OperationStatus[]) => operations.filter((item) => statuses.includes(item.operationStatus)).length;
  const metrics = [['New Operations', count('NEW')], ['Awaiting Review', count('REVIEW_REQUIRED')], ['Preparing', count('PREPARING', 'READY_FOR_DELIVERY')], ['Out for Delivery', count('OUT_FOR_DELIVERY')], ['Completed', count('COMPLETED')]] as const;
  const actionRequired = operations.filter((item) => ['NEW', 'REVIEW_REQUIRED', 'DELIVERY_FAILED'].includes(item.operationStatus));

  return <main className="admin-main">
    <PageHeader eyebrow="CONTROL OVERVIEW" title="Dashboard" description="Current operations and trusted workflow activity across the live administrative ledger." actions={<Link to="/operations">Open ledger</Link>} />
    {error && <div className="admin-notice is-error" role="alert">{error}</div>}
    <section className="metric-grid" aria-label="Operational summary" aria-busy={loading}>{metrics.map(([label, value]) => <article className="metric-block" key={label}><span>{label}</span><strong>{loading ? '—' : String(value).padStart(2, '0')}</strong><small>{loading ? 'LOADING' : 'ACTIVE LEDGER'}</small></article>)}</section>
    <div className="dashboard-grid">
      <SectionCard title="Recent Operations" eyebrow="LATEST ACTIVITY" className="dashboard-recent">{loading ? <div className="repository-state">Loading operations…</div> : <OperationList operations={operations.slice(0, 5)} compact />}<Link className="section-link" to="/operations">View all operations <span aria-hidden="true">→</span></Link></SectionCard>
      <SectionCard title="Action Required" eyebrow="OPERATOR ATTENTION" className="dashboard-actions">{loading ? <div className="repository-state">Reviewing queue…</div> : actionRequired.length ? <ul className="attention-list">{actionRequired.map((operation) => <li key={operation.operationId}><div><strong>{operation.operationId}</strong><span>{attentionReason(operation.operationStatus, operation.requestedDeliveryWindow)}</span></div><Link to={`/operations/${operation.operationId}`} aria-label={`Review ${operation.operationId}`}>Review</Link></li>)}</ul> : <div className="repository-state">No operations currently require attention.</div>}</SectionCard>
    </div>
  </main>;
}

function attentionReason(status: string, deliveryWindow: string) {
  if (status === 'DELIVERY_FAILED') return 'Delivery failed — review field notes';
  if (status === 'REVIEW_REQUIRED') return 'Classified message awaits review';
  if (deliveryWindow === 'Not supplied') return 'Missing requested delivery window';
  return 'New operation requires triage';
}
