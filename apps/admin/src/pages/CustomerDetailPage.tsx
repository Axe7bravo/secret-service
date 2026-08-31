import { Link, useParams } from 'react-router-dom';
import { DirectoryOperationList } from '../components/DirectoryOperationList';
import { useAdminDirectory } from '../hooks/useAdminDirectory';

const date = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
const value = (input: string | undefined) => input ?? '—';

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const { data, loading, error } = useAdminDirectory();
  const customer = data.customers.find(item => item.customerId === customerId);
  if (loading) return <main className="admin-main"><div className="repository-state panel-state" aria-live="polite">Loading customer file…</div></main>;
  if (error) return <main className="admin-main"><div className="admin-notice is-error" role="alert">{error}</div><Link className="back-link" to="/customers">← Return to customers</Link></main>;
  if (!customer) return <main className="admin-main"><p className="eyebrow">CUSTOMER FILE</p><h1>Customer not found</h1><Link className="back-link" to="/customers">← Return to customers</Link></main>;
  return <main className="admin-main directory-detail-page">
    <Link className="back-link" to="/customers">← Back to customers</Link>
    <header className="operation-detail-header"><div><p className="eyebrow">CUSTOMER FILE</p><h1>{customer.displayName ?? customer.email ?? 'Customer account'}</h1><p>{customer.customerId}</p></div><span className={`status-badge ${customer.accountState === 'ACTIVE' ? 'status-success' : customer.accountState === 'DISABLED' ? 'status-danger' : 'status-neutral'}`}>{customer.accountState}</span></header>
    <section className="metric-grid directory-metrics" aria-label="Customer operation summary"><article className="metric-block"><span>Total Operations</span><strong>{customer.operationCount}</strong><small>ACCOUNT HISTORY</small></article><article className="metric-block"><span>Active</span><strong>{customer.activeOperationCount}</strong><small>IN PROGRESS</small></article><article className="metric-block"><span>Completed</span><strong>{customer.completedOperationCount}</strong><small>TERMINAL</small></article></section>
    <section className="operation-section"><p className="eyebrow">ACCOUNT PROFILE</p><h2>Customer Details</h2><dl className="operation-fields"><div className="operation-field"><dt>Customer reference</dt><dd>{customer.customerId}</dd></div><div className="operation-field"><dt>Display name</dt><dd>{value(customer.displayName)}</dd></div><div className="operation-field"><dt>Email</dt><dd>{value(customer.email)}</dd></div><div className="operation-field"><dt>Date joined</dt><dd>{customer.joinedAt ? date.format(new Date(customer.joinedAt)) : '—'}</dd></div><div className="operation-field"><dt>Last sign-in</dt><dd>{customer.lastSignInAt ? date.format(new Date(customer.lastSignInAt)) : '—'}</dd></div></dl></section>
    <section className="operation-section directory-related"><p className="eyebrow">RELATED OPERATIONS</p><h2>Operation History</h2><DirectoryOperationList operations={customer.operations} /></section>
  </main>;
}
