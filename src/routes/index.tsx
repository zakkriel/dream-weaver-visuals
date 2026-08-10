import { createFileRoute } from "@tanstack/react-router";
import dashboardMock from "@/fixtures/dashboard.mock.json";
import type { DashboardMock } from "@/types/dashboard";
import { DashboardHome } from "@/components/dc/DashboardHome";

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
  component: Dashboard,
});

function Dashboard() {
  return <DashboardHome data={dashboardMock as DashboardMock} />;
}
