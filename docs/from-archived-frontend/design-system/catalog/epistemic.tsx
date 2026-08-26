import { Icon, type IconName } from "../primitives/Icon";
import { Text } from "../primitives/Text";

/**
 * The engine's canonical epistemic enum — the `kind` tag every knowledge item and timeline record
 * carries (`perception_record.epistemic_type`, CHECK-constrained to exactly these ten values).
 * The backend sends this tag and the content; everything below is presentation the FE owns (D-14).
 */
export type EpistemicKind =
  | "direct"
  | "shared"
  | "told"
  | "overheard"
  | "public"
  | "rumor"
  | "inference"
  | "mistaken"
  | "confirmed"
  | "disputed";

/**
 * The catalog: one crafted presentation per kind, keyed by the backend's tag. Labels are story
 * language — the user never reads the engine token (F-2), and the wording follows the phrasings the
 * UX doctrine already sanctions for the Known lens ("directly observed", "told by someone",
 * "publicly known", "inferred").
 *
 * Kinds are system-level, not genre-level: every label here makes sense in a sci-fi thriller, a
 * workplace drama and a horror story (GA-2). No genre taxonomy, no fixed Rumors/Combat sections (GA-3).
 */
const EPISTEMIC: Record<EpistemicKind, { label: string; icon: IconName }> = {
  direct: { label: "Directly observed", icon: "known-world" },
  shared: { label: "Shared with you", icon: "actor" },
  told: { label: "Told by someone", icon: "actor" },
  overheard: { label: "Overheard", icon: "actor" },
  public: { label: "Publicly known", icon: "known-world" },
  rumor: { label: "Rumour", icon: "gem" },
  inference: { label: "Inferred", icon: "gem" },
  mistaken: { label: "Mistaken", icon: "warn" },
  confirmed: { label: "Confirmed", icon: "known-world" },
  disputed: { label: "Disputed", icon: "warn" },
};

function isEpistemicKind(kind: string): kind is EpistemicKind {
  return kind in EPISTEMIC;
}

/** The decay half of a knowledge item's payload: is it stale, and when was it last confirmed. */
export type Decay = { stale?: boolean; last_confirmed_label?: string | null };

/**
 * The one sanctioned phrasing for a stale record, or `null` when it still holds.
 *
 * It lives here alone because more than one surface renders decay — a knowledge item's source line and
 * the Carrying overlay's rows — and two surfaces wording "you have not confirmed this recently"
 * differently would read as two different ideas. Only the wordings the UX doctrine sanctions
 * ("Last known…", "remembered, not verified") appear here, and the last confirmation is named from
 * the payload's own in-world label; ticks order records and never render (B-5).
 *
 * Decay is review pressure, never a reason to hide what was known — every caller keeps rendering the
 * thing itself and appends this.
 */
export function decayNote(decay?: Decay): string | null {
  if (!decay?.stale) return null;
  return decay.last_confirmed_label
    ? `last known — not confirmed since ${decay.last_confirmed_label}`
    : "last known — you have not confirmed this recently";
}

/**
 * The source line for one knowledge item: how it is known, when in world time, and whether it still
 * holds.
 *
 * An unrecognised kind renders **no source label** rather than echoing the raw token: the schemas pin
 * the enum, so an unknown value is out of contract, and showing engine vocabulary to a player would
 * break F-2. Absence over invention — the content and the time label still render, nothing is lost.
 *
 * `time` is the payload's `display_label` and is rendered verbatim; ticks order records, labels render
 * them, and wall-clock never appears (B-5).
 *
 * Stale appends `decayNote`'s one sanctioned phrasing, shared with every other surface that renders
 * decay so they cannot drift apart.
 */
export function SourceLine({
  kind,
  time,
  decay,
}: {
  kind: string;
  time?: string | null;
  decay?: Decay;
}) {
  const entry = isEpistemicKind(kind) ? EPISTEMIC[kind] : null;
  const note = decayNote(decay);
  const staleText = note === null ? "" : ` · ${note}`;
  return (
    <Text as="small" tone="muted" size="sm" className="dc-source">
      {entry && (
        <span className="dc-source__kind">
          <Icon name={entry.icon} size={12} />
          {entry.label}
        </span>
      )}
      {time ? `${entry ? " · " : ""}${time}` : ""}
      {staleText}
    </Text>
  );
}
