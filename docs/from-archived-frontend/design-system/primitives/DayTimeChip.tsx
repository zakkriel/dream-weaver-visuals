import { Chip } from "./Chip";
import { Icon } from "./Icon";

/** B-5: renders the provided display label only — never computes time. */
export function DayTimeChip({ label }: { label: string }) {
  return <Chip icon={<Icon name="timeline" size={14} />}>{label}</Chip>;
}
