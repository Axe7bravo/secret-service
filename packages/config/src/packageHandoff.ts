// A non-sensitive selection hint, never an authorization or pricing input.
export const validPackageHint = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);

export function readPackageHint(search: string): string | null {
  const values = new URLSearchParams(search).getAll('package');
  const value = values[0];
  return values.length === 1 && validPackageHint(value) ? value : null;
}

export const packageHintQuery = (value: unknown): string =>
  validPackageHint(value) ? `?package=${encodeURIComponent(value)}` : '';
