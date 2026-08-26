import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DayTimeChip } from "./DayTimeChip";
import { PortraitFrame } from "./PortraitFrame";
import { ImageSlot } from "./ImageSlot";

describe("media atoms", () => {
  it("DayTimeChip renders exactly the provided label", () => {
    const { getByText } = render(<DayTimeChip label="Day 3 · Morning" />);
    expect(getByText("Day 3 · Morning")).toBeInTheDocument();
  });

  it("PortraitFrame marks the active portrait", () => {
    const { getByTestId } = render(
      <PortraitFrame src="/s.png" alt="Seren" active data-testid="p" />,
    );
    expect(getByTestId("p")).toHaveClass("dc-portrait--active");
  });

  // Wherever the subject's name is already adjacent text — a narration card's speaker line — the face
  // is decorative. A silhouette that kept `role="img"` with an empty name would be an unlabelled image
  // in the tree, which is worse than no image at all.
  it("PortraitFrame with an empty alt is decorative, silhouette included", () => {
    const { container } = render(<PortraitFrame alt="" />);
    const empty = container.querySelector(".dc-portrait__empty")!;
    expect(empty).toHaveAttribute("aria-hidden", "true");
    expect(empty).not.toHaveAttribute("role");
  });

  it("ImageSlot shows placeholder first, then swaps on load (D-8)", () => {
    const { container, getByAltText } = render(<ImageSlot src="/art.png" alt="Scene" />);
    const wrap = container.querySelector(".dc-imageslot")!;
    expect(wrap).not.toHaveClass("dc-imageslot--loaded"); // placeholder state
    fireEvent.load(getByAltText("Scene"));
    expect(wrap).toHaveClass("dc-imageslot--loaded");
  });
});
