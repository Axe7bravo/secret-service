import { Link } from 'react-router-dom';
import { CustomerOperationCard } from '../components/CustomerOperationCard';
import { useCustomerOperations } from '../hooks/useCustomerOperations';
import { isCompletedStatus } from '../utils/status';

export function CustomerDashboardPage() {
  const { operations, loading, error } = useCustomerOperations();
  const active = operations.filter(item => !isCompletedStatus(item.status));
  const completed = operations.filter(item => isCompletedStatus(item.status));

  return <main className="customer-page">
    <header className="customer-page-header">
      <div><p className="customer-eyebrow">PRIVATE OVERVIEW</p><h1>Your Operations</h1><p>Track every discreet detail from confirmation to completion.</p></div>
      <div className="customer-header-actions"><Link to="/operations/new">New Operation</Link><Link className="customer-primary" to="/operations">View all operations</Link></div>
    </header>
    {error && <p className="customer-auth-error" role="alert">{error}</p>}
    <section className="customer-metrics" aria-busy={loading}>
      <article><span>Active operations</span><strong>{loading ? '—' : active.length}</strong></article>
      <article><span>Completed operations</span><strong>{loading ? '—' : completed.length}</strong></article>
      <article><span>Total operations</span><strong>{loading ? '—' : operations.length}</strong></article>
    </section>
    <section><div className="customer-section-heading"><div><p className="customer-eyebrow">CURRENT FILES</p><h2>Recent Operations</h2></div><Link to="/operations">My Operations →</Link></div>
      {loading ? <p className="customer-empty" aria-live="polite">Retrieving secure operation files…</p> : <div className="operation-card-grid">{operations.slice(0, 3).map(item => <CustomerOperationCard key={item.operationId} operation={item}/>)}</div>}
    </section>
  </main>;
}
