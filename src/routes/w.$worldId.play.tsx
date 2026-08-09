import { createFileRoute, Link } from "@tanstack/react-router";
import { Atmosphere } from "@/components/dc/Atmosphere";

/**
 * Surface 3 — Play. Scaffold only: this pass designs the world picker.
 * Kept so the picker's "Enter" action leads somewhere real.
 */
export const Route = createFileRoute("/w/$worldId/play")({
  head: () => ({
    meta: [
      { title: "Play — DreamChat" },
      { name: "description", content: "Play a persistent world in DreamChat." },
      { property: "og:title", content: "Play — DreamChat" },
      { property: "og:description", content: "Play a persistent world in DreamChat." },
    ],
  }),
  component: PlayScaffold,
});

function PlayScaffold() {
  return (
    <Atmosphere>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-display text-3xl tracking-wide text-dc-text">Play</h1>
        <p className="font-body text-lg text-dc-text-muted">
          Surface 3 is designed in the next pass.
        </p>
        <Link
          to="/"
          className="dc-focus rounded-dc-sm border border-dc-border px-5 py-2.5 font-ui text-sm text-dc-text-muted transition-colors hover:border-dc-accent hover:text-dc-text"
        >
          Back to worlds
        </Link>
      </main>
    </Atmosphere>
  );
}
