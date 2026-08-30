import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthFormField } from '../components/auth/AuthFormField';
import { AuthLayout } from '../components/auth/AuthLayout';

export function SignupPage() {
  const [notice, setNotice] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('Account creation is a visual prototype. No personal data was sent or stored.');
  };

  return <AuthLayout classification="NEW PERSONNEL FILE" title="Create Your File" subtitle="Establish your identity for future confidential operations.">
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-name-grid">
        <AuthFormField id="signup-first-name" label="First name" name="firstName" type="text" autoComplete="given-name" placeholder="First name" required />
        <AuthFormField id="signup-last-name" label="Last name" name="lastName" type="text" autoComplete="family-name" placeholder="Last name" required />
      </div>
      <AuthFormField id="signup-email" label="Email" name="email" type="email" autoComplete="email" placeholder="agent@secure-channel.co.za" required />
      <AuthFormField id="signup-password" label="Password" name="password" type="password" autoComplete="new-password" placeholder="Create secure passphrase" required />
      <AuthFormField id="signup-confirm-password" label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat secure passphrase" required />
      <p className="auth-terms">By creating a file, you acknowledge that the Terms of Service and Privacy Notice will govern your account once authentication becomes operational.</p>
      <button type="submit" className="btn btn-glowing auth-submit">[ Create Account ]</button>
      {notice && <p className="auth-notice" role="status">{notice}</p>}
    </form>
    <p className="auth-switch">Already have a file? <Link to="/login">Return to log in</Link></p>
  </AuthLayout>;
}
