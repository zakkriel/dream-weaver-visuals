import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Atmosphere } from "@/components/dc/Atmosphere";
import { type WorldDirectory, type WorldSummary } from "@/api";
import { loadDirectory, type Source } from "@/api/load";

export const Route = createFileRoute("/w/$worldId/")({
  head: () => ({
    meta: [
      { title: "World — DreamChat" },
      { name: "description", content: "A world you know." },
      { property: "og:title", content: "World — DreamChat" },
      { property: "og:description", content: "A world you know." },
    ],
  }),
  component: WorldHome,
});

/**
 * Surface 2 — the world home.
 *
 * Wiring only; the visuals are placeholder against the house tokens until Lovable designs this
 * surface. What it establishes is the data: the world's own identity, read from the directory rather
 * than invented.
 *
 * `world_directory/2` is what makes this surface worth having at all — it carries `tagline` (one
 * world-authored line) and `last_place_label` (a label and nothing else, no tick, no timestamp), so
 * the page can say something true about the world instead of listing four links.
 *
 * There is no world-summary endpoint, so everything here comes from the directory entry. Nothing is
 * derived and nothing is filled in.
 */
function WorldHome() {
  const { worldId } = Route.useParams();
  const [loaded, setLoaded] = useState<{ data: WorldDirectory; source: Source } | null>(null);

  useEffect(() => {
    let live = true;
    void loadDirectory().then((r) => {
      if (live) setLoaded(r);
    });
    return () => {
      live = false;
    };
  }, []);

  const world: WorldSummary | undefined = loaded?.data.worlds.find((w) => w.id === worldId);

  // A world id that is not in the directory is not there. Withheld and nonexistent arrive
  // identically and stay indistinguishable here (B-1, I-3). Note this is a judgement about the
  // WORLD, not about the read: failing to read the directory degrades to the capture instead.
  const missing = loaded !== null && world === undefined;

  return (
    <Atmosphere>
      <main className="mx-auto flex min-h-screen w-full max-w-[64rem] flex-col gap-8 px-6 py-12">
        {loaded === null && <p className="font-ui text-dc-text-muted">Reading the world…</p>}

        {missing && (
          <>
            <h1 className="font-display text-3xl tracking-wide text-dc-text">Not found</h1>
            <Link
              to="/"
              className="dc-focus w-fit rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text"
            >
              Back to worlds
            </Link>
          </>
        )}

        {world && (
          <>
            {loaded?.source === "fixture" && (
              <p className="dc-label w-fit rounded-dc-sm border border-dc-border bg-dc-overlay px-3 py-1.5 text-dc-text-muted">
                Offline — showing a captured world
              </p>
            )}

            <header className="flex flex-col gap-4">
              <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-wide text-dc-text [text-shadow:0_2px_24px_rgba(0,0,0,0.8)]">
                {world.display_name}
              </h1>

              {/* One world-authored line. Authored fiction: the backend never composes it, so null
                  means the world has not been given one — not that it is loading. */}
              {world.tagline && (
                <p className="max-w-[52ch] font-body text-lg italic text-dc-text-muted">
                  {world.tagline}
                </p>
              )}

              {/* Where its player stands, or left off. A label and nothing else. */}
              {world.last_place_label && (
                <p className="dc-label w-fit rounded-dc-sm border border-dc-border bg-dc-overlay px-3 py-1.5 text-dc-text-muted">
                  {world.last_place_label}
                </p>
              )}
            </header>

            <nav aria-label="This world" className="flex flex-wrap gap-3">
              {world.playable ? (
                <Link
                  to="/w/$worldId/play"
                  params={{ worldId: world.id }}
                  className="dc-focus dc-enter rounded-dc-sm px-5 py-2.5 font-ui text-sm font-medium"
                >
                  Enter
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted opacity-70"
                >
                  Nobody to be here yet
                </span>
              )}
              <Link
                to="/"
                className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text"
              >
                Other worlds
              </Link>
            </nav>

            {/* The Glossary's four compendium destinations are deliberately absent until those
                surfaces exist. A nav item that goes nowhere is a promise the product cannot keep,
                and a law test asserts there are no placeholder links. */}
          </>
        )}
      </main>
    </Atmosphere>
  );
}
