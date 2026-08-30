import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { mapFirebaseAuthError } from '../../../../packages/firebase/src';
import { useAdminAuth } from '../auth/adminAuthContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, claims, loading, signIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user && claims.admin) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(email, password);
      const destination = typeof location.state === 'object' && location.state && 'from' in location.state
        ? String(location.state.from)
        : '/dashboard';
      navigate(destination, { replace: true });
    } catch (authError) {
      setError(mapFirebaseAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="admin-login-page">
    <section className="admin-login-shell" aria-labelledby="admin-login-heading">
      <div className="admin-login-identity"><span className="admin-brand-mark admin-login-mark">S</span><div><strong>SECRET SERVICE</strong><span>ADMIN OPERATIONS</span></div></div>
      <div className="admin-login-status"><span>FIREBASE AUTHENTICATION</span><span>ADMIN ACCESS ONLY</span></div>
      <h1 id="admin-login-heading">Authorized Access</h1>
      <p className="admin-login-copy">Sign in with a privately provisioned Firebase account carrying the admin custom claim.</p>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <div><label htmlFor="admin-email">Email</label><input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required autoFocus /></div>
        <div><label htmlFor="admin-password">Password</label><input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button type="submit" disabled={submitting || loading}>{submitting ? 'Verifying…' : 'Enter Operations Control'}</button>
      </form>
      <aside className="development-access"><span>REAL AUTH · MOCK OPERATION DATA</span><p>Authentication uses Firebase. Admin operation data remains local for this milestone.</p></aside>
    </section>
  </main>;
}
