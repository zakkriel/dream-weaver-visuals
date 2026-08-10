import type { ReactNode } from "react";

export function DashboardPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`dashboard-panel ${className}`}>{children}</section>;
}