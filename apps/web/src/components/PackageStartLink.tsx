import { Link } from 'react-router-dom';
import { packageHintQuery } from '@secret-service/config';
import { customerPortalLink } from '../services/customerPortal';

export function PackageStartLink({ packageId, className = 'btn btn-secondary' }: { packageId: string; className?: string }) {
  const destination = customerPortalLink('login', packageId);
  return destination.href
    ? <a className={className} href={destination.href} rel="noreferrer">[ Get Started ]</a>
    : <Link className={className} to={`/login${packageHintQuery(packageId)}`}>[ Get Started ]</Link>;
}
