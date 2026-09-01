import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { mapFirebaseAuthError } from '../../../../packages/firebase/src';
import { useCustomerAuth } from '../auth/customerAuthContext';

export function CustomerSignupPage() {
  const { user, loading, signUp } = useCustomerAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      await signUp({ email, password, displayName: `${firstName} ${lastName}`.trim() });
      navigate('/dashboard', { replace: true });
    } catch (authError) { setError(mapFirebaseAuthError(authError)); }
    finally { setSubmitting(false); }
  };

  return <main className="customer-login"><section aria-labelledby="customer-signup-title">
    <div className="login-brand"><span>S</span><div><strong>SECRET SERVICE</strong><small>PRIVATE CLIENT ACCESS</small></div></div><div className="login-classification"><span>CLIENT ENROLMENT</span><span>SECURE ACCESS</span></div><h1 id="customer-signup-title">Create Your Account</h1><p>Establish your private identity to initiate and track operations.</p>
    <form className="customer-login-form" onSubmit={submit}>
      <div><label htmlFor="first-name">First name</label><input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required /></div>
      <div><label htmlFor="last-name">Last name</label><input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required /></div>
      <div><label htmlFor="signup-email">Email</label><input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
      <div><label htmlFor="signup-password">Password</label><input id="signup-password" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
      {error && <p role="alert" className="login-error">{error}</p>}
      <button type="submit" disabled={submitting || loading}>{submitting ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p>Already registered? <Link to="/login">Log in</Link></p>
  </section></main>;
}
