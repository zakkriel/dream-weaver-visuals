import { createFileRoute } from "@tanstack/react-router";
import dashboardMock from "@/fixtures/dashboard.mock.json";
import type { DashboardMock } from "@/types/dashboard";
import { DashboardHome } from "@/components/dc/DashboardHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DreamChat" },
      {
        name: "description",
        content: "DreamChat chronicle dashboard for worlds, characters, mods, and updates.",
      },
      { property: "og:title", content: "Dashboard — DreamChat" },
      {
        property: "og:description",
        content: "DreamChat chronicle dashboard for worlds, characters, mods, and updates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return <DashboardHome data={dashboardMock as DashboardMock} />;
}
