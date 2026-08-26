import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourceLine, type EpistemicKind } from "./epistemic";
import { MessageSegment } from "./message";

const KINDS: EpistemicKind[] = [
  "direct",
  "shared",
  "told",
  "overheard",
  "public",
  "rumor",
  "inference",
  "mistaken",
  "confirmed",
  "disputed",
];

describe("epistemic catalog", () => {
  it("gives every canonical kind a label, presented rather than echoed", () => {
    for (const kind of KINDS) {
      const label = (render(<SourceLine kind={kind} />).container.textContent ?? "").trim();
      expect(label).not.toBe("");
      // A raw lowercase enum token is never what the reader sees (F-2).
      expect(label).not.toBe(kind);
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });

  it("expands the tokens a player could not read into phrases", () => {
    // `overheard` or `confirmed` happen to read fine as words; `direct`, `told`, `public` and
    // `inference` do not, and must not be shipped as bare capitalised tokens.
    const expansions: Record<string, RegExp> = {
      direct: /directly observed/i,
      shared: /shared with you/i,
      told: /told by someone/i,
      public: /publicly known/i,
      inference: /inferred/i,
    };
    for (const [kind, expected] of Object.entries(expansions)) {
      const label = render(<SourceLine kind={kind} />).container.textContent ?? "";
      expect(label).toMatch(expected);
    }
  });

  it("renders no source label at all for a kind outside the enum, rather than the raw token", () => {
    // The schemas pin the enum, so this is out-of-contract input: absence beats showing engine
    // vocabulary, and the content/time around it still render.
    const { container } = render(<SourceLine kind="wat" time="Day 3, Morning" />);
    expect(container.textContent).toContain("Day 3, Morning");
    expect(container.textContent).not.toContain("wat");
  });

  it("renders the time label verbatim and never derives one", () => {
    const { container } = render(<SourceLine kind="direct" time="Day 3, Morning" />);
    expect(container.textContent).toContain("Day 3, Morning");
  });

  it("omits the time entirely when the payload has no display label", () => {
    const { container } = render(<SourceLine kind="direct" time={null} />);
    expect(container.textContent).toBe("Directly observed");
  });

  it("speaks decay language when a record is stale, and hides nothing", () => {
    const { container } = render(
      <SourceLine kind="told" time="Day 1" decay={{ stale: true }} />,
    );
    expect(container.textContent).toMatch(/last known/i);
    expect(container.textContent).toContain("Day 1"); // what was known is still shown
  });

  it("names the last confirmation in world time when the payload carries one", () => {
    const { container } = render(
      <SourceLine
        kind="told"
        time="Day 1, Night"
        decay={{ stale: true, last_confirmed_label: "the third bell" }}
      />,
    );
    expect(container.textContent).toContain("not confirmed since the third bell");
    // Still an in-world label, never a clock (B-5).
    expect(container.textContent).not.toMatch(/\d{4}|:\d\d|ago/);
  });

  it("falls back to the sanctioned phrasing when there is no confirmation label", () => {
    const { container } = render(<SourceLine kind="rumor" decay={{ stale: true }} />);
    expect(container.textContent).toContain("you have not confirmed this recently");
  });

  it("says nothing about decay when the record is not stale", () => {
    const { container } = render(
      <SourceLine kind="direct" time="Day 3" decay={{ stale: false, last_confirmed_label: "Day 3" }} />,
    );
    expect(container.textContent).not.toMatch(/last known|confirmed/i);
  });
});

describe("message catalog", () => {
  it("renders narration as world prose with no speaker attribution", () => {
    const { container } = render(
      <MessageSegment kind="narration" speaker="" text="The common room stills." />,
    );
    expect(container.textContent).toBe("The common room stills.");
  });

  it("quotes speech as the speaker's own words, beside their label", () => {
    const { container } = render(
      <MessageSegment kind="speech" speaker="Mara" text="The tide turns at dusk." />,
    );
    expect(container.textContent).toContain("Mara");
    expect(container.textContent).toContain("“The tide turns at dusk.”");
  });

  it("renders an action as an unquoted prose line beside the actor's label", () => {
    const { container } = render(
      <MessageSegment kind="action" speaker="the muscle" text="steps between you and the bar" />,
    );
    expect(container.textContent).toContain("the muscle");
    expect(container.textContent).toContain("steps between you and the bar");
    expect(container.textContent).not.toContain("“");
  });

  it("falls back to plain prose for an unknown kind, inventing no attribution", () => {
    const { container } = render(
      <MessageSegment kind="something_new" speaker="Mara" text="Ash on the wind." />,
    );
    expect(container.textContent).toBe("Ash on the wind.");
  });

  it("wears the speaker's own face when the caller has one to give", () => {
    const { container } = render(
      <MessageSegment
        kind="speech"
        speaker="Mara"
        text="The tide turns at dusk."
        imageSrc="/worlds/w1/images/a2?tier=thumbnail"
      />,
    );
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/worlds/w1/images/a2?tier=thumbnail");
    // Decorative: "Mara" is the very next thing read out, so a labelled face would say it twice.
    expect(img).toHaveAttribute("alt", "");
  });

  it("keeps the silhouette when the world has shown no face (D-8)", () => {
    const { container } = render(
      <MessageSegment kind="action" speaker="the muscle" text="steps between you and the bar" />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".dc-portrait__empty")).not.toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("gives an unattributed line no portrait at all — the narrator has no face", () => {
    const { container } = render(
      <MessageSegment kind="narration" speaker="" text="The common room stills." />,
    );
    expect(container.querySelector(".dc-portrait")).toBeNull();
  });
});
