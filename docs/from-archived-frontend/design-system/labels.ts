/**
 * Qualify colliding labels by their position in the list, leaving unique ones untouched.
 *
 * Two things a viewer perceives can carry the SAME label. Usually the backend now supplies the
 * distinguishing detail itself — "a hooded figure by the bar" against "a hooded figure by the ballast
 * crate" — so most collisions never reach here. What remains is the honest edge: a pair the viewer
 * genuinely cannot tell apart keeps one identical plain label on purpose. That is the fiction working,
 * not a data fault, and it still has to be *addressable* on screen.
 *
 * So position becomes the discriminator, because it is the only real one left: the order is the
 * payload's own and is already visible wherever these are drawn.
 *
 * Shared deliberately. The participants strip and the "who did you mean?" ask both render the same
 * people, and if one said "(1 of 2)" while the other said "the first" a reader could not match them up.
 * One rule, one wording, both surfaces.
 */
export function disambiguateLabels(labels: string[]): string[] {
  const totals = new Map<string, number>();
  for (const label of labels) totals.set(label, (totals.get(label) ?? 0) + 1);

  const seen = new Map<string, number>();
  return labels.map((label) => {
    const total = totals.get(label) ?? 1;
    if (total === 1) return label;
    const nth = (seen.get(label) ?? 0) + 1;
    seen.set(label, nth);
    return `${label} (${nth} of ${total})`;
  });
}
