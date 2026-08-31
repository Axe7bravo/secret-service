import { Link, useParams } from 'react-router-dom';
import { DirectoryOperationList } from '../components/DirectoryOperationList';
import { useAdminDirectory } from '../hooks/useAdminDirectory';

export function RecipientDetailPage() {
  const { recipientId } = useParams();
  const { data, loading, error } = useAdminDirectory();
  const recipient = data.recipients.find(item => item.recipientId === recipientId);
  if (loading) return <main className="admin-main"><div className="repository-state panel-state" aria-live="polite">Loading recipient file…</div></main>;
  if (error) return <main className="admin-main"><div className="admin-notice is-error" role="alert">{error}</div><Link className="back-link" to="/recipients">← Return to recipients</Link></main>;
  if (!recipient) return <main className="admin-main"><p className="eyebrow">RECIPIENT FILE</p><h1>Recipient not found</h1><Link className="back-link" to="/recipients">← Return to recipients</Link></main>;
  return <main className="admin-main directory-detail-page">
    <Link className="back-link" to="/recipients">← Back to recipients</Link>
    <header className="operation-detail-header"><div><p className="eyebrow">RECIPIENT FILE</p><h1>{recipient.name}</h1><p>{recipient.recipientId}</p></div><span className="status-badge status-neutral">{recipient.operationCount} {recipient.operationCount === 1 ? 'OPERATION' : 'OPERATIONS'}</span></header>
    <section className="operation-section"><p className="eyebrow">DELIVERY PROFILE</p><h2>Recipient Details</h2><dl className="operation-fields"><div className="operation-field"><dt>Recipient reference</dt><dd>{recipient.recipientId}</dd></div><div className="operation-field"><dt>Name</dt><dd>{recipient.name}</dd></div><div className="operation-field"><dt>Phone</dt><dd>{recipient.phone}</dd></div><div className="operation-field"><dt>Campus</dt><dd>{recipient.campus}</dd></div><div className="operation-field"><dt>Residence</dt><dd>{recipient.residence}</dd></div><div className="operation-field"><dt>Latest delivery location</dt><dd>{recipient.latestLocation}</dd></div></dl></section>
    <section className="operation-section directory-related"><p className="eyebrow">DELIVERY HISTORY</p><h2>Related Operations</h2><DirectoryOperationList operations={recipient.operations} /></section>
  </main>;
}
