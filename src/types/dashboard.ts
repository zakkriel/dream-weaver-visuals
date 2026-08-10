/**
 * UNROUTED. This shape backs `components/dc/Dashboard*`, which no route mounts.
 *
 * It corresponds to no contract in `contracts/`. Its data file has been moved to
 * `docs/lovable-drafts/dashboard.mock.json` — it was hand-authored, and sitting in `src/fixtures/`
 * beside twelve real captured payloads made it indistinguishable from one.
 *
 * The components are kept, not deleted: the visual work is good and Lovable owns it. What it needs
 * before it can mount is a contract behind each value — see `AGENTS.md`, "The dashboard".
 */

export interface DashboardNavItem {
  label: string;
  icon: "home" | "worlds" | "characters" | "mods" | "discover" | "library" | "account" | "settings";
  active?: boolean;
}

export interface DashboardWorld {
  name: string;
  progress: string;
  scene?: string;
  href: string;
  imageIndex: number;
}

export interface DashboardCharacter {
  name: string;
  role: string;
  online: boolean;
  imageIndex: number;
}

export interface DashboardMock {
  product: string;
  chronicle: string;
  greeting: string;
  introduction: string;
  profile: { name: string; status: string };
  navigation: DashboardNavItem[];
  primaryActions: { label: string; icon: "spark" | "feather" }[];
  lastWorld: DashboardWorld & { eyebrow: string; time: string; action: string };
  worldsSection: { title: string; action: string; createLabel: string; worlds: DashboardWorld[] };
  charactersSection: { title: string; action: string; characters: DashboardCharacter[] };
  modsSection: {
    title: string;
    action: string;
    entries: { name: string; state: string }[];
  };
  updatesSection: {
    title: string;
    badge: string;
    headline: string;
    action: string;
    entries: string[];
  };
  accountSection: {
    title: string;
    planLabel: string;
    planName: string;
    renewal: string;
    links: string[];
  };
  discoverSection: {
    title: string;
    entries: { title: string; description: string; imageIndex: number }[];
  };
}