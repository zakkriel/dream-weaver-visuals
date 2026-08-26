import { Heading } from "../primitives/Heading";
import { Text } from "../primitives/Text";
import { EmptyState } from "./EmptyState";
import { decayNote } from "../catalog/epistemic";
import type { Decay } from "../catalog/epistemic";

/**
 * One thing on the viewer's person, as the overlay draws it.
 *
 * `href` is a ready-made link the caller built from the entry's artifact id — routing is app
 * knowledge, so the design system never composes a URL (the same seam the nav rail goes through).
 * `container` absent means the thing is directly on the viewer; present means it is inside another
 * thing of theirs, which the engine already means literally — it charges a whole nested subtree to the
 * carrier's weight, so an overlay drawing only the top layer would contradict the world's own sums.
 */
export type CarriedRow = {
  id: string;
  label: string;
  state: string;
  container?: string | null;
  preview?: string | null;
  decay?: Decay;
  href: string;
};

/**
 * **Carrying now** — the play-facing answer to "what do I have on me right now?" (Artifacts & Carrying
 * PRD AC#1/AC#3, `mvp_slice_and_bridge` §4.1).
 *
 * It lives at the bottom of the Aux sidebar, below the lens content, and stays deliberately light: a
 * disclosure, a list, no grid, no slots, no encumbrance bar, no stats. **It is not an inventory and it
 * is not the Artifact Compendium** (AC#1). The Compendium lists meaningful KNOWN objects whether or not
 * the viewer owns them; this lists possession, and the two are never merged — which is why this reads
 * its own endpoint rather than filtering the index.
 *
 * **No action affordances.** The PRD sketches per-item verbs ("Read", "Draw", "Count") and is explicit
 * that they must be contextual — a different set per object. `carrying/1` ships no `contextual_actions`,
 * and inventing them here would be the client deciding what the world permits (D-14, D-7). So each row
 * is what is known and a link to the full record, and nothing that pretends to act. The verbs land the
 * day the payload carries them.
 *
 * **Stale rows never disappear** (AC#3). A carry state the viewer has not reconfirmed keeps its place
 * and says so, in the same words every other surface uses for decay.
 */
export function CarryingOverlay({ items, open = false }: { items: CarriedRow[]; open?: boolean }) {
  /**
   * The state word earns its place only when the rows do not all share it.
   *
   * `state` is deliberately NOT enum-pinned upstream — the world records one distinction today
   * (in your possession, or not) and the value set widens in place when a real signal lands — so this
   * must never switch on the value or hold an allowlist of it. Comparing the values to each other needs
   * to know none of them: while everything on you reads the same, the panel's own title already says
   * it and repeating one word down the column tells the reader nothing; the moment two states coexist,
   * every row has to name which it is.
   */
  const statesDiffer = new Set(items.map((i) => i.state)).size > 1;

  return (
    <section className="dc-carrying" aria-label="Carrying now">
      <details className="dc-carrying__disclosure" open={open}>
        <summary className="dc-carrying__summary">
          <Heading level={2} className="dc-aux__title">
            Carrying now
          </Heading>
        </summary>
        {/* An empty hand is an answer, not a missing page — the payload says so with an empty array. */}
        {items.length === 0 ? (
          <EmptyState>You have nothing on you.</EmptyState>
        ) : (
          <ul className="dc-carrying__list">
            {items.map((item) => {
              const note = decayNote(item.decay);
              return (
                <li key={item.id} className="dc-carrying__item">
                  <a className="dc-carrying__link" href={item.href}>
                    {item.label}
                  </a>
                  {statesDiffer && (
                    <Text as="span" size="sm" tone="muted" className="dc-carrying__state">
                      {item.state}
                    </Text>
                  )}
                  {item.container && (
                    <Text as="span" size="sm" tone="muted">
                      in your {item.container}
                    </Text>
                  )}
                  {/* The viewer's latest held perception of the thing — it can never say more than its
                      carrier knows, and null is ordinary: you can carry what you know nothing about. */}
                  {item.preview && <Text size="sm">{item.preview}</Text>}
                  {note !== null && (
                    <Text as="small" tone="muted" size="sm" className="dc-source">
                      {note}
                    </Text>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </section>
  );
}
