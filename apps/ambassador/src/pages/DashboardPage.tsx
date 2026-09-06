import { Link } from 'react-router-dom';
import { useAmbassadorAuth } from '../auth/authContext';
import { useAssignments } from '../hooks/useAssignments';
import { DeliveryCard } from '../components/DeliveryCard';
import { LoadState } from '../components/LoadState';

export function DashboardPage() {
  const { user } = useAmbassadorAuth();
  const { items, loading, error, retry } = useAssignments(undefined, 200);
  const active = items.filter(item => item.status === 'OUT_FOR_DELIVERY' || item.status === 'AMBASSADOR_ASSIGNED');
  const current = [...active].sort((a, b) => Number(b.status === 'OUT_FOR_DELIVERY') - Number(a.status === 'OUT_FOR_DELIVERY') || a.requestedDate.localeCompare(b.requestedDate));
  return <main id="main" className="portal-main"><header className="page-header"><span className="eyebrow">YOUR FIELD BRIEFING</span><h1>{user?.displayName ? `Welcome, ${user.displayName}` : 'Your Delivery Briefing'}</h1><p>Assigned work, clear next steps. Handle each delivery with discretion.</p></header>{loading || error ? <LoadState loading={loading} error={error} retry={retry} /> : <><section className="metrics" aria-label="Latest assignment counts">{[['Assigned', items.filter(item => item.status === 'AMBASSADOR_ASSIGNED').length], ['Out for Delivery', items.filter(item => item.status === 'OUT_FOR_DELIVERY').length], ['Delivered / Completed', items.filter(item => item.status === 'DELIVERED' || item.status === 'COMPLETED').length], ['Delivery Issues', items.filter(item => item.status === 'DELIVERY_FAILED').length]].map(([label, count]) => <article key={label}><span>{label}</span><strong>{count}</strong></article>)}</section><p className="muted">Counts cover your latest {items.length} assignments (up to 200), not lifetime totals.</p><section><div className="section-heading"><h2>Current / Upcoming Deliveries</h2><Link to="/operations">All deliveries →</Link></div>{current.length ? <div className="card-grid">{current.slice(0, 6).map(item => <DeliveryCard key={item.operationId} operation={item} />)}</div> : <div className="panel"><h2>No active assignments</h2><p>New Admin assignments appear here automatically. If you are expecting work, ask Admin to check the assignment and your account link.</p></div>}</section><section><div className="section-heading"><h2>Recently Updated</h2></div><div className="card-grid">{items.slice(0, 3).map(item => <DeliveryCard key={item.operationId} operation={item} />)}</div>{!items.length && <p className="muted">No assignment history is available yet.</p>}</section></>}</main>;
}
