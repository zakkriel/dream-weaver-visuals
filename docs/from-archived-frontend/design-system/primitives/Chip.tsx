import type { ReactNode } from "react";

export function Chip({
  icon,
  href,
  className = "",
  children,
  ...rest
}: { icon?: ReactNode; href?: string; className?: string; children?: ReactNode } & Record<string, unknown>) {
  const cls = `dc-chip ${className}`.trim();
  const inner = (
    <>
      {icon != null && <span className="dc-chip__icon">{icon}</span>}
      {children}
    </>
  );
  return href != null
    ? <a className={cls} href={href} {...rest}>{inner}</a>
    : <span className={cls} {...rest}>{inner}</span>;
}
