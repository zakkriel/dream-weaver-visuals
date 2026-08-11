import { createFileRoute } from "@tanstack/react-router";
import { DashboardHome } from "@/components/dc/DashboardHome";
import type { DashboardMock } from "@/types/dashboard";
import mock from "@/mocks/dashboard.mock.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DreamChat" },
      { name: "description", content: "Continue your chronicles and enter your worlds." },
      { property: "og:title", content: "Dashboard — DreamChat" },
      { property: "og:description", content: "Continue your chronicles and enter your worlds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

/**
 * The dashboard home, mounted at the founder's explicit request.
 *
 * Its data is the hand-authored draft mock, NOT a contract payload: several panels (mods, account,
 * discover, presence, "what's new") have no backend field behind them yet. This is the agreed
 * trade — the surface matches the approved mockup now, and the law tests will flag the panels that
 * still need a contract before this can be honest against a live backend.
 */
function Home() {
  return <DashboardHome data={mock as DashboardMock} />;
}
