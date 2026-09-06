import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { packageHintQuery, readPackageHint } from '@secret-service/config';
import { useCustomerAuth } from './customerAuthContext';

export function CustomerAuthGuard() {
  const location = useLocation();
  const { user, loading, error } = useCustomerAuth();
  if (loading) return <main className="customer-auth-state" aria-live="polite"><p>Preparing your secure portal…</p></main>;
  if (error) return <main className="customer-auth-state"><h1>Authentication unavailable</h1><p role="alert">{error}</p></main>;
  const hint = location.pathname === '/operations/new' ? packageHintQuery(readPackageHint(location.search)) : '';
  if (!user) return <Navigate to={`/login${hint}`} replace state={{ from: `${location.pathname}${hint}` }} />;
  return <Outlet />;
}
