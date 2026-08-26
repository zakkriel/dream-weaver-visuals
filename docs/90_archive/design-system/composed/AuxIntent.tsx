import { Heading } from "../primitives/Heading";
import { Text } from "../primitives/Text";
import { EmptyState } from "./EmptyState";
import { intentLabel } from "../catalog/intent";

/**
 * One unit of an interpreted chain, reduced to what the payload actually carries: the engine's kind
 * tag, the player's own words for that unit, and — for an unclear reference — the phrase that could
 * not be pinned. Typed loosely on `kind` on purpose, exactly as `SourceLine` is, so an out-of-contract
 * tag degrades to "no phrase" instead of throwing.
 */
export type IntentUnit = { kind: string; stated: string; reference?: string };

/**
 * The Aux sidebar's **Intent** lens — "here is what I think you are trying to do", read back from the
 * `interpretation` frame the beat stream already sends.
 *
 * RENDER ONLY. There is deliberately no edit affordance: per-unit correction has no endpoint, and an
 * edit control that cannot edit is worse than none. The mockup's pencils and its "tap any item to
 * refine" footer are therefore absent, and stay absent until an endpoint exists.
 *
 * Three things in the mockup have NO source in the payload and are not invented here (D-7):
 *   - a per-unit authored title and prose description — the payload carries the kind tag and the
 *     player's own `stated` words, so the phrase is the title and `stated` is the detail;
 *   - conditional and nested units ("if new rumours exist… otherwise…") — the chain is a flat
 *     ordered array with no branching;
 *   - the interpretation confidence line and its percentage — there is no confidence field anywhere
 *     in `beat_frame/1`. A number invented here would be a fabricated reading of the player's words,
 *     which is exactly the thing this lens exists to be honest about.
 *
 * The ORDER is the chain's own order and the numbering is that order made visible — the engine runs
 * the units in sequence, so the numbers are structure the payload really has, not a ranking the FE
 * imposed.
 *
 * An interpreted-as-nothing beat is a real and useful answer, not an empty panel: today an input the
 * engine cannot read (any movement, per backend SPEC-030) commits nothing and would otherwise vanish
 * without a word. Saying so is the difference between a quiet world and a broken one.
 */
export function AuxIntent({ units }: { units: IntentUnit[] }) {
  return (
    <section className="dc-aux" aria-label="Intent">
      <Heading level={2} className="dc-aux__title">
        Intent
      </Heading>
      <Heading level={3} className="dc-aux__section">
        What I think you meant
      </Heading>
      {units.length === 0 ? (
        <EmptyState>Nothing in that read as something you could do.</EmptyState>
      ) : (
        <ol className="dc-intent">
          {units.map((unit, i) => {
            const label = intentLabel(unit.kind);
            return (
              <li key={i} className="dc-intent__unit">
                <span className="dc-intent__ordinal" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="dc-intent__body">
                  {label && <Text className="dc-intent__label">{label}</Text>}
                  <Text tone="muted" size="sm">
                    {unit.stated}
                  </Text>
                  {/* The player's own ambiguous phrase, quoted back — `reference` carries the words
                      they actually typed (`stated` is the whole line), so naming it as theirs is
                      accurate. Candidate ids are never rendered: an id is not a name and this client
                      will not invent one (B-1). */}
                  {unit.reference !== undefined && (
                    <Text tone="muted" size="sm" className="dc-intent__unclear">
                      Not sure who or what you meant by “{unit.reference}”.
                    </Text>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
