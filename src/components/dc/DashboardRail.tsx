import {
  BookOpen,
  Castle,
  ChevronLeft,
  Compass,
  House,
  Puzzle,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { DashboardNavItem } from "@/types/dashboard";

const icons = {
  home: House,
  worlds: Castle,
  characters: UsersRound,
  mods: Puzzle,
  discover: Compass,
  library: BookOpen,
  account: UserRound,
  settings: Settings,
};

export function DashboardRail({ navigation }: { navigation: DashboardNavItem[] }) {
  return (
    <aside className="dashboard-panel sticky top-2 flex h-[calc(100vh-1rem)] min-h-[680px] flex-col items-center overflow-hidden px-2 py-4">
      <Sparkles aria-hidden className="mb-5 size-9 text-dashboard-gold-soft" strokeWidth={1.15} />
      <nav aria-label="Main navigation" className="flex w-full flex-1 flex-col items-center gap-1">
        {navigation.map((item, index) => {
          const Icon = icons[item.icon];
          const separated = index === 6;
          return (
            <a
              key={item.label}
              href="#"
              aria-current={item.active ? "page" : undefined}
              className={`${separated ? "mt-auto border-t border-dashboard-line pt-4" : ""} dc-focus flex w-full flex-col items-center gap-1 rounded-md border px-1 py-2 text-[10px] leading-none transition-colors ${
                item.active
                  ? "border-dashboard-line bg-dashboard-panel-soft text-dashboard-gold-soft shadow-[inset_0_0_16px_rgba(200,131,47,.12)]"
                  : "border-transparent text-dashboard-copy hover:border-dashboard-line hover:text-dashboard-gold-soft"
              }`}
            >
              <Icon aria-hidden className="size-5" strokeWidth={1.4} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <Compass aria-hidden className="mt-3 size-7 text-dashboard-gold" strokeWidth={1.15} />
      <ChevronLeft aria-hidden className="mt-2 size-4 text-dashboard-gold" />
    </aside>
  );
}