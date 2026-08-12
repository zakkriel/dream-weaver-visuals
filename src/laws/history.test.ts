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
import { groupStageLines, type Line } from "@/routes/w.$worldId.play";
import { rpSegments } from "@/lib/rp-text";
import type { NarrationMessage } from "@/api";

const MARA = "2ac70000-0000-0000-0000-00000000000a";
const OTHER = "2ac70000-0000-0000-0000-00000000000b";

function msg(over: Partial<NarrationMessage> = {}): NarrationMessage {
  return { speaker_id: MARA, speaker_label: "Mara", kind: "speech", text: "a", ...over };
}

/** The face resolver the LIVE transcript uses: the cast as it stands in the room right now. */
const liveFace = (id: string | null) => (id === MARA ? "mara-now.png" : undefined);

describe("history: the record reads in the order it happened", () => {
  it("reverses a newest-first page into an oldest-first read", () => {
    const page = toPage({
      schema_version: "transcript_history/1",
      entries: [
        { kind: "player", text: "third" },
        { kind: "player", text: "second" },
        { kind: "player", text: "first" },
      ],
      next: "cursor-1",
    } as never);

    expect(page.older.map((l) => (l.who === "you" ? l.text : ""))).toEqual([
      "first",
      "second",
      "third",
    ]);
    expect(page.next).toBe("cursor-1");
  });

  it("puts an older page IN FRONT of what is already loaded", () => {
    const first = pageIn(HISTORY_START, [remembered("recent")], "c1");
    const second = pageIn(first, [remembered("ancient")], null, "c1");

    expect(second.lines.map(text)).toEqual(["ancient", "recent"]);
  });

  it("asks for the next page with the cursor the last page gave", () => {
    const state = pageIn(HISTORY_START, [remembered("a")], "c1");
    expect(state.next).toBe("c1");
    expect(canLoadOlder(state)).toBe(true);
  });

  it("stops asking once a page says there is nothing older", () => {
    const state = pageIn(HISTORY_START, [remembered("a")], null);
    expect(canLoadOlder(state)).toBe(false);
    expect(atBeginning(state)).toBe(true);
  });

  it("never asks twice at once — a page in flight blocks the next request", () => {
    const loaded = pageIn(HISTORY_START, [remembered("a")], "c1");
    const inFlight = historyReducer(loaded, { type: "loading", from: "c1" });
    expect(canLoadOlder(inFlight)).toBe(false);
    // ...and it is not mistaken for having reached the beginning while it waits.
    expect(atBeginning(inFlight)).toBe(false);
  });

  it("ignores a page nobody is waiting for — the same cursor twice is not two pages", () => {
    // A scroll gesture can ask for the same cursor twice before the first answer lands. Applying the
    // second copy prepends the same stretch of story again, which reads as the world repeating itself.
    const asking = historyReducer(HISTORY_START, { type: "loading", from: null });
    const once = historyReducer(asking, {
      type: "page",
      page: { older: [remembered("a"), remembered("b")], next: "c1" },
      from: null,
    });
    const twice = historyReducer(once, {
      type: "page",
      page: { older: [remembered("a"), remembered("b")], next: "c1" },
      from: null,
    });
    expect(twice.lines.map(text)).toEqual(["a", "b"]);
    expect(twice).toBe(once);
  });

  it("drops a straggler from a cursor that is no longer in flight", () => {
    const asking = historyReducer(HISTORY_START, { type: "loading", from: "c9" });
    const stale = historyReducer(asking, {
      type: "page",
      page: { older: [remembered("from an older request")], next: "c8" },
      from: "c1",
    });
    expect(stale.lines).toEqual([]);
    expect(stale.loading).toBe(true);
  });

  it("offers no affordance when the backend serves no record", () => {
    const state = historyReducer(HISTORY_START, { type: "absent" });
    expect(state.available).toBe(false);
    expect(state.lines).toEqual([]);
    expect(canLoadOlder(state)).toBe(false);
    // `available` is what the surface hides the expand control on, so it must not read as "at the
    // beginning of the record" either — there is no record.
    expect(atBeginning(state)).toBe(false);
  });

  it("says a read failed instead of showing a silently short record", () => {
    const loaded = pageIn(HISTORY_START, [remembered("a")], "c1");
    const failed = historyReducer(historyReducer(loaded, { type: "loading", from: "c1" }), { type: "failed" });
    expect(failed.failed).toBe(true);
    expect(failed.lines.map(text)).toEqual(["a"]);
    // The cursor survives a failure, so retrying resumes where it stopped rather than restarting.
    expect(failed.next).toBe("c1");
    expect(canLoadOlder(failed)).toBe(true);
  });
});

describe("history + live: one transcript, two sources", () => {
  it("reads history first, then the session, in one continuous list", () => {
    const merged = groupStageLines(
      [...history([you("remembered thing")]), { who: "you", text: "live thing" }],
      liveFace,
    );
    expect(merged.map((l) => (l.who === "you" ? l.text : ""))).toEqual([
      "remembered thing",
      "live thing",
    ]);
  });

  it("keeps a stored label exactly as stored, even when the speaker is known now", () => {
    // The record says a hooded figure spoke. The viewer has since learned it was Mara, and the live
    // cast resolves that id to Mara's portrait. The old line must not learn it too (D-7, B-1).
    const merged = groupStageLines(
      [
        {
          who: "world",
          message: msg({ speaker_label: "a hooded figure", text: "You'd know that." }),
          remembered: true,
        },
        { who: "world", message: msg({ text: "The tide turns at dusk." }) },
      ],
      liveFace,
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ speakerLabel: "a hooded figure", face: undefined });
    expect(merged[1]).toMatchObject({ speakerLabel: "Mara", face: "mara-now.png" });
  });

  it("wears the picture the record carries, not the one the room shows", () => {
    const merged = groupStageLines(
      [
        {
          who: "world",
          message: msg({ speaker_label: "a hooded figure" }),
          face: "hooded-then.png",
          remembered: true,
        },
      ],
      liveFace,
    );
    expect(merged[0]).toMatchObject({ face: "hooded-then.png" });
  });

  it("never folds a remembered line into a live one, even from the same speaker", () => {
    // Same speaker id on both sides of the seam. Folding them would put the live label and face over
    // words spoken before the viewer knew whose they were.
    const merged = groupStageLines(
      [
        { who: "world", message: msg({ speaker_label: "a hooded figure", text: "then" }), remembered: true },
        { who: "world", message: msg({ text: "now" }) },
      ],
      liveFace,
    );
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ text: "then" });
    expect(merged[1]).toMatchObject({ text: "now" });
  });

  it("still folds consecutive remembered lines from one speaker into one card", () => {
    const merged = groupStageLines(
      history([
        { who: "world", message: msg({ text: "one" }), remembered: true },
        { who: "world", message: msg({ text: "two" }), remembered: true },
      ]),
      liveFace,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ text: "one", more: [{ kind: "speech", text: "two" }] });
  });

  it("never fuses two actors who share a remembered label", () => {
    const merged = groupStageLines(
      history([
        { who: "world", message: msg({ speaker_label: "a hooded figure", text: "a" }), remembered: true },
        {
          who: "world",
          message: msg({ speaker_id: OTHER, speaker_label: "a hooded figure", text: "b" }),
          remembered: true,
        },
      ]),
      liveFace,
    );
    expect(merged).toHaveLength(2);
  });

  it("drops nothing and reorders nothing across a merge", () => {
    const merged = groupStageLines(
      [
        ...history([you("h1"), { who: "world", message: msg({ text: "h2" }), remembered: true }]),
        { who: "you", text: "l1" },
        { who: "world", message: msg({ speaker_id: OTHER, speaker_label: "the muscle", text: "l2" }) },
      ],
      liveFace,
    );
    const texts = merged.map((l) => (l.who === "world" ? l.text : l.text));
    expect(texts).toEqual(["h1", "h2", "l1", "l2"]);
  });
});

describe("action and speech read differently, wherever they came from", () => {
  it("carries the kind through the merge unchanged on both sides", () => {
    const merged = groupStageLines(
      [
        { who: "world", message: msg({ kind: "action", text: "draws back" }), remembered: true },
        { who: "world", message: msg({ kind: "speech", text: "The tide turns." }) },
      ],
      liveFace,
    );
    expect(merged.map((l) => (l.who === "world" ? l.kind : ""))).toEqual(["action", "speech"]);
  });

  it("keeps action and speech from one speaker as separate lines inside one card", () => {
    const merged = groupStageLines(
      history([
        { who: "world", message: msg({ kind: "action", text: "sets the glass down" }), remembered: true },
        { who: "world", message: msg({ kind: "speech", text: "You'd know." }), remembered: true },
      ]),
      liveFace,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      kind: "action",
      text: "sets the glass down",
      more: [{ kind: "speech", text: "You'd know." }],
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

  it("never alters the text it was given — the sum of the parts is what was typed", () => {
    // What is stored and what is sent are this string. Display may split it; nothing may edit it.
    for (const raw of [
      "I nod. *steps back* Then I wait.",
      "*draws back into the smoke*",
      "a 5* inn",
      "well ** then",
      "plain words",
    ]) {
      const rebuilt = rpSegments(raw)
        .map((seg) => (seg.kind === "action" ? `*${seg.text}*` : seg.text))
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
  next: string | null,
  from: string | null = null,
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
function you(text: string): Line {
  return { who: "you", text, remembered: true };
}
function history(lines: Line[]): Line[] {
  return lines;
}
function text(line: Remembered): string {
  return line.who === "you" ? line.text : line.message.text;
}

// Type-level guard: the reducer's state shape is what the surface reads.
const _shape: HistoryState = HISTORY_START;
void _shape;
