import { PortraitFrame } from "../primitives/PortraitFrame";
import { Text } from "../primitives/Text";
import { disambiguateLabels } from "../labels";

/**
 * `imageSrc` is a ready-to-use URL the caller built from the payload's image reference — the design
 * system never knows an API path or a tier. Absent means no picture yet, which is the ordinary state
 * and what the silhouette is for (D-8).
 */
export type StripParticipant = { id: string; label: string; imageSrc?: string };

/**
 * Who is present, as a row of portraits beside the scene (UX doctrine §2.2).
 *
 * Only beings with presence and agency ever appear here — never an object, a place, a faction or a
 * document as an avatar (C-10). That is enforced upstream: the scene payload's participants are typed
 * `kind: "actor"` and nothing else, so this component cannot be handed anything else to draw.
 *
 * `speakingId` rings whoever spoke last. It is told, not inferred: the caller passes the speaker id off
 * the narration frame it just received. Clicking a participant is a targeting HINT the caller submits as
 * an ordinary beat — the world still decides who responds, and selection never guarantees obedience.
 *
 * A participant with no `imageSrc` keeps the silhouette; nothing here waits on an image (D-8). Real
 * art does arrive — the strip has drawn actual portraits since PR #18 — and it arrives in the scene
 * payload on the next read, with no re-request and no subscription.
 */
export function ParticipantStrip({
  participants,
  speakingId,
  onSelect,
}: {
  participants: StripParticipant[];
  speakingId?: string | null;
  onSelect?: (participant: StripParticipant) => void;
}) {
  if (participants.length === 0) return null;

  /**
   * Two people in one room can carry the SAME perceived label. Sighted readers tell them apart by
   * position in the row; a screen reader is handed identical names and cannot, so a colliding label
   * gains a positional qualifier in its ACCESSIBLE name only — by the same shared rule the
   * "who did you mean?" ask uses, so the two surfaces always word it identically.
   *
   * The visible label stays exactly what the world said. Numbering them on screen would invent a
   * distinction the viewer does not actually perceive (B-1) — the position in this row is the whole of
   * what distinguishes them, and it is already visible.
   */
  const accessibleNames = disambiguateLabels(participants.map((p) => p.label));

  return (
    <ul className="dc-strip" aria-label="Present">
      {participants.map((p, i) => {
        const speaking = p.id === speakingId;
        const name = accessibleNames[i];
        return (
          <li key={p.id} className="dc-strip__item">
            {onSelect ? (
              // aria-label carries the whole accessible name, which also stops the portrait's alt and
              // the visible label reading out as "Mara Mara".
              <button
                type="button"
                className="dc-strip__button"
                aria-label={name}
                aria-pressed={speaking}
                onClick={() => onSelect(p)}
              >
                <PortraitFrame src={p.imageSrc} alt={name} size={64} active={speaking} />
                <Text as="span" size="sm" className="dc-strip__label">
                  {p.label}
                </Text>
              </button>
            ) : (
              <>
                <PortraitFrame src={p.imageSrc} alt={name} size={64} active={speaking} />
                <Text as="span" size="sm" className="dc-strip__label">
                  {p.label}
                </Text>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
