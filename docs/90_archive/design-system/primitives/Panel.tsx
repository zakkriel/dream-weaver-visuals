import type { ElementType, ReactNode } from "react";

export function Panel({
  title,
  raised = false,
  as: As = "section",
  className = "",
  children,
  ...rest
}: {
  title?: ReactNode;
  raised?: boolean;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const cls = ["dc-panel", raised && "dc-panel--raised", className].filter(Boolean).join(" ");
  return (
    <As className={cls} {...rest}>
      {title != null && <div className="dc-panel__title">{title}</div>}
      {children}
    </As>
  );
}

/** Card is a Panel — same surface, named for content blocks. */
export const Card = Panel;
