import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthFormField } from '../components/auth/AuthFormField';
import { AuthLayout } from '../components/auth/AuthLayout';

export function LoginPage() {
  const [notice, setNotice] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('Authentication is not active yet. No credentials were sent or stored.');
  };

  return <AuthLayout classification="SECURE ACCESS" title="Access Your File" subtitle="Authenticate to access your operations.">
    <form className="auth-form" onSubmit={handleSubmit}>
      <AuthFormField id="login-email" label="Email" name="email" type="email" autoComplete="email" placeholder="agent@secure-channel.co.za" required />
      <AuthFormField id="login-password" label="Password" name="password" type="password" autoComplete="current-password" placeholder="Enter secure passphrase" required />
      <div className="auth-form-meta">
        <span>IDENTITY CHECK REQUIRED</span>
        <button type="button" className="auth-text-action" onClick={() => setNotice('Password recovery will be connected when customer authentication is implemented.')}>Forgot password?</button>
      </div>
      <button type="submit" className="btn btn-glowing auth-submit">[ Log In ]</button>
      {notice && <p className="auth-notice" role="status">{notice}</p>}
    </form>
    <p className="auth-switch">No active file? <Link to="/signup">Create your file</Link></p>
  </AuthLayout>;
}
