import { Link } from 'react-router-dom';
import { CustomerOperationCard } from '../components/CustomerOperationCard';
import { CustomerPageHeader } from '../components/CustomerPageHeader';
import { useCustomerAuth } from '../auth/customerAuthContext';
import { useCustomerOperations } from '../hooks/useCustomerOperations';
import { isClosedStatus,isCompletedStatus } from '../utils/status';

export function CustomerDashboardPage() {
  const { operations, loading, error } = useCustomerOperations();
  const { user } = useCustomerAuth();
  const active = operations.filter(item => !item.archived&&!isClosedStatus(item.status));
  const completed = operations.filter(item => isCompletedStatus(item.status));
  const recentCompleted = completed.filter(item=>!item.archived);
  const firstName = user?.displayName?.trim().split(/\s+/)[0];

  return <main className="client-main">
    <CustomerPageHeader eyebrow="PRIVATE CLIENT OVERVIEW" title={firstName ? `Welcome back, ${firstName}` : 'Your Operations'} description="Your active and completed Secret Service operations, held in confidence." actions={<Link className="customer-primary" to="/operations/new">Start a New Operation</Link>} />
    {error && <p className="customer-auth-error" role="alert">{error}</p>}
    <section className="client-metrics" aria-busy={loading}>
      <article><span>Active</span><strong>{loading ? '—' : String(active.length).padStart(2, '0')}</strong></article>
      <article><span>Completed</span><strong>{loading ? '—' : String(completed.length).padStart(2, '0')}</strong></article>
      <article><span>Total Operations</span><strong>{loading ? '—' : String(operations.length).padStart(2, '0')}</strong></article>
    </section>
    <section className="dashboard-operation-section"><header><div><span>IN MOTION</span><h2>Active Operations</h2></div><Link to="/operations">View all</Link></header>
      {loading ? <p className="customer-empty" aria-live="polite">Retrieving secure operation files…</p> : active.length ? <div className="client-card-grid">{active.slice(0, 3).map(item => <CustomerOperationCard key={item.operationId} operation={item}/>)}</div> : <div className="customer-empty"><p>No active operations.</p><Link to="/operations/new">Initiate an operation</Link></div>}
    </section>
    {!!recentCompleted.length && <section className="dashboard-operation-section recent-section"><header><div><span>HISTORY</span><h2>Recent Operations</h2></div><Link to="/operations">View history</Link></header><div className="client-card-grid">{recentCompleted.slice(0, 3).map(item => <CustomerOperationCard key={item.operationId} operation={item}/>)}</div>
    </section>
    }
  </main>;
}
