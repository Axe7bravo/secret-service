import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { adminAuthService } from '../auth/adminAuthService';
import { MOCK_ADMIN_CREDENTIALS } from '../auth/mockAdminAuth';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (adminAuthService.isAuthenticated()) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (adminAuthService.login(email, password)) {
      navigate('/dashboard', { replace: true });
      return;
    }
    setError('Access denied. Check your credentials.');
  };

  return <main className="admin-login-page">
    <section className="admin-login-shell" aria-labelledby="admin-login-heading">
      <div className="admin-login-identity">
        <span className="admin-brand-mark admin-login-mark">S</span>
        <div><strong>SECRET SERVICE</strong><span>ADMIN OPERATIONS</span></div>
      </div>
      <div className="admin-login-status"><span>SECURE TERMINAL</span><span>ADMIN ACCESS ONLY</span></div>
      <h1 id="admin-login-heading">Authorized Access</h1>
      <p className="admin-login-copy">Authenticate to enter Operations Control.</p>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <div><label htmlFor="admin-email">Email</label><input id="admin-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required autoFocus /></div>
        <div><label htmlFor="admin-password">Password</label><input id="admin-password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button type="submit">Enter Operations Control</button>
      </form>
      <aside className="development-access" aria-label="Mock development credentials">
        <span>DEVELOPMENT ACCESS · MOCK ONLY</span>
        <dl><div><dt>Email</dt><dd>{MOCK_ADMIN_CREDENTIALS.email}</dd></div><div><dt>Password</dt><dd>{MOCK_ADMIN_CREDENTIALS.password}</dd></div></dl>
        <p>Temporary frontend credentials. This is not secure authentication.</p>
      </aside>
    </section>
  </main>;
}
