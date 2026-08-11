import { describe, it, expect } from "vitest";
import { groupTranscript, type Line } from "@/routes/w.$worldId.play";
import type { NarrationMessage } from "@/api";

/**
 * Line-level narration streaming.
 *
 * The engine emits a narration frame per validated line, so one person talking arrives as several
 * frames. These pin how those frames become blocks — the thing that decides whether a reader sees
 * one person speaking or the same face stacked three deep.
 */

const say = (
  speaker_id: string | null,
  speaker_label: string,
  kind: NarrationMessage["kind"],
  text: string,
): Line => ({ who: "world", message: { speaker_id, speaker_label, kind, text } });

const MARA = "2ac70000-0000-0000-0000-0000000000a2";
const HOOD = "2ac70000-0000-0000-0000-0000000000a4";

describe("groupTranscript", () => {
  it("folds consecutive lines from one speaker into a single block", () => {
    const blocks = groupTranscript([
      say(MARA, "Mara", "speech", "The tide turns at dusk."),
      say(MARA, "Mara", "speech", "You'd know that if you'd been here a week."),
      say(MARA, "Mara", "action", "She sets the glass down."),
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "attributed", label: "Mara" });
    expect(blocks[0]!.kind === "attributed" && blocks[0]!.messages).toHaveLength(3);
  });

  it("keeps each line's own treatment inside a block — speech then action", () => {
    const blocks = groupTranscript([
      say(MARA, "Mara", "speech", "Careful."),
      say(MARA, "Mara", "action", "steps back"),
    ]);
    const kinds = blocks[0]!.kind === "attributed" ? blocks[0]!.messages.map((m) => m.kind) : [];
    expect(kinds).toEqual(["speech", "action"]);
  });

  it("starts a new block when the speaker changes", () => {
    const blocks = groupTranscript([
      say(MARA, "Mara", "speech", "One."),
      say(HOOD, "a hooded figure", "action", "draws back"),
      say(MARA, "Mara", "speech", "Two."),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["attributed", "attributed", "attributed"]);
  });

  /**
   * The trap. Two actors can carry the identical perceived label on purpose — that is the fiction
   * working, not a bug — so grouping on the label would fuse two people into one on screen (B-1).
   */
  it("never groups two different actors who share a label", () => {
    const blocks = groupTranscript([
      say(MARA, "a hooded figure", "speech", "One."),
      say(HOOD, "a hooded figure", "speech", "Two."),
    ]);
    expect(blocks).toHaveLength(2);
  });

  it("unattributed narration never joins a run, and breaks one", () => {
    const blocks = groupTranscript([
      say(MARA, "Mara", "speech", "One."),
      say(null, "", "narration", "The room quiets."),
      say(MARA, "Mara", "speech", "Two."),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["attributed", "prose", "attributed"]);
  });

  it("groups consecutive prose lines together but keeps them faceless", () => {
    const blocks = groupTranscript([
      say(null, "", "narration", "The room quiets."),
      say(null, "", "narration", "A hatch thumps shut."),
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "prose" });
  });

  it("the player's own line breaks a run", () => {
    const blocks = groupTranscript([
      say(MARA, "Mara", "speech", "One."),
      { who: "you", text: "I nod" },
      say(MARA, "Mara", "speech", "Two."),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["attributed", "you", "attributed"]);
  });

  it("an error note breaks a run", () => {
    const blocks = groupTranscript([
      say(MARA, "Mara", "speech", "One."),
      { who: "note", text: "The world could not finish that." },
      say(MARA, "Mara", "speech", "Two."),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["attributed", "note", "attributed"]);
  });

  // A speech frame with no speaker id cannot be proven to be the same person as anything else.
  it("an attributed-kind line with a null speaker id never groups", () => {
    const blocks = groupTranscript([
      say(null, "someone", "speech", "One."),
      say(null, "someone", "speech", "Two."),
    ]);
    expect(blocks.every((b) => b.kind === "prose")).toBe(true);
  });

  it("renders nothing for an empty transcript", () => {
    expect(groupTranscript([])).toEqual([]);
  });

  it("never reorders or drops a line", () => {
    const lines: Line[] = [
      say(null, "", "narration", "a"),
      say(MARA, "Mara", "speech", "b"),
      say(MARA, "Mara", "speech", "c"),
      { who: "you", text: "d" },
    ];
    const texts = groupTranscript(lines).flatMap((b) =>
      b.kind === "you" || b.kind === "note" ? [b.text] : b.messages.map((m) => m.text),
    );
    expect(texts).toEqual(["a", "b", "c", "d"]);
  });
});
