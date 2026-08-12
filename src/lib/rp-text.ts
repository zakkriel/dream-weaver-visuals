/**
 * The asterisk convention, read for display only.
 *
 * Roleplay has spelled staging with asterisks for as long as people have roleplayed in text:
 * `*steps back into the smoke*` is something you DO, and everything around it is something you say
 * or narrate. The founder writes that way, so the transcript reads it that way.
 *
 * # Display only — the text is never altered
 *
 * This function does not touch what is sent, stored, or replayed. The beat carries the player's
 * words exactly as typed, asterisks and all, and the stored record keeps them; this only decides
 * which run of characters is drawn in the action style. That matters beyond tidiness: the engine
 * interprets the raw text, and a client that quietly stripped punctuation before sending would be
 * editing the player's intent on its way to the world.
 *
 * The same reading applies to a line read back out of history, so a beat typed today and the same
 * beat re-read next week are drawn identically.
 */
export type RpSegment = { readonly kind: "prose" | "action"; readonly text: string };

/**
 * Split a line into prose and asterisk-wrapped action runs, in order.
 *
 * An unclosed asterisk is not a marker — `*` on its own, or a trailing one with nothing to close it,
 * is a character the player typed and stays visible as prose. Empty `**` is likewise just text: the
 * convention marks an action, and an action with no words is not one.
 */
export function rpSegments(text: string): readonly RpSegment[] {
  const out: RpSegment[] = [];
  let prose = "";
  let rest = text;

  const flush = () => {
    if (prose.trim() !== "") out.push({ kind: "prose", text: prose });
    prose = "";
  };

  for (;;) {
    const open = rest.indexOf("*");
    if (open === -1) break;
    const close = rest.indexOf("*", open + 1);
    // No closing mark: the rest of the line is prose, asterisk included.
    if (close === -1) break;
    const inner = rest.slice(open + 1, close);
    if (inner.trim() === "") {
      // `**` or `*  *` marks nothing. It stays as typed, joined to the prose around it rather than
      // splitting one sentence into two paragraphs.
      prose += rest.slice(0, close + 1);
      rest = rest.slice(close + 1);
      continue;
    }
    prose += rest.slice(0, open);
    flush();
    out.push({ kind: "action", text: inner });
    rest = rest.slice(close + 1);
  }

  prose += rest;
  flush();
  return out;
}
