import { Link } from "@tanstack/react-router";
import type { WorldDirectoryEntry } from "@/types/world_directory";
import { worldAccentVars, worldAtmosphereAttrs } from "@/lib/world-theme";
import type { CSSProperties } from "react";

/**
 * A world card. Every visible string comes from the payload, except the
 * structural action labels and the existing "Nobody to be here yet" chip.
 * `id` builds the link target and is never rendered.
 */
export function WorldCard({ world }: { world: WorldDirectoryEntry }) {
  const style = worldAccentVars(world.theme) as CSSProperties;
  const atmosphere = worldAtmosphereAttrs(world.theme);
  const enterable = world.playable;

  return (
    <article
      {...atmosphere}
      style={style}
      className="dc-world-card dc-glass group relative flex min-h-[19rem] flex-col overflow-hidden rounded-dc-lg p-7 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-1 hover:shadow-dc-3"
    >
      {/* accent edge light + wash — derived from theme.accent, never hand-picked */}
      <span aria-hidden className="dc-world-edge pointer-events-none absolute inset-y-0 left-0 w-px" />
      <span aria-hidden className="dc-world-wash pointer-events-none absolute inset-0" />
      <span aria-hidden className="dc-world-motif pointer-events-none absolute right-0 top-0 h-28 w-28" />

      <div className="relative flex-1">
        <h2 className="font-display text-[1.65rem] leading-tight tracking-wide text-dc-text [overflow-wrap:anywhere]">
          {world.display_name}
        </h2>

        {!enterable && (
          <p className="dc-label mt-4 inline-flex items-center rounded-dc-sm border border-dc-border px-3 py-1.5 text-dc-text-muted">
            Nobody to be here yet
          </p>
        )}
      </div>

      <hr aria-hidden className="dc-divider relative my-6" />

      <div className="relative flex flex-wrap items-center gap-3">
        {enterable ? (
          <Link
            to="/w/$worldId/play"
            params={{ worldId: world.id }}
            className="dc-focus dc-enter rounded-dc-sm px-5 py-2.5 font-ui text-sm font-medium tracking-wide transition-transform duration-150 hover:-translate-y-px"
          >
            Enter
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="cursor-not-allowed rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm font-medium tracking-wide text-dc-text-muted opacity-70"
          >
            Enter
          </span>
        )}

        <Link
          to="/w/$worldId"
          params={{ worldId: world.id }}
          className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm tracking-wide text-dc-text-muted transition-colors duration-150 hover:border-dc-accent hover:text-dc-text"
        >
          Browse
        </Link>
      </div>
    </article>
  );
}
