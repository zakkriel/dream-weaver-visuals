/**
 * The engine's closed attempt vocabulary — the `type` tag on every unit of an interpreted chain
 * (`beat_frame/1` `interpretation.chain[].type`, pinned by the published schema's `oneOf`). The
 * backend sends this tag and the player's own words; the wording below is presentation the FE owns
 * (D-14), keyed by the tag exactly as the epistemic catalog is.
 */
export type IntentKind =
  | "ActorMoved"
  | "Communicated"
  | "ObjectRelocated"
  | "OwnershipAccessChanged"
  | "EntityCreated"
  | "EntityDestroyed"
  | "AttributeChanged"
  | "UNRESOLVED"
  | "QUERY";

/**
 * One crafted phrase per kind, in story language — the player never reads `OwnershipAccessChanged`
 * (F-1/F-2). Each phrase names what the reader was understood to be *doing*, not the engine's event
 * shape, and each is system-level rather than genre-level: every one of these makes sense in a
 * sci-fi thriller, a workplace drama and a horror story (GA-2), and none of them presumes a genre
 * taxonomy (GA-3).
 */
const INTENT_LABELS: Record<IntentKind, string> = {
  ActorMoved: "Go somewhere",
  Communicated: "Say something",
  ObjectRelocated: "Move something",
  OwnershipAccessChanged: "Give or grant something",
  EntityCreated: "Make something new",
  EntityDestroyed: "Destroy something",
  AttributeChanged: "Change something",
  UNRESOLVED: "Something unclear",
  QUERY: "Look into something",
};

/**
 * The player-facing phrase for one attempt kind, or `null` when the tag is not one this client was
 * generated against. An unrecognised kind is out of contract, and echoing the raw token at a reader
 * would break F-2 — so the unit still renders with the player's own words and simply carries no
 * phrase. Absence over invention.
 */
export function intentLabel(kind: string): string | null {
  return kind in INTENT_LABELS ? INTENT_LABELS[kind as IntentKind] : null;
}
