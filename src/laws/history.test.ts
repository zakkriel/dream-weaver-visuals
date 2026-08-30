import { describe, it, expect } from "vitest";
import {
  HISTORY_START,
  atBeginning,
  canLoadOlder,
  historyReducer,
  toPage,
  type HistoryState,
  type Remembered,
} from "@/api/history";
import { groupStageLines, haltCopy, type Line } from "@/routes/w.$worldId.play";
import { rpSegments } from "@/lib/rp-text";
import type { NarrationSegment, Transcript } from "@/api";

const MARA = "2ac70000-0000-0000-0000-00000000000a";
const OTHER = "2ac70000-0000-0000-0000-00000000000b";
const WORLD = "22222222-2222-2222-2222-222222222222";

function seg(over: Partial<NarrationSegment> = {}): NarrationSegment {
  return {
    speaker_id: MARA,
    speaker_label: "Mara",
    kind: "speech",
    text: "",
    quote: "a",
    ...over,
  };
}

function entry(over: Partial<Transcript["entries"][number]> = {}): Transcript["entries"][number] {
  return {
    entry_no: 1,
    tick: 10,
    stated: null,
    halt_reason: "completed",
    journey: null,
    segments: [],
    ...over,
  };
}

function payload(
  entries: Transcript["entries"],
  next_before: number | null = null,
): Transcript {
  return {
    schema_version: "transcript/2",
    world_id: WORLD,
    viewer_id: MARA,
    entries,
    next_before,
  };
}

/** The face resolver the LIVE transcript uses: the cast as it stands in the room right now. */
const liveFace = (id: string | null) => (id === MARA ? "mara-now.png" : undefined);

describe("transcript/2: one entry is a beat, not a line", () => {
  it("reads the player's words first, then the narration as delivered", () => {
    const page = toPage(
      payload([
        entry({
          stated: "I ask about the tide",
          segments: [
            seg({ kind: "action", text: "She sets the glass down", quote: null }),
            seg({ kind: "speech", text: "", quote: "The tide turns at dusk." }),
          ],
        }),
      ]),
      haltCopy,
    );

    expect(page.older.map((l) => l.who)).toEqual(["you", "world", "world"]);
    expect(page.older[0]).toMatchObject({ text: "I ask about the tide" });
  });

  it("draws no line of the player's when an entry carries no words", () => {
    // `stated: null` is "no text came in with this beat", which the schema calls out as a different
    // fact from "". It was the ordinary shape of a Continue press; that press was deleted 2026-08-28,
    // but its rows are still in the transcript and must still render, so this stays.
    const page = toPage(payload([entry({ stated: null, segments: [seg()] })]), haltCopy);
    expect(page.older.map((l) => l.who)).toEqual(["world"]);
  });

  it("reverses entries but never the segments inside one", () => {
    const page = toPage(
      payload([
        entry({ entry_no: 2, stated: "second", segments: [seg({ kind: "narration", speaker_id: null, speaker_label: "", text: "B1", quote: null }), seg({ kind: "narration", speaker_id: null, speaker_label: "", text: "B2", quote: null })] }),
        entry({ entry_no: 1, stated: "first", segments: [seg({ kind: "narration", speaker_id: null, speaker_label: "", text: "A1", quote: null })] }),
      ]),
      haltCopy,
    );

    expect(page.older.map((l) => (l.who === "world" ? l.message.text : l.text))).toEqual([
      "first",
      "A1",
      "second",
      "B1",
      "B2",
    ]);
  });

  it("carries next_before through as the cursor for the page before", () => {
    expect(toPage(payload([entry()], 41), haltCopy).next).toBe(41);
    expect(toPage(payload([entry()], null), haltCopy).next).toBeNull();
  });

  it("reads a halt back in the player's language, never the engine's", () => {
    const page = toPage(payload([entry({ halt_reason: "journey_arrived" })]), haltCopy);
    const note = page.older.find((l) => l.who === "note");
    expect(note).toMatchObject({ text: "You arrive." });
    // The raw vocabulary never reaches the screen (F-2).
    expect(JSON.stringify(page.older)).not.toContain("journey_arrived");
  });

  it("says nothing for the ordinary ending", () => {
    const page = toPage(payload([entry({ halt_reason: "completed", segments: [seg()] })]), haltCopy);
    expect(page.older.some((l) => l.who === "note")).toBe(false);
  });
});

describe("history: the record reads in the order it happened", () => {
  it("puts an older page IN FRONT of what is already loaded", () => {
    const first = pageIn(HISTORY_START, [remembered("recent")], 5);
    const second = pageIn(first, [remembered("ancient")], null, 5);
    expect(second.lines.map(text)).toEqual(["ancient", "recent"]);
  });

  it("asks for the next page with the cursor the last page gave", () => {
    const state = pageIn(HISTORY_START, [remembered("a")], 5);
    expect(state.next).toBe(5);
    expect(canLoadOlder(state)).toBe(true);
  });

  it("stops asking once a page says there is nothing older", () => {
    const state = pageIn(HISTORY_START, [remembered("a")], null);
    expect(canLoadOlder(state)).toBe(false);
    expect(atBeginning(state)).toBe(true);
  });

  it("never asks twice at once — a page in flight blocks the next request", () => {
    const inFlight = historyReducer(pageIn(HISTORY_START, [remembered("a")], 5), {
      type: "loading",
      from: 5,
    });
    expect(canLoadOlder(inFlight)).toBe(false);
    expect(atBeginning(inFlight)).toBe(false);
  });

  it("ignores a page nobody is waiting for — the same cursor twice is not two pages", () => {
    const asking = historyReducer(HISTORY_START, { type: "loading", from: null });
    const once = historyReducer(asking, {
      type: "page",
      page: { older: [remembered("a"), remembered("b")], next: 5 },
      from: null,
    });
    const twice = historyReducer(once, {
      type: "page",
      page: { older: [remembered("a"), remembered("b")], next: 5 },
      from: null,
    });
    expect(twice.lines.map(text)).toEqual(["a", "b"]);
    expect(twice).toBe(once);
  });

  it("drops a straggler from a cursor that is no longer in flight", () => {
    const asking = historyReducer(HISTORY_START, { type: "loading", from: 9 });
    const stale = historyReducer(asking, {
      type: "page",
      page: { older: [remembered("from an older request")], next: 8 },
      from: 1,
    });
    expect(stale.lines).toEqual([]);
    expect(stale.loading).toBe(true);
  });

  it("offers no affordance when the world has no record", () => {
    const state = historyReducer(HISTORY_START, { type: "absent" });
    expect(state.available).toBe(false);
    expect(state.lines).toEqual([]);
    expect(canLoadOlder(state)).toBe(false);
    expect(atBeginning(state)).toBe(false);
  });

  it("says a read failed instead of showing a silently short record", () => {
    const loaded = pageIn(HISTORY_START, [remembered("a")], 5);
    const failed = historyReducer(historyReducer(loaded, { type: "loading", from: 5 }), {
      type: "failed",
    });
    expect(failed.failed).toBe(true);
    expect(failed.lines.map(text)).toEqual(["a"]);
    // The cursor survives a failure, so retrying resumes where it stopped rather than restarting.
    expect(failed.next).toBe(5);
    expect(canLoadOlder(failed)).toBe(true);
  });
});

describe("history + live: one transcript, two sources", () => {
  it("reads history first, then the session, in one continuous list", () => {
    const merged = groupStageLines(
      [{ who: "you", text: "remembered thing", remembered: true }, { who: "you", text: "live thing" }],
      liveFace,
    );
    expect(merged.map((l) => l.text)).toEqual(["remembered thing", "live thing"]);
  });

  it("keeps a stored label exactly as stored, even when the speaker is known now", () => {
    // The record says a hooded figure spoke; the viewer has since learned it was Mara, and the live
    // cast resolves that id to Mara's portrait. The old line must not learn it too (D-7, B-1). The
    // backend freezes the label and pins it with its own tests — this is the client half.
    const merged = groupStageLines(
      [
        { who: "world", message: seg({ speaker_label: "a hooded figure", quote: "You'd know." }), remembered: true },
        { who: "world", message: seg({ quote: "The tide turns at dusk." }) },
      ],
      liveFace,
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ speakerLabel: "a hooded figure", face: undefined });
    expect(merged[1]).toMatchObject({ speakerLabel: "Mara", face: "mara-now.png" });
  });

  it("gives a memory the silhouette rather than a face the viewer did not have", () => {
    // `transcript/2` stores no picture per entry, so there is nothing to draw but the silhouette —
    // and borrowing today's portrait would leak an identity backwards through the record.
    const merged = groupStageLines(
      [{ who: "world", message: seg({ speaker_label: "a hooded figure" }), remembered: true }],
      liveFace,
    );
    expect(merged[0]).toMatchObject({ face: undefined });
  });

  it("never folds a remembered line into a live one, even from the same speaker", () => {
    const merged = groupStageLines(
      [
        { who: "world", message: seg({ speaker_label: "a hooded figure", quote: "then" }), remembered: true },
        { who: "world", message: seg({ quote: "now" }) },
      ],
      liveFace,
    );
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ quote: "then" });
    expect(merged[1]).toMatchObject({ quote: "now" });
  });

  it("still folds consecutive remembered lines from one speaker into one card", () => {
    const merged = groupStageLines(
      [
        { who: "world", message: seg({ quote: "one" }), remembered: true },
        { who: "world", message: seg({ quote: "two" }), remembered: true },
      ],
      liveFace,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ quote: "one", more: [{ quote: "two" }] });
  });

  it("never fuses two actors who share a remembered label", () => {
    const merged = groupStageLines(
      [
        { who: "world", message: seg({ speaker_label: "a hooded figure", quote: "a" }), remembered: true },
        {
          who: "world",
          message: seg({ speaker_id: OTHER, speaker_label: "a hooded figure", quote: "b" }),
          remembered: true,
        },
      ],
      liveFace,
    );
    expect(merged).toHaveLength(2);
  });
});

describe("speech and staging are separate fields, and staging may be absent", () => {
  it("carries the quote through the merge untouched", () => {
    const merged = groupStageLines(
      [{ who: "world", message: seg({ text: "she leans in", quote: "The tide turns." }) }],
      liveFace,
    );
    expect(merged[0]).toMatchObject({ text: "she leans in", quote: "The tide turns." });
  });

  it("carries an EMPTY staging through as empty rather than inventing prose", () => {
    // A bare line has no staging. The surface must render nothing for it, not a blank paragraph —
    // rendering `text` unconditionally puts an empty line above half the dialogue.
    const merged = groupStageLines([{ who: "world", message: seg({ text: "", quote: "Plainly." }) }], liveFace);
    expect(merged[0]).toMatchObject({ text: "", quote: "Plainly." });
  });

  it("keeps an action's prose in text and leaves its quote null", () => {
    const merged = groupStageLines(
      [{ who: "world", message: seg({ kind: "action", text: "sets the glass down", quote: null }) }],
      liveFace,
    );
    expect(merged[0]).toMatchObject({ kind: "action", text: "sets the glass down", quote: null });
  });

  it("carries both fields through a grouped run, history and live alike", () => {
    const merged = groupStageLines(
      [
        { who: "world", message: seg({ kind: "action", text: "sets the glass down", quote: null }), remembered: true },
        { who: "world", message: seg({ kind: "speech", text: "", quote: "You'd know." }), remembered: true },
      ],
      liveFace,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      kind: "action",
      text: "sets the glass down",
      quote: null,
      more: [{ kind: "speech", text: "", quote: "You'd know." }],
    });
  });
});

describe("the asterisk convention is read, never applied", () => {
  it("marks an asterisk-wrapped run as an action and the rest as prose", () => {
    expect(rpSegments("I nod. *steps back into the smoke* Then I wait.")).toEqual([
      { kind: "prose", text: "I nod. " },
      { kind: "action", text: "steps back into the smoke" },
      { kind: "prose", text: " Then I wait." },
    ]);
  });

  it("reads a whole line of staging as one action", () => {
    expect(rpSegments("*draws back into the smoke*")).toEqual([
      { kind: "action", text: "draws back into the smoke" },
    ]);
  });

  it("leaves plain text alone", () => {
    expect(rpSegments("I ask Mara about the tide")).toEqual([
      { kind: "prose", text: "I ask Mara about the tide" },
    ]);
  });

  it("does not eat an unclosed asterisk — it is a character the player typed", () => {
    expect(rpSegments("a 5* inn")).toEqual([{ kind: "prose", text: "a 5* inn" }]);
    expect(rpSegments("*unfinished")).toEqual([{ kind: "prose", text: "*unfinished" }]);
  });

  it("marks nothing for an empty pair", () => {
    expect(rpSegments("well ** then")).toEqual([{ kind: "prose", text: "well ** then" }]);
  });

  it("handles several actions in one line", () => {
    expect(rpSegments("*stands* and *leaves*")).toEqual([
      { kind: "action", text: "stands" },
      { kind: "prose", text: " and " },
      { kind: "action", text: "leaves" },
    ]);
  });

  it("reads a remembered player line the same way as a live one", () => {
    // `stated` is stored RAW, so the asterisks are still there when it is read back. The same parse
    // runs on both sides, which is what makes a beat look identical today and next week.
    const stored = toPage(
      payload([entry({ stated: "I nod *steps back* and wait" })]),
      haltCopy,
    ).older[0];
    expect(stored).toMatchObject({ who: "you", text: "I nod *steps back* and wait" });
    expect(rpSegments((stored as { text: string }).text).map((s) => s.kind)).toEqual([
      "prose",
      "action",
      "prose",
    ]);
  });

  it("never alters the text it was given — the sum of the parts is what was typed", () => {
    for (const raw of [
      "I nod. *steps back* Then I wait.",
      "*draws back into the smoke*",
      "a 5* inn",
      "well ** then",
      "plain words",
    ]) {
      const rebuilt = rpSegments(raw)
        .map((s) => (s.kind === "action" ? `*${s.text}*` : s.text))
        .join("");
      expect(rebuilt.replace(/\s+/g, " ").trim()).toBe(raw.replace(/\s+/g, " ").trim());
    }
  });
});

// --- helpers -----------------------------------------------------------------------------------

/** Ask, then answer — the only sequence the reducer accepts, and the one the surface performs. */
function pageIn(
  state: HistoryState,
  older: Remembered[],
  next: number | null,
  from: number | null = null,
): HistoryState {
  return historyReducer(historyReducer(state, { type: "loading", from }), {
    type: "page",
    page: { older, next },
    from,
  });
}

function remembered(text: string): Remembered {
  return { who: "you", text, remembered: true };
}

function text(line: Remembered): string {
  return line.who === "world" ? (line.message.quote ?? line.message.text) : line.text;
}
