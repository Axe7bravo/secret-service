import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="admin-main admin-empty-state"><p className="eyebrow">404 // RECORD NOT LOCATED</p><h1>File not found</h1><p>The requested admin record does not exist.</p><Link className="admin-button" to="/dashboard">Return to dashboard</Link></main>;
}
