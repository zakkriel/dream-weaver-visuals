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