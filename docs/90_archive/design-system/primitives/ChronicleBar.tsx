import type { ReactNode } from "react";
import { DayTimeChip } from "./DayTimeChip";

export function ChronicleBar({
  breadcrumb,
  dayTime,
  actions,
}: { breadcrumb?: ReactNode; dayTime?: string; actions?: ReactNode }) {
  return (
    <header className="dc-chrome">
      {breadcrumb != null && <div className="dc-chrome__crumb">{breadcrumb}</div>}
      {dayTime != null && <DayTimeChip label={dayTime} />}
      <div className="dc-chrome__spacer" />
      {actions != null && <div className="dc-chrome__actions">{actions}</div>}
    </header>
  );
}
