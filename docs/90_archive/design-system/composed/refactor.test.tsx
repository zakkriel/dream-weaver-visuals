import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NotFound } from "./NotFound";
import { Timeline } from "./Timeline";

describe("refactored composed", () => {
  it("NotFound stays a single identical view (Chunk-4 indistinguishability)", () => {
    const a = render(<NotFound />).container.innerHTML;
    const b = render(<NotFound />).container.innerHTML;
    expect(a).toBe(b);
    expect(a).toMatch(/not found/i);
  });

  it("Timeline renders records in received order (no client sort)", () => {
    const records = [
      { perception_id: "r2", content: "Second", epistemic_type: "Event", display_label: "Day 2" },
      { perception_id: "r1", content: "First", epistemic_type: "Event", display_label: "Day 1" },
    ];
    const { getAllByText } = render(<Timeline records={records} emptyMessage="No records yet." />);
    const order = getAllByText(/First|Second/).map((n) => n.textContent);
    expect(order).toEqual(["Second", "First"]);
  });
});
