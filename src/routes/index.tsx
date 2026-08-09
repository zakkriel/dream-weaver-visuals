import { createFileRoute } from "@tanstack/react-router";
import worldDirectory from "@/fixtures/world_directory.json";
import type { WorldDirectory } from "@/types/world_directory";
import { Atmosphere } from "@/components/dc/Atmosphere";
import { WorldCard } from "@/components/dc/WorldCard";

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
  return (
    <Atmosphere>
      <main className="mx-auto flex min-h-screen w-full max-w-[68rem] flex-col justify-center px-6 py-20">
        <header className="text-center">
          <p className="dc-label text-dc-accent">A persistent world</p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,3.75rem)] leading-tight tracking-[0.06em] text-dc-text [text-shadow:var(--dc-text-glow)]">
            DreamChat
          </h1>
          <hr aria-hidden className="dc-divider mx-auto mt-7 w-56" />
          <p className="mx-auto mt-6 max-w-md font-body text-lg leading-relaxed text-dc-text-muted">
            Choose a world to enter.
          </p>
        </header>

        <section
          aria-label="Worlds"
          className="mt-14 grid gap-6 sm:grid-cols-2"
        >
          {directory.worlds.map((world) => (
            <WorldCard key={world.id} world={world} />
          ))}
        </section>
      </main>
    </Atmosphere>
  );
}
