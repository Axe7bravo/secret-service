import { Link } from 'react-router-dom';
import { OperationList } from '../components/OperationList';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { operationsRepository } from '../data/operationsRepository';

export function DashboardPage() {
  const operations = operationsRepository.list();
  const metrics = [
    ['New Operations', operations.filter((item) => item.operationStatus === 'NEW').length],
    ['Awaiting Review', operations.filter((item) => item.operationStatus === 'REVIEW_REQUIRED').length],
    ['Preparing', operations.filter((item) => item.operationStatus === 'PREPARING').length],
    ['Out for Delivery', operations.filter((item) => item.operationStatus === 'OUT_FOR_DELIVERY').length],
    ['Completed Today', operations.filter((item) => item.operationStatus === 'COMPLETED').length],
  ] as const;
  const actionRequired = operations.filter((item) => ['REVIEW_REQUIRED', 'DELIVERY_FAILED', 'NEW'].includes(item.operationStatus));

  return <main className="admin-main">
    <PageHeader eyebrow="CONTROL OVERVIEW" title="Dashboard" description="Current launch operations across Bloemfontein campus delivery." />
    <section className="metric-grid" aria-label="Operational summary">{metrics.map(([label, value]) => <article className="metric-block" key={label}><span>{label}</span><strong>{String(value).padStart(2, '0')}</strong><small>ACTIVE LEDGER</small></article>)}</section>
    <div className="dashboard-grid">
      <SectionCard title="Recent Operations" eyebrow="LATEST ACTIVITY" className="dashboard-recent">
        <OperationList operations={operations.slice(0, 5)} compact />
        <Link className="section-link" to="/operations">View all operations <span aria-hidden="true">→</span></Link>
      </SectionCard>
      <SectionCard title="Action Required" eyebrow="OPERATOR ATTENTION" className="dashboard-actions">
        <ul className="attention-list">{actionRequired.map((operation) => <li key={operation.operationId}><div><strong>{operation.operationId}</strong><span>{attentionReason(operation.operationStatus, operation.requestedDeliveryWindow)}</span></div><Link to={`/operations/${operation.operationId}`} aria-label={`Review ${operation.operationId}`}>Review</Link></li>)}</ul>
      </SectionCard>
    </div>
  </main>;
}

function attentionReason(status: string, deliveryWindow: string) {
  if (status === 'DELIVERY_FAILED') return 'Delivery failed — review field notes';
  if (status === 'REVIEW_REQUIRED') return 'Classified message awaits review';
  if (deliveryWindow === 'Not supplied') return 'Missing requested delivery window';
  return 'New operation requires triage';
}
