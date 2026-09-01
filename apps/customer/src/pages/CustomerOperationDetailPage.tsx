import { Link, useLocation, useParams } from 'react-router-dom';
import { CustomerStatusBadge } from '../components/CustomerStatusBadge';
import { TrackingTimeline } from '../components/TrackingTimeline';
import { CustomerPageHeader } from '../components/CustomerPageHeader';
import { CustomerSection } from '../components/CustomerSection';
import { CustomerArchiveControl } from '../components/CustomerArchiveControl';
import { useCustomerOperation } from '../hooks/useCustomerOperations';
import { getCustomerStatus,isArchiveEligible } from '../utils/status';
import type { CustomerPaymentStatus } from '../types/customer';

export function CustomerOperationDetailPage() {
  const { operationId } = useParams();
  const location = useLocation();
  const operationCreated = Boolean((location.state as { operationCreated?: boolean } | null)?.operationCreated);
  const { operation, loading, error, refresh } = useCustomerOperation(operationId);
  if (loading) return <main className="client-main customer-empty" aria-live="polite">Retrieving operation file…</main>;
  if (error) return <main className="client-main"><div className="customer-load-error" role="alert"><p>{error}</p><button type="button" onClick={refresh}>Try again</button></div></main>;
  if (!operation) return <main className="client-main"><CustomerPageHeader eyebrow="PRIVATE OPERATION FILE" title="File Not Found" description="This operation is not available in your private files." /><Link className="client-button-link" to="/operations">Return to My Operations</Link></main>;
  const view = getCustomerStatus(operation.status);

  return <main className="client-main operation-detail">
    <Link className="client-back-link" to="/operations">← My Operations</Link>
    {operationCreated && <div className="operation-created-notice" role="status"><strong>Operation submitted for review.</strong><span>Your request is secured. Payment will only be requested after approval.</span></div>}
    <CustomerPageHeader eyebrow="PRIVATE OPERATION FILE" title={operation.operationId} description={`${operation.packageName} · Created ${new Date(operation.createdAt).toLocaleDateString('en-ZA')}`} actions={<CustomerStatusBadge status={operation.status} />} />
    {(operation.archived||isArchiveEligible(operation.status))&&<section className="archive-detail-actions" aria-label="Customer file preference">{operation.archived&&<span className="archive-indicator">Archived</span>}<CustomerArchiveControl operation={operation} /></section>}
    <section className="operation-file-summary"><div><span>Package</span><strong>{operation.packageName}</strong></div><div><span>Recipient</span><strong>{operation.recipient.name}</strong></div><div><span>Amount</span><strong>R {operation.amount.toFixed(2)}</strong></div></section>
    <CustomerSection title={view.label} eyebrow="LIVE PROGRESS"><p className="tracking-description">{view.description}</p><TrackingTimeline status={operation.status}/>{['attention','issue'].includes(view.key) && <div className="attention-note">Our operations team will contact you if further information is required.</div>}</CustomerSection>
    <div className="operation-detail-grid">
      <CustomerSection title="Recipient" eyebrow="DELIVERY DESTINATION"><dl className="client-detail-list"><div><dt>Name</dt><dd>{operation.recipient.name}</dd></div><div><dt>Campus</dt><dd>{operation.recipient.campus}</dd></div><div><dt>Residence / building</dt><dd>{operation.recipient.residence}</dd></div><div><dt>Location</dt><dd>{operation.delivery.location}</dd></div></dl></CustomerSection>
      <CustomerSection title="Package" eyebrow="OPERATION TYPE"><dl className="client-detail-list"><div><dt>Package</dt><dd>{operation.packageName}</dd></div><div><dt>Amount</dt><dd>R {operation.amount.toFixed(2)}</dd></div></dl></CustomerSection>
      <CustomerSection title="Your Message" eyebrow="SEALED CONTENT" className="customer-message"><blockquote>{operation.anonymousMessage}</blockquote><p>This message is held as a read-only part of your operation file.</p></CustomerSection>
      <CustomerSection title="Delivery" eyebrow="CUSTOMER-SAFE TRACKING"><dl className="client-detail-list"><div><dt>Requested date</dt><dd>{operation.delivery.requestedDate}</dd></div><div><dt>Time window</dt><dd>{operation.delivery.requestedWindow}</dd></div>{operation.updatedAt&&<div><dt>Last updated</dt><dd>{new Date(operation.updatedAt).toLocaleString('en-ZA')}</dd></div>}{operation.delivery.deliveredAt&&<div><dt>Delivered</dt><dd>{new Date(operation.delivery.deliveredAt).toLocaleString('en-ZA')}</dd></div>}</dl></CustomerSection>
      <CustomerSection title="Payment" eyebrow="TRANSACTION"><dl className="client-detail-list"><div><dt>Status</dt><dd>{paymentLabel(operation.paymentStatus)}</dd></div><div><dt>Total</dt><dd>R {operation.amount.toFixed(2)}</dd></div></dl></CustomerSection>
    </div>
  </main>;
}

function paymentLabel(status:CustomerPaymentStatus) {
  if(status==='NOT_REQUIRED_YET') return 'Not required until approval';
  if(status==='PENDING') return 'Payment required';
  if(status==='PAID') return 'Paid';
  return 'Refunded';
}
