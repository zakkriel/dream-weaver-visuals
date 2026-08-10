import { Compass, Globe2 } from "lucide-react";

/**
 * The house rail. On the picker there is no world, so it carries only the
 * product mark and the one destination that exists here.
 */
export function SideRail() {
  return (
    <nav
      aria-label="DreamChat"
      className="dc-glass dc-frame sticky top-5 hidden h-[calc(100vh-2.5rem)] w-[5.5rem] shrink-0 flex-col items-center gap-8 rounded-dc-lg py-7 lg:flex"
    >
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] top-2 left-2 border-t border-l rounded-tl-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] top-2 right-2 border-t border-r rounded-tr-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] bottom-2 left-2 border-b border-l rounded-bl-[6px]" />
      <span aria-hidden className="pointer-events-none absolute size-[22px] opacity-80 border-[color:color-mix(in_srgb,var(--dc-world-accent,var(--dc-accent))_70%,transparent)] bottom-2 right-2 border-b border-r rounded-br-[6px]" />

      <Compass
        aria-hidden
        className="dc-breathe size-8 text-dc-accent [filter:drop-shadow(0_0_10px_rgb(201_162_39/0.5))]"
      />

      <hr aria-hidden className="dc-divider w-10" />

      <span
        aria-current="page"
        className="relative flex w-full flex-col items-center gap-2 text-dc-accent-strong"
      >
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-10 w-px -translate-y-1/2 bg-dc-accent"
        />
        <Globe2 aria-hidden className="size-6" />
        <span className="dc-label">Worlds</span>
      </span>
    </nav>
  );
}
