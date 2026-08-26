import { Icon, type IconName } from "./Icon";

export type NavItem = { key: string; label: string; icon: IconName; href: string };

export function NavRail({ items, activeKey }: { items: NavItem[]; activeKey?: string }) {
  return (
    <nav className="dc-navrail" aria-label="Compendium">
      {items.map((it) => {
        const active = it.key === activeKey;
        return (
          <a
            key={it.key}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`dc-navrail__item${active ? " dc-navrail__item--active" : ""}`}
          >
            <Icon name={it.icon} />
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
