import { packageHintQuery } from '@secret-service/config';
export type CustomerAuthRoute = 'login' | 'signup';
type PortalLink = { href: string; error: null } | { href: null; error: string };
const loopback = (hostname: string) => ['localhost', '127.0.0.1', '[::1]'].includes(hostname);

// Trusted build configuration only: no user-supplied destination or token handoff.
export function customerPortalLink(route: CustomerAuthRoute, packageId?: string | null): PortalLink {
  try {
    const configured = import.meta.env.VITE_CUSTOMER_APP_URL?.trim();
    const base = configured || (import.meta.env.DEV && loopback(window.location.hostname)
      ? `http://${window.location.hostname}:3002` : '');
    if (!base) throw new Error('Missing customer portal origin');
    const url = new URL(base);
    const localDevelopment = import.meta.env.DEV && loopback(url.hostname);
    if ((url.protocol !== 'https:' && !(localDevelopment && url.protocol === 'http:'))
      || (!import.meta.env.DEV && loopback(url.hostname))
      || url.username || url.password || url.search || url.hash || url.pathname !== '/'
      || url.origin === window.location.origin) {
      throw new Error('Invalid customer portal origin');
    }
    return { href: new URL(`/${route}${packageHintQuery(packageId)}`, url.origin).href, error: null };
  } catch {
    return { href: null, error: import.meta.env.DEV
      ? 'Configure VITE_CUSTOMER_APP_URL as the Customer app origin (local example: http://localhost:3002). Use HTTPS outside loopback development and a different origin from the public site.'
      : 'The customer portal connection is temporarily unavailable. Please try again later.' };
  }
}
