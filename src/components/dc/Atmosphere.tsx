import type { ReactNode } from "react";

/**
 * The house atmosphere: two-layer gradient ground, vignette, film grain.
 * Purely presentational; carries no data.
 */
export function Atmosphere({ children }: { children: ReactNode }) {
  return (
    <div className="dc-atmosphere relative min-h-screen w-full overflow-x-hidden">
      <div aria-hidden className="dc-vignette pointer-events-none fixed inset-0" />
      <div aria-hidden className="dc-grain pointer-events-none fixed inset-0" />
      <div className="relative">{children}</div>
    </div>
  );
}
