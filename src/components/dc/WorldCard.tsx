import { Link } from "@tanstack/react-router";
import type { WorldDirectoryEntry } from "@/types/world_directory";
import { worldAccentVars, worldAtmosphereAttrs } from "@/lib/world-theme";
import { moodPlate } from "@/lib/mood-plate";
import type { CSSProperties } from "react";

/**
 * A world card: a painted plate with the world's name set over it, its accent
 * as edge light, and the two acts you can perform on it.
 *
 * Every visible string comes from the payload except the structural action
 * labels and the existing "Nobody to be here yet" chip. `id` builds the link
 * target and is never rendered. The plate is house atmosphere chosen by
 * `theme.mood`, never art claiming to be this world.
 * NEEDS BACKEND FIELD: world.cover.path
 */
export function WorldCard({ world }: { world: WorldDirectoryEntry }) {
  const style = worldAccentVars(world.theme) as CSSProperties;
  const atmosphere = worldAtmosphereAttrs(world.theme);
  const enterable = world.playable;
  const plate = moodPlate(world.theme?.mood);

  return (
    <article
      {...atmosphere}
      style={style}
      className="dc-world-card dc-frame group relative flex min-h-[21rem] flex-col justify-end overflow-hidden rounded-dc-lg border border-dc-border bg-dc-surface shadow-dc-1 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-1 hover:shadow-dc-3"
    >
      <img
        src={plate}
        alt=""
        aria-hidden
        loading="lazy"
        width={1024}
        height={640}
        className="absolute inset-0 size-full object-cover opacity-70 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <span
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(180deg,rgba(9,13,21,0.15)_0%,rgba(9,13,21,0.72)_52%,rgba(9,13,21,0.95)_100%)]"
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-45 mix-blend-soft-light [background-image:radial-gradient(120%_80%_at_50%_100%,rgb(var(--dc-world-accent-rgb,201_162_39)/0.55),transparent_70%)]"
      />

      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] top-2 left-2 border-t border-l rounded-tl-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] top-2 right-2 border-t border-r rounded-tr-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] bottom-2 left-2 border-b border-l rounded-bl-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] bottom-2 right-2 border-b border-r rounded-br-[6px]" />

      <div className="relative p-6 pt-10">
        <span
          aria-hidden
          className="mb-4 block h-px w-full [background-image:linear-gradient(90deg,rgb(var(--dc-world-accent-rgb,201_162_39)/0.85),transparent_75%)]"
        />

        <h3 className="font-display text-[1.55rem] leading-tight tracking-wide text-dc-text [overflow-wrap:anywhere] [text-shadow:0_2px_18px_rgba(0,0,0,0.8)]">
          {world.display_name}
        </h3>

        {!enterable && (
          <p className="dc-label mt-3 inline-flex w-fit items-center rounded-dc-sm border border-dc-border bg-dc-overlay px-3 py-1.5 text-dc-text-muted">
            Nobody to be here yet
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
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
            className="dc-focus rounded-dc-sm border border-dc-border bg-dc-overlay px-5 py-2.5 font-ui text-sm tracking-wide text-dc-text-muted backdrop-blur transition-colors duration-150 hover:border-dc-accent hover:text-dc-text"
          >
            Browse
          </Link>
        </div>
      </div>
    </article>
  );
}
