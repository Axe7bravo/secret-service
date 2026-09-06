import { packageHintQuery, readPackageHint } from '@secret-service/config';

export function customerAuthDestination(search: string, state: unknown): string {
  const packageId = readPackageHint(search);
  if (packageId) return `/operations/new${packageHintQuery(packageId)}`;
  const from = typeof state === 'object' && state !== null && 'from' in state ? state.from : null;
  if (typeof from !== 'string') return '/dashboard';
  const [path = ''] = from.split('?');
  // Retain existing Customer destinations only; never allow an external URL or auth loop.
  if (!/^\/(?:dashboard|account|operations(?:\/[A-Za-z0-9_-]+(?:\/payment\/(?:success|cancelled|failed))?)?)\/?$/.test(path)) return '/dashboard';
  return path === '/operations/new' ? `${path}${packageHintQuery(readPackageHint(from.slice(path.length)))}` : path;
}
