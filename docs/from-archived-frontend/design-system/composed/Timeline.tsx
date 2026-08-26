import { Text } from "../primitives/Text";
import { SourceLine, type Decay } from "../catalog/epistemic";
import { EmptyState } from "./EmptyState";

export type TimelineRecord = {
  perception_id: string;
  content: string;
  epistemic_type: string;
  display_label: string | null;
  decay?: Decay;
};

/**
 * Renders records in received order — the API already orders by tick; no client sort (Chunk-4).
 *
 * No records is a real answer, not a blank: a stretch with nothing in it reads as unknown rather than
 * as an empty stretch of world (Timeline AC#5 — "no records yet" periods render as unknown, never as
 * fabricated absence).
 */
export function Timeline({
  records,
  emptyMessage,
}: {
  records: TimelineRecord[];
  emptyMessage: string;
}) {
  if (records.length === 0) return <EmptyState>{emptyMessage}</EmptyState>;
  return (
    <ul className="dc-timeline">
      {records.map((r) => (
        <li key={r.perception_id} className="dc-timeline__rec">
          <Text>{r.content}</Text>
          <SourceLine kind={r.epistemic_type} time={r.display_label} decay={r.decay} />
        </li>
      ))}
    </ul>
  );
}
