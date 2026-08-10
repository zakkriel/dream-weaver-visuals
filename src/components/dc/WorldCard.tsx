import { Link } from "@tanstack/react-router";
import type { WorldDirectoryEntry } from "@/types/world_directory";
import { worldAccentVars, worldAtmosphereAttrs } from "@/lib/world-theme";
import type { CSSProperties } from "react";

/**
 * A world card. Every visible string comes from the payload, except the
 * structural action labels and the existing "Nobody to be here yet" chip.
 * `id` builds the link target and is never rendered.
 *
 * The cover plate is derived atmosphere (accent + mood + ornament), not art:
 * the directory payload carries no image. NEEDS BACKEND FIELD: world.cover.path
 */
export function WorldCard({ world }: { world: WorldDirectoryEntry }) {
  const style = worldAccentVars(world.theme) as CSSProperties;
  const atmosphere = worldAtmosphereAttrs(world.theme);
  const enterable = world.playable;

  return (
    <article
      {...atmosphere}
      style={style}
      className="dc-world-card dc-glass dc-frame group relative flex flex-col overflow-hidden rounded-dc-lg transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-1 hover:shadow-dc-3"
    >
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] top-2 left-2 border-t border-l rounded-tl-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] top-2 right-2 border-t border-r rounded-tr-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] bottom-2 left-2 border-b border-l rounded-bl-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] bottom-2 right-2 border-b border-r rounded-br-[6px]" />

      {/* cover plate: derived weather, never invented art */}
      <div className="relative h-40 overflow-hidden border-b border-dc-border">
        <span aria-hidden className="dc-world-wash absolute inset-0" />
        <span aria-hidden className="dc-world-motif absolute inset-0" />
        <span
          aria-hidden
          className="dc-world-edge absolute inset-x-0 bottom-0 h-px w-full [background-image:linear-gradient(90deg,transparent,rgb(var(--dc-world-rgb)/0.85),transparent)]"
        />
      </div>

      <div className="relative flex flex-1 flex-col p-6">
        <h3 className="font-display text-[1.4rem] leading-tight tracking-wide text-dc-text [overflow-wrap:anywhere]">
          {world.display_name}
        </h3>

        {!enterable && (
          <p className="dc-label mt-4 inline-flex w-fit items-center rounded-dc-sm border border-dc-border px-3 py-1.5 text-dc-text-muted">
            Nobody to be here yet
          </p>
        )}

        <hr aria-hidden className="dc-divider mt-6 mb-5" />

        <div className="mt-auto flex flex-wrap items-center gap-3">
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
      </div>
    </article>
  );
}
