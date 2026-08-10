import type { ReactNode } from "react";

/**
 * A glass panel with gold corner brackets — the house frame from the
 * reference. Purely presentational.
 */
export function OrnateFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`dc-glass dc-frame relative rounded-dc-lg ${className}`}>
      <span aria-hidden className="dc-corner dc-corner-tl" />
      <span aria-hidden className="dc-corner dc-corner-tr" />
      <span aria-hidden className="dc-corner dc-corner-bl" />
      <span aria-hidden className="dc-corner dc-corner-br" />
      {children}
    </section>
  );
}
