import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Atmosphere } from "@/components/dc/Atmosphere";
import { SideRail } from "@/components/dc/SideRail";
import { WorldCard } from "@/components/dc/WorldCard";
import { fetchWorlds, type WorldDirectory } from "@/api";
import { loadOrFixture, fixtures, type Loaded } from "@/api/load";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Worlds — DreamChat" },
      { name: "description", content: "Choose a world to enter." },
      { property: "og:title", content: "Worlds — DreamChat" },
      { property: "og:description", content: "Choose a world to enter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Picker,
});

/**
 * Surface 1 — the world picker, and the product's front door.
 *
 * The only surface with no world, so no world theme applies and it renders the house look alone.
 *
 * Read-only by law: there is no create affordance anywhere here, and a law test asserts its absence.
 * Creation exists server-side but is unauthenticated, so a button on it would be shipping a hole.
 *
 * The visuals are entirely `WorldCard` and `SideRail`, which Lovable owns. This route decides only
 * what data reaches them.
 */
function Picker() {
  const [loaded, setLoaded] = useState<Loaded<WorldDirectory> | null>(null);

  useEffect(() => {
    let live = true;
    void loadOrFixture(fetchWorlds, fixtures.worlds as WorldDirectory).then((r) => {
      if (live) setLoaded(r);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <Atmosphere>
      <div className="mx-auto flex w-full max-w-[92rem] gap-6 px-5 py-5">
        <SideRail />
        <main className="min-w-0 flex-1 py-6">
          <header className="mb-10">
            <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-wide text-dc-text [text-shadow:0_2px_24px_rgba(0,0,0,0.8)]">
              Worlds
            </h1>
            <p className="mt-3 font-ui text-dc-text-muted">Choose a world to enter.</p>
            {loaded?.state === "ok" && loaded.source === "fixture" && (
              <p className="dc-label mt-4 inline-flex w-fit rounded-dc-sm border border-dc-border bg-dc-overlay px-3 py-1.5 text-dc-text-muted">
                Offline — showing a captured world list
              </p>
            )}
          </header>

          {loaded === null && <p className="font-ui text-dc-text-muted">Reading the directory…</p>}

          {loaded?.state === "failed" && (
            <p className="font-ui text-dc-text-muted">Could not read the directory. Try again.</p>
          )}

          {/* A directory that answers 404 is not an error worth dressing up: there is simply nothing
              to choose between. Withheld and nonexistent arrive identically (B-1, I-3). */}
          {loaded?.state === "missing" && (
            <p className="font-ui text-dc-text-muted">No worlds to enter.</p>
          )}

          {loaded?.state === "ok" && loaded.data.worlds.length === 0 && (
            <p className="font-ui text-dc-text-muted">No worlds to enter.</p>
          )}

          {loaded?.state === "ok" && loaded.data.worlds.length > 0 && (
            <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 p-0">
              {/* Rendered in the order the payload gave. `id` is the key and the link target; it is
                  never displayed. */}
              {loaded.data.worlds.map((world) => (
                <li key={world.id}>
                  <WorldCard world={world} />
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </Atmosphere>
  );
}
