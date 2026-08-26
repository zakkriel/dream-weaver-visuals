// Skins
export { setSkin, getSkin, SKINS, DEFAULT_SKIN, type SkinName } from "./skins/index";
export { applyTheme, clearTheme, type Theme, type AppliedTheme } from "./skins/theme";
// Labels — one rule for how colliding labels are told apart, shared by every surface that draws them
export { disambiguateLabels } from "./labels";
// Layout
export { Stack, type Space } from "./primitives/Stack";
export { Inline } from "./primitives/Inline";
// Typography
export { Heading } from "./primitives/Heading";
export { Text } from "./primitives/Text";
// Surfaces
export { Panel, Card } from "./primitives/Panel";
export { Divider } from "./primitives/Divider";
// Actions
export { Button } from "./primitives/Button";
export { IconButton } from "./primitives/IconButton";
// Input
export { InputField } from "./primitives/InputField";
export { Collapsible } from "./primitives/Collapsible";
// Tags
export { Chip } from "./primitives/Chip";
export { Badge } from "./primitives/Badge";
// Icon
export { Icon, type IconName } from "./primitives/Icon";
// Media
export { DayTimeChip } from "./primitives/DayTimeChip";
export { PortraitFrame } from "./primitives/PortraitFrame";
export { ImageSlot } from "./primitives/ImageSlot";
// Shell — the neutral skeleton of named slots (SPEC-023)
export { AppShell, type AuxMode } from "./primitives/AppShell";
export { NavRail, type NavItem } from "./primitives/NavRail";
export { ChronicleBar } from "./primitives/ChronicleBar";
// Composed
export { KnowledgeList, type KnowledgeGroup, type KnowledgeItem } from "./composed/KnowledgeList";
export { MetaPanel } from "./composed/MetaPanel";
export { EmptyState } from "./composed/EmptyState";
export { Timeline, type TimelineRecord } from "./composed/Timeline";
export { Dossier } from "./composed/Dossier";
// Play surface (rung 4)
export { SceneCanvas } from "./composed/SceneCanvas";
export { ParticipantStrip, type StripParticipant } from "./composed/ParticipantStrip";
export { JourneyBar, type JourneyState } from "./composed/JourneyBar";
export { AuxCurrent } from "./composed/AuxCurrent";
export { AuxIntent, type IntentUnit } from "./composed/AuxIntent";
export { CarryingOverlay, type CarriedRow } from "./composed/CarryingOverlay";
export { NotFound } from "./composed/NotFound";
export { LoadError } from "./composed/LoadError";
// Catalog — kind tag → crafted component, one rendering path per job (D-14)
export { SourceLine, decayNote, type EpistemicKind, type Decay } from "./catalog/epistemic";
export { MessageSegment, type MessageKind } from "./catalog/message";
export { intentLabel, type IntentKind } from "./catalog/intent";
