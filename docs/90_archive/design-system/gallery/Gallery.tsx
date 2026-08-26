import { useState } from "react";
import {
  SKINS, setSkin, getSkin, type SkinName,
  Stack, Inline, Heading, Text, Panel, Divider, Button, IconButton,
  Chip, Badge, Icon, DayTimeChip, PortraitFrame, ImageSlot,
  AppShell, NavRail, ChronicleBar, KnowledgeList, MetaPanel,
} from "../index";

const NAV = [
  { key: "timeline", label: "Timeline", icon: "timeline" as const, href: "#/_ds" },
  { key: "actors", label: "Actors", icon: "actor" as const, href: "#/_ds" },
];

const GROUP = [{
  group_key: "g", group_label: "Dark Foxes connection",
  items: [{ perception_id: "p", content: "Seen at the market", epistemic_type: "direct",
    display_label: "Day 3", decay: { stale: true } }],
}];

export function Gallery() {
  const [skin, setSkinState] = useState<SkinName>(getSkin());
  return (
    <AppShell
      backdrop="/demo-scene.png"
      rail={<NavRail items={NAV} activeKey="actors" />}
      bar={
        <ChronicleBar
          breadcrumb="Design System"
          dayTime="Day 3 · Morning"
          actions={
            <label>
              <span style={{ marginInlineEnd: "var(--dc-space-2)" }}>Skin</span>
              <select
                aria-label="Skin"
                value={skin}
                onChange={(e) => setSkinState(setSkin(e.target.value))}
              >
                {SKINS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          }
        />
      }
    >
      <Stack gap={6}>
        <Stack gap={2}>
          <Heading level={1}>Seren</Heading>
          <Text tone="muted" italic>Master informer, as you currently know her.</Text>
        </Stack>
        <Inline gap={3} wrap>
          <Button>Continue</Button>
          <Button variant="quiet">Report issue</Button>
          <IconButton label="Search"><Icon name="search" /></IconButton>
          <Chip icon={<Icon name="location" size={14} />} href="#/_ds">Dawnfall Market</Chip>
          <Badge status="high">High</Badge>
          <Badge status="med">Medium</Badge>
          <DayTimeChip label="Day 3 · Morning" />
          <PortraitFrame alt="Seren" active />
        </Inline>
        <Divider />
        <Inline gap={4} align="start" wrap>
          <div style={{ flex: "1 1 320px" }}><KnowledgeList groups={GROUP} emptyMessage="Nothing known." /></div>
          <div style={{ flex: "1 1 240px" }}>
            <MetaPanel title="Last known"><Text tone="muted">Dawnfall Market · Day 3, Morning</Text></MetaPanel>
          </div>
          <div style={{ flex: "1 1 240px" }}><ImageSlot alt="Scene placeholder" /></div>
        </Inline>
        <Panel title="Collected knowledge"><Text>Panels, borders, and type all read from the active skin's tokens.</Text></Panel>
      </Stack>
    </AppShell>
  );
}
