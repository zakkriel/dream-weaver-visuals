import type { ReactNode } from "react";

/**
 * A disclosure: a summary you click to reveal a body. Native `<details>`/`<summary>`, so keyboard and
 * assistive-tech behaviour is the platform's rather than something re-implemented here, wrapped once so
 * the surface and the summary's type scale come from the token contract.
 *
 * `open` is the INITIAL state only — after that the element owns its own openness, which is the point
 * of using the native disclosure. Default closed: the one caller is the behind-the-curtain trace, and a
 * debug panel that unfurls itself over the narration would be the wrong default.
 */
export function Collapsible({
  summary,
  open = false,
  className = "",
  children,
}: {
  summary: ReactNode;
  open?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const cls = ["dc-collapsible", className].filter(Boolean).join(" ");
  return (
    <details className={cls} open={open}>
      <summary className="dc-collapsible__summary">{summary}</summary>
      <div className="dc-collapsible__body">{children}</div>
    </details>
  );
}
