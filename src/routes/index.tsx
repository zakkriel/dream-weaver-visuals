import { createFileRoute } from "@tanstack/react-router";
import worldDirectory from "@/fixtures/world_directory.json";
import type { WorldDirectory } from "@/types/world_directory";
import { Atmosphere } from "@/components/dc/Atmosphere";
import { WorldCard } from "@/components/dc/WorldCard";
import { OrnateFrame } from "@/components/dc/OrnateFrame";
import { SideRail } from "@/components/dc/SideRail";

const directory = worldDirectory as WorldDirectory;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Worlds — DreamChat" },
      {
        name: "description",
        content:
          "Choose a world to enter. DreamChat is a persistent AI world: every screen is one character's perception of it.",
      },
      { property: "og:title", content: "Worlds — DreamChat" },
      {
        property: "og:description",
        content:
          "Choose a world to enter. DreamChat is a persistent AI world: every screen is one character's perception of it.",
      },
    ],
  }),
  component: WorldPicker,
});

function WorldPicker() {
  const worlds = directory.worlds;

  return (
    <Atmosphere>
      <div className="mx-auto flex w-full max-w-[100rem] gap-5 px-5 py-5">
        <SideRail />

        <main className="min-w-0 flex-1 space-y-5">
          <header className="px-1 pt-2">
            <p className="dc-label text-dc-text-muted">DreamChat</p>
            <h1 className="mt-1 font-display text-[clamp(2rem,4vw,3rem)] leading-tight tracking-[0.04em] text-dc-text [text-shadow:var(--dc-text-glow)]">
              Worlds
            </h1>
          </header>

          {/* threshold panel — no invented copy, no create affordance */}
          <OrnateFrame className="overflow-hidden">
            <div className="relative grid gap-8 p-8 md:grid-cols-[1.1fr_1fr] md:p-10">
              <div className="flex flex-col justify-center">
                <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight text-dc-text">
                  Choose a world to enter.
                </h2>
                <p className="mt-4 max-w-md font-body text-lg leading-relaxed text-dc-text-muted">
                  Each world keeps its own weather, its own hour and its own
                  people. You arrive as someone already inside it.
                </p>
                <hr aria-hidden className="dc-divider mt-8 w-56" />
              </div>

              <div
                aria-hidden
                className="dc-threshold relative min-h-[12rem] overflow-hidden rounded-dc-md border border-dc-border"
              >
                <span className="dc-drift absolute inset-0" />
              </div>
            </div>
          </OrnateFrame>

          <section aria-label="Worlds">
            <h2 className="dc-label mb-4 px-1 text-dc-text-muted">
              Worlds
            </h2>

            {worlds.length === 0 ? (
              <OrnateFrame className="p-12 text-center">
                <p className="font-display text-2xl text-dc-text">
                  No worlds are awake right now.
                </p>
                <p className="mt-3 font-body text-lg text-dc-text-muted">
                  When one opens, it will appear here.
                </p>
              </OrnateFrame>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {worlds.map((world) => (
                  <WorldCard key={world.id} world={world} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </Atmosphere>
  );
}
