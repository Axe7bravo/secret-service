import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function NotFoundPage() {
  return <main className="admin-main"><PageHeader eyebrow="FILE NOT LOCATED" title="Not Found" description="The requested internal route does not exist in this milestone." /><Link className="admin-button" to="/dashboard">Return to dashboard</Link></main>;
}
