import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardHome } from "@/components/dc/DashboardHome";
import { loadDirectory, type DirectoryResult } from "@/api/load";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DreamChat" },
      { name: "description", content: "Your worlds in DreamChat." },
      { property: "og:title", content: "Dashboard — DreamChat" },
      { property: "og:description", content: "Your worlds in DreamChat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

/**
 * The dashboard, on `world_directory/2`.
 *
 * The visuals are Lovable's. This route decides only what data reaches them — which is now the real
 * directory rather than a hand-authored mock, so every world, tagline, cover and last-place label on
 * the screen is something the world actually said.
 */
function Dashboard() {
  const [loaded, setLoaded] = useState<DirectoryResult | null>(null);

  useEffect(() => {
    let live = true;
    void loadDirectory().then((r) => {
      if (live) setLoaded(r);
    });
    return () => {
      live = false;
    };
  }, []);

  if (loaded === null) {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center bg-dashboard-bg font-body text-dashboard-copy">
        <p>Reading the directory…</p>
      </div>
    );
  }

  // A base was configured, so there is meant to be a backend at that address. Naming it is the point:
  // a pasted URL with a typo looks exactly like a backend that is down.
  if (loaded.state === "unreachable") {
    return (
      <div className="dashboard-shell flex min-h-screen items-center justify-center bg-dashboard-bg font-body text-dashboard-copy">
        <p>Could not reach the world service at {loaded.base}.</p>
      </div>
    );
  }

  return <DashboardHome worlds={loaded.data.worlds} source={loaded.source} />;
}
