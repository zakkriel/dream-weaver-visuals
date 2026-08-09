import { createFileRoute, Link } from "@tanstack/react-router";
import { Atmosphere } from "@/components/dc/Atmosphere";

/**
 * Surface 2 — World home. Scaffold only: this pass designs the world picker.
 * Kept so the picker's "Browse" action leads somewhere real.
 */
export const Route = createFileRoute("/w/$worldId/")({
  head: () => ({
    meta: [
      { title: "World — DreamChat" },
      { name: "description", content: "A world's compendium in DreamChat." },
      { property: "og:title", content: "World — DreamChat" },
      { property: "og:description", content: "A world's compendium in DreamChat." },
    ],
  }),
  component: WorldHome,
});

function WorldHome() {
  return (
    <Atmosphere>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-display text-3xl tracking-wide text-dc-text">World home</h1>
        <p className="font-body text-lg text-dc-text-muted">
          Surface 2 is designed in the next pass.
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
