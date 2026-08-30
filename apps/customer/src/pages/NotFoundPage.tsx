import {Link} from 'react-router-dom';import {PageHeader} from '../components/PageHeader';
export function NotFoundPage(){return <main className="client-main"><PageHeader eyebrow="FILE NOT LOCATED" title="Not Found" description="The requested private route is not available."/><Link className="client-button-link" to="/dashboard">Return to dashboard</Link></main>}
