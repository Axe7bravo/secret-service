import type { OperationActivity } from '../types/operations';
import { OperationStatusBadge } from './OperationStatusBadge';

const date = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });

export function ActivityTimeline({ activity }: { activity: readonly OperationActivity[] }) {
  return <ol className="activity-timeline">{[...activity].reverse().map((item) => <li key={item.id}><span className="activity-timeline__marker" aria-hidden="true" /><div className="activity-timeline__entry"><div className="activity-timeline__status"><OperationStatusBadge status={item.toStatus} /><time dateTime={item.timestamp}>{date.format(new Date(item.timestamp))}</time></div><p>{item.fromStatus ? `${item.actor} moved this operation from ${item.fromStatus.replaceAll('_', ' ').toLowerCase()}.` : `${item.actor} created this entry.`}</p>{item.note && <blockquote>{item.note}</blockquote>}</div></li>)}</ol>;
}
