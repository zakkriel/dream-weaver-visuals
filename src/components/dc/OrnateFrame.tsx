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
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] top-2 left-2 border-t border-l rounded-tl-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] top-2 right-2 border-t border-r rounded-tr-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] bottom-2 left-2 border-b border-l rounded-bl-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] bottom-2 right-2 border-b border-r rounded-br-[6px]" />
      {children}
    </section>
  );
}
