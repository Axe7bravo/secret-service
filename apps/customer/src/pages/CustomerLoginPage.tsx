import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { mapFirebaseAuthError } from '../../../../packages/firebase/src';
import { useCustomerAuth } from '../auth/customerAuthContext';

export function CustomerLoginPage() {
  const { user, loading, signIn } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      await signIn(email, password);
      const destination = typeof location.state === 'object' && location.state && 'from' in location.state ? String(location.state.from) : '/dashboard';
      navigate(destination, { replace: true });
    } catch (authError) { setError(mapFirebaseAuthError(authError)); }
    finally { setSubmitting(false); }
  };

  return <main className="customer-login"><section aria-labelledby="customer-login-title">
    <div className="login-brand"><span>S</span><div><strong>SECRET SERVICE</strong><small>PRIVATE CLIENT ACCESS</small></div></div><div className="login-classification"><span>CONFIDENTIAL FILES</span><span>CLIENT ACCESS ONLY</span></div><h1 id="customer-login-title">Access Your Operations</h1><p>Authenticate to review and track your active and completed operations.</p>
    <form className="customer-login-form" onSubmit={submit}>
      <div><label htmlFor="customer-email">Email</label><input id="customer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required autoFocus /></div>
      <div><label htmlFor="customer-password">Password</label><input id="customer-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div>
      {error && <p role="alert" className="login-error">{error}</p>}
      <button type="submit" disabled={submitting || loading}>{submitting ? 'Authenticating…' : 'Access Files'}</button>
    </form>
    <p>New to Secret Service? <Link to="/signup">Create an account</Link></p>
    <aside className="customer-auth-notice"><strong>SECURE CUSTOMER ACCESS</strong><p>Your identity and private portal session are protected by Firebase Authentication.</p></aside>
  </section></main>;
}
