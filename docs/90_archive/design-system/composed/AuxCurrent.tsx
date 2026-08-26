import { Heading } from "../primitives/Heading";
import { Text } from "../primitives/Text";
import { EmptyState } from "./EmptyState";

/**
 * The Aux sidebar's **Current** lens — "what matters right now" (UX doctrine §2.4, lens 1; the default
 * lens, and the only one chunk 6 owes besides Known).
 *
 * The lines are the viewer's own recent perceptions, phrased by the world and rendered verbatim. This
 * adds no section headings of its own beyond the lens title, sorts nothing, and scores nothing: the
 * doctrine bans fixed buckets (no Rumors / Combat / Quest sections — GA-3) and bans a pressure meter or
 * urgency score outright. Low box density, one flow, which is the whole design intent of the lens.
 *
 * A quiet moment is a real answer. When there is nothing, it says so rather than inventing tension.
 */
export function AuxCurrent({ lines }: { lines: string[] }) {
  return (
    <section className="dc-aux" aria-label="Current">
      <Heading level={2} className="dc-aux__title">
        Current
      </Heading>
      <Heading level={3} className="dc-aux__section">
        What matters now
      </Heading>
      {lines.length === 0 ? (
        <EmptyState>Nothing presses in on you.</EmptyState>
      ) : (
        <ul className="dc-aux__lines">
          {lines.map((line, i) => (
            <li key={i} className="dc-aux__line">
              <Text>{line}</Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
