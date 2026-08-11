import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPanel } from "@/components/dc/DashboardPanel";
import { DashboardRail } from "@/components/dc/DashboardRail";
import { imageUrl, type WorldSummary } from "@/api";
import { moodPlate } from "@/lib/mood-plate";
import cityImage from "@/assets/dashboard-city.jpg";
import worldsImage from "@/assets/dashboard-worlds.jpg";
import portraitsImage from "@/assets/dashboard-portraits.jpg";

const assets = {
  "--dashboard-hero-image": `url(${cityImage})`,
  "--dashboard-worlds-image": `url(${worldsImage})`,
  "--dashboard-portraits-image": `url(${portraitsImage})`,
} as CSSProperties;

/**
 * The dashboard, on real data.
 *
 * The visual treatment is Lovable's and untouched — same panels, same grid, same type, same gold.
 * What changed is where the content comes from: every value on this screen is now a field of
 * `world_directory/2`, or chrome we wrote ourselves and own.
 *
 * The panels that are gone were not removed for taste. Each rendered something the world never said —
 * a named user, a presence dot, a subscription with a calendar date, a mods catalogue, release notes.
 * They can come back the day a payload carries them; the PR lists each one with the rule it broke.
 */

/** A world's own picture, or the house plate its mood chooses. Never art claiming to be a world. */
function worldPlate(world: WorldSummary): string {
  return world.cover_image ? imageUrl(world.cover_image, "preview") : moodPlate(world.theme?.mood);
}

function SectionTitle({
  icon: Icon,
  title,
  action,
}: {
  icon: typeof Compass;
  title: string;
  action?: { label: string; to: string };
}) {
  return (
    <header className="flex h-9 items-center gap-2 border-b border-dashboard-line px-4">
      <Icon aria-hidden className="size-4 text-dashboard-gold" strokeWidth={1.45} />
      <h2 className="dashboard-heading font-body text-lg">{title}</h2>
      {/* A real destination or nothing. A control that goes nowhere is a promise the product cannot
          keep, and every one of these used to be a dead button. */}
      {action && (
        <Link
          to={action.to}
          className="dc-focus ml-auto flex items-center gap-1 text-xs text-dashboard-gold hover:text-dashboard-gold-soft"
        >
          {action.label}
          <ChevronRight aria-hidden className="size-3" />
        </Link>
      )}
    </header>
  );
}

function WorldTile({ world }: { world: WorldSummary }) {
  return (
    <Link
      to="/w/$worldId"
      params={{ worldId: world.id }}
      className="dc-focus group relative min-h-44 overflow-hidden rounded-md border border-dashboard-line"
    >
      {/* The world's own cover when it has one. `id` is the link target and is never rendered. */}
      <img
        src={worldPlate(world)}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_18%,rgba(2,12,18,.94)_100%)]"
      />
      <span className="absolute inset-x-0 bottom-0 p-3">
        <strong className="block font-body text-base font-normal text-dashboard-gold-soft">
          {world.display_name}
        </strong>
        {/* Where its player stands, or left off. A label and nothing else — no tick, no timestamp.
            Suppressed when it just repeats the world's name, which is what a one-place world gives. */}
        {world.last_place_label && world.last_place_label !== world.display_name && (
          <span className="mt-1 block text-[11px] text-dashboard-copy">{world.last_place_label}</span>
        )}
        {!world.playable && (
          <span className="mt-1 block text-[11px] text-dashboard-copy">Nobody to be here yet</span>
        )}
      </span>
    </Link>
  );
}

export function DashboardHome({
  worlds,
  source,
}: {
  worlds: readonly WorldSummary[];
  source: "live" | "fixture";
}) {
  // The hero shows a world you can actually enter. It is the first playable one in the order the
  // directory gave — NOT "last played", which was a recency claim with no payload behind it.
  const featured = worlds.find((w) => w.playable);

  return (
    <div style={assets} className="dashboard-shell min-h-screen bg-dashboard-bg p-2 font-body text-dashboard-copy">
      <div className="dashboard-desktop-grid mx-auto grid max-w-[1720px] grid-cols-[108px_minmax(0,1fr)] gap-3">
        <DashboardRail />

        <main className="dashboard-main min-w-0 space-y-3">
          <header className="relative flex h-[62px] items-center overflow-hidden px-2">
            <div>
              <p className="text-xs text-dashboard-gold">DreamChat</p>
              <h1 className="dashboard-heading font-body text-2xl leading-none">Your worlds</h1>
            </div>
            {source === "fixture" && (
              <span className="ml-4 rounded-sm border border-dashboard-line bg-dashboard-panel/80 px-3 py-1 text-[10px] uppercase text-dashboard-gold-soft">
                Offline — showing a captured world list
              </span>
            )}
            <span
              aria-hidden
              className="absolute inset-y-0 right-0 w-2/3 bg-[linear-gradient(90deg,transparent,rgba(2,16,23,.2))]"
            />
          </header>

          <DashboardPanel className="grid min-h-[205px] grid-cols-[.78fr_1.22fr] gap-5 p-5 max-lg:grid-cols-1">
            <div className="flex flex-col justify-between">
              <div>
                {/* Chrome, not a claim about anyone. The product does not know who you are. */}
                <h2 className="dashboard-heading font-body text-4xl leading-none">Enter a world</h2>
                <p className="mt-4 max-w-sm text-base italic leading-snug text-dashboard-copy">
                  Each one remembers what you did, and what it thinks you know.
                </p>
              </div>
            </div>

            {featured ? (
              <div className="relative min-h-44 overflow-hidden rounded-md border border-dashboard-line">
                <img
                  src={worldPlate(featured)}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 size-full object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,15,22,.2),rgba(2,15,22,.88))]"
                />
                {featured.last_place_label && (
                  <span className="absolute left-4 top-3 rounded-sm border border-dashboard-line bg-dashboard-panel/80 px-3 py-1 text-[10px] uppercase text-dashboard-gold-soft">
                    {featured.last_place_label}
                  </span>
                )}
                <div className="absolute inset-y-0 right-0 flex w-[58%] flex-col justify-center p-5">
                  <h3 className="dashboard-heading text-2xl">{featured.display_name}</h3>
                  {/* One world-authored line. Authored fiction: the backend never composes it, so
                      null means the world has not been given one. */}
                  {featured.tagline && (
                    <p className="mt-2 flex items-start gap-2 text-sm italic">
                      <Sparkles aria-hidden className="mt-1 size-4 shrink-0 text-dashboard-gold" />
                      {featured.tagline}
                    </p>
                  )}
                  <Button
                    asChild
                    className="mt-4 self-end border border-dashboard-gold bg-dashboard-panel-soft font-body text-dashboard-gold-soft shadow-[inset_0_0_14px_rgba(200,131,47,.25)] hover:bg-dashboard-panel-soft"
                  >
                    <Link to="/w/$worldId/play" params={{ worldId: featured.id }}>
                      Enter
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-44 items-center justify-center rounded-md border border-dashboard-line text-sm italic text-dashboard-copy">
                No world has anyone to be yet.
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel>
            <SectionTitle
              icon={Compass}
              title="Your worlds"
              action={{ label: "View all worlds", to: "/worlds" }}
            />
            {worlds.length === 0 ? (
              <p className="p-5 text-sm italic text-dashboard-copy">No worlds to enter.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3 p-3 max-xl:grid-cols-3 max-md:grid-cols-2">
                {worlds.map((world) => (
                  <WorldTile key={world.id} world={world} />
                ))}
              </div>
            )}
          </DashboardPanel>
        </main>
      </div>
    </div>
  );
}
