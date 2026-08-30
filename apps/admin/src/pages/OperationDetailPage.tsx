import { Link, useParams } from 'react-router-dom';
import { OperationStatusBadge } from '../components/OperationStatusBadge';
import { PageHeader } from '../components/PageHeader';
import { SectionCard } from '../components/SectionCard';
import { operationsRepository } from '../data/operationsRepository';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

export function OperationDetailPage() {
  const { operationId = '' } = useParams();
  const operation = operationsRepository.getById(operationId);
  if (!operation) return <main className="admin-main"><PageHeader eyebrow="OPERATION FILE" title="File Not Found" description={`No mock operation matches ${operationId}.`} /><Link className="admin-button" to="/operations">Return to operations</Link></main>;

  return <main className="admin-main operation-file">
    <Link className="back-link" to="/operations">← Operations ledger</Link>
    <PageHeader eyebrow="OPERATION FILE" title={operation.operationId} description={`${operation.packageType} · Created ${formatDateTime(operation.createdAt)}`} actions={<OperationStatusBadge status={operation.operationStatus} />} />
    <section className="operation-command"><div><span>PACKAGE</span><strong>{operation.packageType}</strong></div><div><span>AMOUNT</span><strong>{formatCurrency(operation.amount)}</strong></div><div><span>REQUESTED DELIVERY</span><strong>{formatDate(operation.requestedDeliveryDate)}</strong></div><div className="prototype-actions" aria-label="Prototype operation actions"><button disabled title="Workflow actions are not implemented">Approve</button><button disabled title="Workflow actions are not implemented">Reject</button><button disabled title="Workflow actions are not implemented">Start preparation</button><button disabled title="Workflow actions are not implemented">Assign ambassador</button></div></section>
    <div className="file-grid">
      <SectionCard title="Customer / Sender" eyebrow="ORIGIN"><dl className="detail-list"><Detail label="Name" value={operation.customerName} /><Detail label="Email" value={operation.customerEmail} /><Detail label="Phone" value={operation.customerPhone} /></dl></SectionCard>
      <SectionCard title="Recipient" eyebrow="TARGET"><dl className="detail-list"><Detail label="Name" value={operation.recipientName} /><Detail label="Phone" value={operation.recipientPhone} /><Detail label="Campus" value={operation.campus} /><Detail label="Residence / building" value={operation.residence} /><Detail label="Delivery location" value={operation.deliveryLocation} /><Detail label="Delivery notes" value={operation.deliveryNotes} /></dl></SectionCard>
      <SectionCard title="Package" eyebrow="PAYLOAD"><dl className="detail-list"><Detail label="Package type" value={operation.packageType} /><Detail label="Price" value={formatCurrency(operation.amount)} /><Detail label="Requested date" value={formatDate(operation.requestedDeliveryDate)} /><Detail label="Time window" value={operation.requestedDeliveryWindow} /></dl></SectionCard>
      <SectionCard title="Classified Message" eyebrow="MODERATION CONTENT" className="classified-message"><blockquote>{operation.anonymousMessage}</blockquote><p>Sender identity must remain separated from field delivery communications.</p></SectionCard>
      <SectionCard title="Moderation" eyebrow="CONTENT REVIEW"><dl className="detail-list"><Detail label="Moderation status" value={operation.moderationStatus} /></dl><div className="inline-prototype-actions"><button disabled>Approve message</button><button disabled>Reject message</button><span>Prototype controls</span></div></SectionCard>
      <SectionCard title="Delivery" eyebrow="FIELD EXECUTION"><dl className="detail-list"><Detail label="Operation status" value={operation.operationStatus.replaceAll('_', ' ')} /><Detail label="Assigned ambassador" value={operation.ambassador ?? 'UNASSIGNED'} emphasis={!operation.ambassador} /><Detail label="Delivery date" value={formatDate(operation.requestedDeliveryDate)} /><Detail label="Delivery window" value={operation.requestedDeliveryWindow} /><Detail label="Field notes" value={operation.deliveryNotes} /></dl></SectionCard>
      <SectionCard title="Payment" eyebrow="TRANSACTION"><dl className="detail-list"><Detail label="Payment status" value={operation.paymentStatus} /><Detail label="Amount" value={formatCurrency(operation.amount)} /><Detail label="Reference" value={operation.paymentReference} /><Detail label="Payment date" value={operation.paymentDate ? formatDateTime(operation.paymentDate) : 'NOT RECEIVED'} /></dl></SectionCard>
    </div>
  </main>;
}

function Detail({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div><dt>{label}</dt><dd className={emphasis ? 'detail-emphasis' : undefined}>{value}</dd></div>;
}
