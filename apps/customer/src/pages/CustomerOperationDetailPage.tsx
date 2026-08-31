import { Link, useLocation, useParams } from 'react-router-dom';
import { CustomerStatusBadge } from '../components/CustomerStatusBadge';
import { TrackingTimeline } from '../components/TrackingTimeline';
import { useCustomerOperation } from '../hooks/useCustomerOperations';
import { getCustomerStatus } from '../utils/status';

export function CustomerOperationDetailPage() {
  const { operationId } = useParams();
  const location = useLocation();
  const operationCreated = Boolean((location.state as { operationCreated?: boolean } | null)?.operationCreated);
  const { operation, loading, error, refresh } = useCustomerOperation(operationId);
  if (loading) return <main className="customer-page customer-empty" aria-live="polite">Retrieving operation file…</main>;
  if (error) return <main className="customer-page"><div className="customer-load-error" role="alert"><p>{error}</p><button type="button" onClick={refresh}>Try again</button></div></main>;
  if (!operation) return <main className="customer-page"><h1>Operation not found</h1><Link to="/operations">Return to My Operations</Link></main>;
  const view = getCustomerStatus(operation.status);

  return <main className="customer-page">
    <Link to="/operations">← Back to My Operations</Link>
    {operationCreated && <div className="operation-created-notice" role="status"><strong>Operation transmitted.</strong><span>Your request is secured and awaiting the next lifecycle step.</span></div>}
    <header className="operation-detail-heading"><div><p className="customer-eyebrow">OPERATION FILE</p><h1>{operation.operationId}</h1><p>{operation.packageName} · Created {new Date(operation.createdAt).toLocaleDateString('en-ZA')}</p></div><CustomerStatusBadge status={operation.status}/></header>
    <section className="tracking-panel"><p className="customer-eyebrow">LIVE PROGRESS</p><h2>{view.label}</h2><p>{view.description}</p><TrackingTimeline status={operation.status}/>{view.key === 'attention' && <div className="attention-note">Our operations team will contact you if further information is required.</div>}</section>
    <div className="customer-file-grid">
      <section className="customer-panel"><p className="customer-eyebrow">RECIPIENT</p><h2>Recipient Summary</h2><dl><div><dt>Name</dt><dd>{operation.recipient.name}</dd></div><div><dt>Campus</dt><dd>{operation.recipient.campus}</dd></div><div><dt>Residence / building</dt><dd>{operation.recipient.residence}</dd></div></dl></section>
      <section className="customer-panel"><p className="customer-eyebrow">PACKAGE</p><h2>Package Summary</h2><dl><div><dt>Package</dt><dd>{operation.packageName}</dd></div><div><dt>Amount</dt><dd>R {operation.amount.toFixed(2)}</dd></div><div><dt>Anonymous message</dt><dd className="anonymous-message">{operation.anonymousMessage}</dd></div></dl></section>
      <section className="customer-panel"><p className="customer-eyebrow">DELIVERY</p><h2>Delivery Summary</h2><dl><div><dt>Requested date</dt><dd>{operation.delivery.requestedDate}</dd></div><div><dt>Window</dt><dd>{operation.delivery.requestedWindow}</dd></div><div><dt>Location</dt><dd>{operation.delivery.location}</dd></div>{operation.delivery.deliveredAt && <div><dt>Delivered</dt><dd>{new Date(operation.delivery.deliveredAt).toLocaleString('en-ZA')}</dd></div>}</dl></section>
      <section className="customer-panel"><p className="customer-eyebrow">PAYMENT</p><h2>Payment Summary</h2><dl><div><dt>Status</dt><dd>{operation.paymentStatus}</dd></div><div><dt>Total</dt><dd>R {operation.amount.toFixed(2)}</dd></div></dl></section>
    </div>
  </main>;
}
