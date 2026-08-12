import { describe, it, expect } from "vitest";
import { groupStageLines, type Line } from "@/routes/w.$worldId.play";
import type { NarrationMessage } from "@/api";

/**
 * Line-level narration streaming.
 *
 * The engine emits a narration frame per validated line, so one person talking arrives as several
 * frames. Two things go wrong if that is rendered naively, and both were observed in a browser before
 * these existed: the transcript showed only the newest line, so five of six vanished; and every frame
 * drew its own portrait and name, stacking one speaker's face three deep.
 */

const say = (
  speaker_id: string | null,
  speaker_label: string,
  kind: NarrationMessage["kind"],
  text: string,
): Line => ({
  who: "world",
  message: { speaker_id, speaker_label, kind, text, quote: kind === "speech" ? text : null },
});

const MARA = "2ac70000-0000-0000-0000-0000000000a2";
const HOOD = "2ac70000-0000-0000-0000-0000000000a4";
const face = (id: string | null) => (id === null ? undefined : `/face/${id}`);

/** Every text that reaches the screen, in order — the pin that nothing is lost or reordered. */
function rendered(lines: Line[]): string[] {
  return groupStageLines(lines, face).flatMap((l) =>
    l.who === "world" ? [l.text, ...(l.more ?? []).map((m) => m.text)] : [l.text],
  );
}

describe("groupStageLines", () => {
  it("keeps every line, in arrival order", () => {
    const lines = [
      say(null, "", "narration", "a"),
      say(MARA, "Mara", "speech", "b"),
      say(MARA, "Mara", "speech", "c"),
      { who: "you", text: "d" } as Line,
      say(HOOD, "a hooded figure", "action", "e"),
    ];
    expect(rendered(lines)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("folds consecutive lines from one speaker into a single stage line", () => {
    const out = groupStageLines(
      [
        say(MARA, "Mara", "speech", "The tide turns at dusk."),
        say(MARA, "Mara", "speech", "You'd know that if you'd been here a week."),
        say(MARA, "Mara", "action", "She sets the glass down."),
      ],
      face,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ who: "world", speakerLabel: "Mara" });
    expect(out[0]!.who === "world" && out[0]!.more).toHaveLength(2);
  });

  it("keeps each line's own kind inside a run — speech then action", () => {
    const out = groupStageLines(
      [say(MARA, "Mara", "speech", "Careful."), say(MARA, "Mara", "action", "steps back")],
      face,
    );
    const first = out[0];
    expect(first!.who === "world" && first!.kind).toBe("speech");
    expect(first!.who === "world" && first!.more?.[0]?.kind).toBe("action");
  });

  it("starts a new stage line when the speaker changes", () => {
    const out = groupStageLines(
      [
        say(MARA, "Mara", "speech", "One."),
        say(HOOD, "a hooded figure", "action", "draws back"),
        say(MARA, "Mara", "speech", "Two."),
      ],
      face,
    );
    expect(out).toHaveLength(3);
  });

  /**
   * The trap. Two actors can carry the identical perceived label on purpose — that is the fiction
   * working — so grouping on the label would fuse two people into one on screen (B-1).
   */
  it("never groups two different actors who share a label", () => {
    const out = groupStageLines(
      [say(MARA, "a hooded figure", "speech", "One."), say(HOOD, "a hooded figure", "speech", "Two.")],
      face,
    );
    expect(out).toHaveLength(2);
  });

  it("unattributed narration never joins a run, and breaks one", () => {
    const out = groupStageLines(
      [
        say(MARA, "Mara", "speech", "One."),
        say(null, "", "narration", "The room quiets."),
        say(MARA, "Mara", "speech", "Two."),
      ],
      face,
    );
    expect(out).toHaveLength(3);
    expect(out[1]!.who === "world" && out[1]!.kind).toBe("narration");
  });

  it("the player's own line breaks a run", () => {
    const out = groupStageLines(
      [
        say(MARA, "Mara", "speech", "One."),
        { who: "you", text: "I nod" } as Line,
        say(MARA, "Mara", "speech", "Two."),
      ],
      face,
    );
    expect(out.map((l) => l.who)).toEqual(["world", "you", "world"]);
  });

  it("an error note breaks a run", () => {
    const out = groupStageLines(
      [
        say(MARA, "Mara", "speech", "One."),
        { who: "note", text: "The world could not finish that." } as Line,
        say(MARA, "Mara", "speech", "Two."),
      ],
      face,
    );
    expect(out.map((l) => l.who)).toEqual(["world", "note", "world"]);
  });

  // A speech frame with no speaker id cannot be proven to be the same person as anything else.
  it("an attributed-kind line with a null speaker id never groups", () => {
    const out = groupStageLines(
      [say(null, "someone", "speech", "One."), say(null, "someone", "speech", "Two.")],
      face,
    );
    expect(out).toHaveLength(2);
  });

  it("draws one face per run, resolved from the speaker id", () => {
    const out = groupStageLines(
      [say(MARA, "Mara", "speech", "One."), say(MARA, "Mara", "speech", "Two.")],
      face,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.who === "world" && out[0]!.face).toBe(`/face/${MARA}`);
  });

  it("renders nothing for an empty transcript", () => {
    expect(groupStageLines([], face)).toEqual([]);
  });
});
