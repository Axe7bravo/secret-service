import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from './adminAuthContext';

export function AdminAuthGuard() {
  const location = useLocation();
  const { user, claims, loading, error, signOut } = useAdminAuth();

  if (loading) return <main className="admin-auth-state" aria-live="polite"><p>Verifying secure access…</p></main>;
  if (error) return <main className="admin-auth-state"><h1>Authentication unavailable</h1><p role="alert">{error}</p></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!claims.admin) return (
    <main className="admin-auth-state">
      <p className="eyebrow">ACCESS DENIED</p>
      <h1>Admin authorization required</h1>
      <p>This Firebase account is authenticated but does not have the trusted admin custom claim.</p>
      <button type="button" onClick={() => void signOut()}>Sign out</button>
    </main>
  );
  return <Outlet />;
}
