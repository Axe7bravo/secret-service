export function CatalogStatus({ loading, error, empty, refresh }: {
  loading: boolean; error: string | null; empty: boolean; refresh: () => void;
}) {
  if (!loading && !error && !empty) return null;

  return <div className="catalog-status" aria-live="polite" aria-busy={loading}>
    {loading ? <p>Loading the operational portfolio…</p>
      : <><p>{error ?? 'No packages are currently available. Please check back soon.'}</p>
        <button type="button" className="btn btn-secondary" onClick={refresh}>[ Try Again ]</button></>}
  </div>;
}
