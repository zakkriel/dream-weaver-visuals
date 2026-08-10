import { createFileRoute } from "@tanstack/react-router";
import worldDirectory from "@/fixtures/world_directory.json";
import type { WorldDirectory } from "@/types/world_directory";
import { Atmosphere } from "@/components/dc/Atmosphere";
import { WorldCard } from "@/components/dc/WorldCard";
import { OrnateFrame } from "@/components/dc/OrnateFrame";
import { SideRail } from "@/components/dc/SideRail";
import { housePlate } from "@/lib/mood-plate";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorldPicker,
});

function WorldPicker() {
  const worlds = directory.worlds;

  return (
    <Atmosphere>
      <div className="mx-auto flex w-full max-w-[110rem] gap-5 px-5 py-5">
        <SideRail />

        <main className="min-w-0 flex-1 space-y-5">
          {/* threshold: painted sky, the product mark, the one instruction */}
          <OrnateFrame className="overflow-hidden">
            <div className="relative min-h-[22rem]">
              <img
                src={housePlate}
                alt=""
                aria-hidden
                width={1920}
                height={720}
                className="absolute inset-0 size-full object-cover object-[62%_55%]"
              />
              <span
                aria-hidden
                className="absolute inset-0 [background-image:linear-gradient(90deg,rgba(9,13,21,0.94)_0%,rgba(9,13,21,0.72)_38%,rgba(9,13,21,0.18)_78%,rgba(9,13,21,0.05)_100%),linear-gradient(180deg,rgba(9,13,21,0.20),rgba(9,13,21,0.62))]"
              />

              <div className="relative flex min-h-[19rem] flex-col justify-center gap-4 p-8 md:p-12">
                <p className="dc-label text-dc-accent">DreamChat</p>
                <h1 className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.05] tracking-[0.03em] text-dc-text [text-shadow:var(--dc-text-glow)]">
                  Choose a world to enter.
                </h1>
                <p className="max-w-xl font-body text-lg leading-relaxed text-dc-text-muted">
                  Each world keeps its own weather, its own hour and its own
                  people. You arrive as someone already inside it.
                </p>
                <span
                  aria-hidden
                  className="mt-2 h-px w-64 [background-image:linear-gradient(90deg,var(--dc-accent),transparent)]"
                />
              </div>
            </div>
          </OrnateFrame>

          <section aria-label="Worlds" className="space-y-4">
            <div className="flex items-baseline gap-4 px-1">
              <h2 className="dc-label text-dc-accent">Worlds</h2>
              <span
                aria-hidden
                className="h-px flex-1 [background-image:linear-gradient(90deg,var(--dc-border-accent),transparent)]"
              />
            </div>

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
