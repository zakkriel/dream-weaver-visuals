import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParticipantStrip } from "./ParticipantStrip";

const MARA = { id: "2ac70000-0000-0000-0000-0000000000a2", label: "Mara" };
// The seeded tavern really does hold two actors this viewer only knows as "a hooded figure".
const HOODED_A = { id: "2ac70000-0000-0000-0000-0000000000a4", label: "a hooded figure" };
const HOODED_B = { id: "2ac70000-0000-0000-0000-0000000000aa", label: "a hooded figure" };

describe("ParticipantStrip", () => {
  it("renders nothing when nobody is present", () => {
    const { container } = render(<ParticipantStrip participants={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("names a unique participant once, not twice", () => {
    render(<ParticipantStrip participants={[MARA]} onSelect={() => {}} />);
    // The portrait's alt and the visible label used to BOTH land in the accessible name ("Mara Mara").
    expect(screen.getByRole("button", { name: "Mara" })).toBeInTheDocument();
  });

  it("distinguishes identically-labelled participants by position for assistive tech", () => {
    render(
      <ParticipantStrip participants={[MARA, HOODED_A, HOODED_B]} onSelect={() => {}} />,
    );

    expect(screen.getByRole("button", { name: "a hooded figure (1 of 2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "a hooded figure (2 of 2)" })).toBeInTheDocument();
    // Mara does not collide, so she gains no qualifier.
    expect(screen.getByRole("button", { name: "Mara" })).toBeInTheDocument();
  });

  it("leaves the VISIBLE labels exactly as the world said them", () => {
    const { container } = render(<ParticipantStrip participants={[HOODED_A, HOODED_B]} />);
    const labels = Array.from(container.querySelectorAll(".dc-strip__label")).map(
      (e) => e.textContent,
    );
    // Numbering them on screen would invent a distinction the viewer does not perceive (B-1).
    expect(labels).toEqual(["a hooded figure", "a hooded figure"]);
  });

  it("hands the selected participant back with its own id, so callers can tell them apart", () => {
    const onSelect = vi.fn();
    render(<ParticipantStrip participants={[HOODED_A, HOODED_B]} onSelect={onSelect} />);

    screen.getByRole("button", { name: "a hooded figure (2 of 2)" }).click();

    expect(onSelect).toHaveBeenCalledWith(HOODED_B);
  });

  it("rings whoever spoke last, and only them", () => {
    render(<ParticipantStrip participants={[MARA, HOODED_A]} speakingId={MARA.id} onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: "Mara" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /hooded/ })).toHaveAttribute("aria-pressed", "false");
  });
});
