import type { ReactNode } from "react";

export function Badge({
  status = "low",
  className = "",
  children,
  ...rest
}: { status?: "high" | "med" | "low"; className?: string; children?: ReactNode } & Record<string, unknown>) {
  return (
    <span className={`dc-badge dc-badge--${status} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}
