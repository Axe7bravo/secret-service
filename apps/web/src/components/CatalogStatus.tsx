export function CatalogStatus({ loading, error, empty, refresh, developmentMode }: {
  loading: boolean; error: string | null; empty: boolean; refresh: () => void; developmentMode?: 'mock' | 'firebase';
}) {
  return <div className="catalog-status" aria-live="polite" aria-busy={loading}>
    {import.meta.env.DEV && developmentMode && <small>DEV CATALOGUE: {developmentMode.toUpperCase()} — {loading ? 'LOADING' : error ? 'FAILED' : empty ? 'ZERO PACKAGES' : 'LOADED'}</small>}
    {loading ? <p>Loading the operational portfolio…</p>
      : <><p>{error ?? (empty ? 'No packages are currently available. Please check back soon.' : 'Current package catalogue')}</p>
        <button type="button" className="btn btn-secondary" onClick={refresh}>{error ? '[ Retry Catalogue ]' : '[ Refresh Catalogue ]'}</button></>}
  </div>;
}
