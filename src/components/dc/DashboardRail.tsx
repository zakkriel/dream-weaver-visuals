import { Castle, ChevronLeft, Compass, House, Plus, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * The dashboard rail.
 *
 * Visual treatment untouched. What changed is the list: it now names only destinations that exist.
 *
 * The eight it used to carry — Dashboard, Worlds, Characters, Mods, Discover, Library, Account,
 * Settings — were all placeholder links to nowhere. Six had no route at all, and *Characters* is on
 * the forbidden list besides: the Glossary word is **Actors**, and the fixed nav vocabulary is
 * Actors / Locations / Artifacts / Timeline. Those four return here the day those surfaces do;
 * naming them now would be four more dead buttons.
 */
const DESTINATIONS = [
  { label: "Dashboard", icon: House, to: "/" },
  { label: "Worlds", icon: Castle, to: "/worlds" },
  // Added the commit /create shipped, which is the rule this list already stated: a destination appears
  // here the day its surface does. Creation is its own surface and never a control on the picker — the
  // picker stays read-only (surface 1), and the law test still enforces that.
  { label: "Create", icon: Plus, to: "/create" },
] as const;

export function DashboardRail({ active = "/" }: { active?: string }) {
  return (
    <aside className="dashboard-panel sticky top-2 flex h-[calc(100vh-1rem)] min-h-[680px] flex-col items-center overflow-hidden px-2 py-4">
      <Sparkles aria-hidden className="mb-5 size-9 text-dashboard-gold-soft" strokeWidth={1.15} />
      <nav aria-label="Main navigation" className="flex w-full flex-1 flex-col items-center gap-1">
        {DESTINATIONS.map(({ label, icon: Icon, to }) => {
          const current = to === active;
          return (
            <Link
              key={label}
              to={to}
              aria-current={current ? "page" : undefined}
              className={`dc-focus flex w-full flex-col items-center gap-1 rounded-md border px-1 py-2 text-[10px] leading-none transition-colors ${
                current
                  ? "border-dashboard-line bg-dashboard-panel-soft text-dashboard-gold-soft shadow-[inset_0_0_16px_rgba(200,131,47,.12)]"
                  : "border-transparent text-dashboard-copy hover:border-dashboard-line hover:text-dashboard-gold-soft"
              }`}
            >
              <Icon aria-hidden className="size-5" strokeWidth={1.4} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <Compass aria-hidden className="mt-3 size-7 text-dashboard-gold" strokeWidth={1.15} />
      <ChevronLeft aria-hidden className="mt-2 size-4 text-dashboard-gold" />
    </aside>
  );
}
