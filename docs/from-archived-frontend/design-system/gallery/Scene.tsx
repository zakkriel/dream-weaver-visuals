import {
  AppShell, NavRail, type NavItem, ChronicleBar, Text, Chip, Icon,
  type KnowledgeGroup, MetaPanel, Stack, Dossier,
} from "../index";

const NAV: NavItem[] = [
  { key: "timeline", label: "Timeline", icon: "timeline", href: "#/_scene" },
  { key: "actors", label: "Actors", icon: "actor", href: "#/_scene" },
  { key: "locations", label: "Locations", icon: "location", href: "#/_scene" },
  { key: "artifacts", label: "Artifacts", icon: "artifact", href: "#/_scene" },
  { key: "known", label: "Known World", icon: "known-world", href: "#/_scene" },
];

const GROUPS: KnowledgeGroup[] = [
  {
    group_key: "notes",
    group_label: null,
    items: [
      { perception_id: "p1", content: "Spoke at length about the Dark Foxes; gave little away — but her eyes did.", epistemic_type: "direct", display_label: "Day 3", decay: {} },
      { perception_id: "p2", content: "Lingers near the docks at dusk, watching boats that never seem to land.", epistemic_type: "overheard", display_label: "Day 2", decay: { stale: true } },
      { perception_id: "p3", content: "Said to broker secrets for the Lantern-keepers — unconfirmed.", epistemic_type: "rumor", display_label: "Day 1", decay: { stale: true } },
    ],
  },
];

/**
 * The skin proof: a full codex screen with the data the backend cannot supply yet (every projection
 * lens ships empty today — backend SPEC-029), so the theming work can be judged on a populated page.
 *
 * It renders through the REAL `Dossier`, not a copy of it: a proof that diverges from the product is
 * worth nothing, and a second layout would be the second rendering path D-14 forbids.
 */
export function Scene() {
  return (
    <AppShell
      backdrop="/demo-scene.png"
      rail={<NavRail items={NAV} activeKey="actors" />}
      bar={
        <ChronicleBar
          breadcrumb="Eldoria Chronicle · Compendium › Actors › Seren"
          dayTime="Day 3 · Morning"
          actions={<Chip icon={<Icon name="known-world" size={14} />}>Known World</Chip>}
        />
      }
    >
      <Dossier
        eyebrow="The Compendium · Actors"
        title="Seren"
        subtitle="Master informer, as you currently know her."
        synthesis="Seren moves through the Dawnfall Market like a shadow with a purpose. She gathers whispers others overlook, trading in truths that never linger."
        synthesisEmpty="Nothing synthesized yet."
        knowledge={GROUPS}
        knowledgeEmpty="Nothing known yet."
        aside={
          <>
            <MetaPanel title="Last known">
              <Text tone="muted">Dawnfall Market · Day 3, Morning</Text>
            </MetaPanel>
            <MetaPanel title="Known artifacts">
              <Stack gap={2}>
                <Chip icon={<Icon name="artifact" size={14} />}>Sealed note</Chip>
                <Chip icon={<Icon name="artifact" size={14} />}>Silver coin pouch</Chip>
              </Stack>
            </MetaPanel>
          </>
        }
      />
    </AppShell>
  );
}
