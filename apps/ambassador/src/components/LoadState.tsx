export function LoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  return <section className="panel state-panel" aria-live="polite">{loading ? <p role="status">Loading your assignments…</p> : <><h2>Assignments unavailable</h2><p role="alert">{error}</p><button onClick={retry}>Retry connection</button></>}</section>;
}
