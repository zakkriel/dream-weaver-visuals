import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Atmosphere } from "@/components/dc/Atmosphere";
import { refreshWorld, WorldHasNoTemplateError, type WorldSummary } from "@/api";
import { loadDirectory, type DirectoryResult } from "@/api/load";

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
  const navigate = Route.useNavigate();
  const [loaded, setLoaded] = useState<DirectoryResult | null>(null);
  const [refresh, setRefresh] = useState<RefreshState>({ state: "idle" });

  useEffect(() => {
    let live = true;
    void loadDirectory().then((r) => {
      if (live) setLoaded(r);
    });
    return () => {
      live = false;
    };
  }, []);

  const world: WorldSummary | undefined =
    loaded?.state === "ok" ? loaded.data.worlds.find((w) => w.id === worldId) : undefined;

  // A world id that is not in the directory is not there. Withheld and nonexistent arrive
  // identically and stay indistinguishable here (B-1, I-3). Note this is a judgement about the
  // WORLD, not about the read: failing to read the directory degrades to the capture instead.
  const missing = loaded?.state === "ok" && world === undefined;
  const refreshNoteId = "refresh-note";
  const refreshNote =
    refresh.state === "no-template"
      ? "This world was not made from a template, so it cannot be refreshed."
      : refresh.state === "error"
        ? refresh.message
        : null;

  async function confirmRefresh(targetWorldId: string): Promise<void> {
    setRefresh({ state: "working" });
    try {
      const refreshed = await refreshWorld(targetWorldId);
      await navigate({ to: "/w/$worldId/play", params: { worldId: refreshed.id } });
    } catch (error) {
      if (error instanceof WorldHasNoTemplateError) {
        setRefresh({ state: "no-template" });
      } else {
        setRefresh({ state: "error", message: "Could not refresh this world right now. Try again." });
      }
    }
  }

  return (
    <Atmosphere>
      <main className="mx-auto flex min-h-screen w-full max-w-[64rem] flex-col gap-8 px-6 py-12">
        {loaded === null && <p className="font-ui text-dc-text-muted">Reading the world…</p>}

        {loaded?.state === "unreachable" && (
          <p className="font-ui text-dc-text-muted">
            Could not reach the world service at {loaded.base}.
          </p>
        )}

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
            {loaded?.state === "ok" && loaded.source === "fixture" && (
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

              {refresh.state === "confirm" ? (
                <section className="w-full rounded-dc-sm border border-dc-border bg-dc-overlay px-4 py-4">
                  <p className="font-ui text-sm text-dc-text">Refresh this world?</p>
                  <p className="mt-2 max-w-[58ch] font-body text-sm text-dc-text-muted">
                    A fresh copy of this world is created and the current one is retired from your
                    list; nothing that happened is deleted.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void confirmRefresh(world.id)}
                      className="dc-focus dc-enter rounded-dc-sm px-5 py-2.5 font-ui text-sm font-medium"
                    >
                      Refresh now
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefresh({ state: "idle" })}
                      className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted hover:border-dc-accent hover:text-dc-text"
                    >
                      Cancel
                    </button>
                  </div>
                </section>
              ) : (
                <button
                  type="button"
                  disabled={refresh.state === "working"}
                  aria-describedby={refreshNote ? refreshNoteId : undefined}
                  onClick={() => setRefresh({ state: "confirm" })}
                  className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted enabled:hover:border-dc-accent enabled:hover:text-dc-text disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {refresh.state === "working" ? "Refreshing..." : "Refresh"}
                </button>
              )}
            </nav>

            {refreshNote && (
              <p id={refreshNoteId} role="status" aria-live="polite" className="font-ui text-sm text-dc-text-muted">
                {refreshNote}
              </p>
            )}

            {/* The Glossary's four compendium destinations are deliberately absent until those
                surfaces exist. A nav item that goes nowhere is a promise the product cannot keep,
                and a law test asserts there are no placeholder links. */}
          </>
        )}
      </main>
    </Atmosphere>
  );
}

type RefreshState =
  | { state: "idle" }
  | { state: "confirm" }
  | { state: "working" }
  | { state: "error"; message: string }
  | { state: "no-template" };
