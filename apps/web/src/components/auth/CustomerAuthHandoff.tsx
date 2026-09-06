import { Link, useLocation } from 'react-router-dom';
import { packageHintQuery, readPackageHint } from '@secret-service/config';
import { customerPortalLink, type CustomerAuthRoute } from '../../services/customerPortal';
import { AuthLayout } from './AuthLayout';

export function CustomerAuthHandoff({ route }: { route: CustomerAuthRoute }) {
  const signup = route === 'signup';
  const location = useLocation();
  const packageId = readPackageHint(location.search);
  const query = packageHintQuery(packageId);
  const destination = customerPortalLink(route, packageId);
  return <AuthLayout classification={signup ? 'NEW CLIENT FILE' : 'SECURE ACCESS'}
    title={signup ? 'Create Your File' : 'Access Your File'}
    subtitle={signup ? 'Establish your identity in the secure Customer Portal.' : 'Continue to your private Customer Portal to access your operations.'}>
    <div className="auth-form">
      <p>{signup
        ? 'Create your real Secret Service customer account in the Customer Portal. Your account and operations stay together in one secure place.'
        : 'Sign in with your existing Secret Service customer account, or choose Sign Up below. The portal will reuse an existing signed-in session.'}</p>
      {packageId && <p>Your package selection will be checked against the current catalogue before starting a new operation.</p>}
      <div className="auth-form-meta"><span>FIREBASE-PROTECTED CUSTOMER ACCESS</span></div>
      {destination.href
        ? <a className="btn btn-glowing auth-submit" href={destination.href} rel="noreferrer">{signup ? '[ Continue To Sign Up ]' : '[ Continue To Log In ]'}</a>
        : <p className="auth-notice" role="alert">{destination.error}</p>}
      <p className="auth-notice">The Customer Portal opens in this tab. Enter your credentials only there. If it cannot be reached, return here using Back and retry shortly. No credentials are collected on this page.</p>
    </div>
    <p className="auth-switch">{signup ? <>Already have a file? <Link to={`/login${query}`}>Log in</Link></> : <>No active file? <Link to={`/signup${query}`}>Sign Up</Link></>}</p>
  </AuthLayout>;
}
