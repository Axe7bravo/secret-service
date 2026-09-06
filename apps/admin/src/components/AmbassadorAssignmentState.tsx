export function AmbassadorAssignmentState({ loading, error, total, eligible }: {
  loading: boolean; error: string; total: number; eligible: number;
}) {
  if (error) return <p role="alert" className="workflow-dialog__error">Ambassador roster could not be loaded. {error} Reload this page to retry.</p>;
  if (loading) return <p role="status" className="workflow-empty-state">Loading ambassador roster…</p>;
  if (total === 0) return <p role="status" className="workflow-empty-state">No ambassadors exist in this roster. Create an ambassador in the Ambassadors module.</p>;
  if (eligible === 0) return <p role="status" className="workflow-empty-state">Ambassadors exist, but none are eligible for this operation. Check active status, availability, and service campus in the Ambassadors module.</p>;
  return null;
}
