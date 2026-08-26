import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarryingOverlay, type CarriedRow } from "./CarryingOverlay";

const note: CarriedRow = {
  id: "2a7f0000-0000-0000-0000-0000000000b1",
  label: "Sealed Note (gray wax)",
  state: "carried",
  container: null,
  preview: null,
  decay: { stale: false, last_confirmed_label: null },
  href: "#/w/w1/artifacts/2a7f0000-0000-0000-0000-0000000000b1",
};

describe("CarryingOverlay — what I have on me (Artifacts AC#1/AC#3)", () => {
  it("names each thing and links it to its own record", () => {
    render(<CarryingOverlay items={[note]} open />);
    const link = screen.getByRole("link", { name: "Sealed Note (gray wax)" });
    expect(link).toHaveAttribute("href", note.href);
  });

  // The PRD sketches per-item verbs (Read, Draw, Count) and requires them to be CONTEXTUAL. `carrying/1`
  // ships no `contextual_actions`, so a verb here would be the client deciding what the world allows
  // (D-14, D-7). The link to the full record is the one affordance the schema itself sanctions.
  it("draws no action affordances, because the payload carries none", () => {
    render(<CarryingOverlay items={[note]} open />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(1);
    expect(screen.queryByText(/inspect|use|read|draw|count|put away|hide/i)).toBeNull();
  });

  // An empty hand is an answer the payload gives deliberately, not a failed load.
  it("says so out loud when you are carrying nothing", () => {
    render(<CarryingOverlay items={[]} open />);
    expect(screen.getByText("You have nothing on you.")).toBeInTheDocument();
  });

  // AC#3: a stale carry state renders decay language and never disappears.
  it("keeps a stale thing on the list and says it is unconfirmed", () => {
    render(
      <CarryingOverlay
        items={[{ ...note, decay: { stale: true, last_confirmed_label: "Arrival" } }]}
        open
      />,
    );
    expect(screen.getByRole("link", { name: "Sealed Note (gray wax)" })).toBeInTheDocument();
    expect(screen.getByText(/last known — not confirmed since Arrival/)).toBeInTheDocument();
  });

  it("never prints a tick — in-world labels only (B-5)", () => {
    const { container } = render(
      <CarryingOverlay
        items={[{ ...note, decay: { stale: true, last_confirmed_label: "Arrival" } }]}
        open
      />,
    );
    expect(container.textContent).not.toMatch(/\b\d{2,}\b/);
  });

  // `state` is deliberately not enum-pinned upstream. While every row reads the same, the panel title
  // already says it; the word only earns its place once two states coexist.
  it("stays silent about a state every row shares, and names them once they differ", () => {
    const { container, rerender } = render(<CarryingOverlay items={[note, { ...note, id: "b2" }]} open />);
    expect(container.textContent).not.toContain("carried");

    rerender(
      <CarryingOverlay items={[note, { ...note, id: "b2", state: "worn" }]} open />,
    );
    expect(screen.getByText("carried")).toBeInTheDocument();
    expect(screen.getByText("worn")).toBeInTheDocument();
  });

  // An unrecognised value must pass straight through: the value set widens in place upstream and this
  // client must never hold an allowlist of it.
  it("renders a state it has never heard of, verbatim", () => {
    render(
      <CarryingOverlay
        items={[note, { ...note, id: "b2", state: "strapped_to_your_back" }]}
        open
      />,
    );
    expect(screen.getByText("strapped_to_your_back")).toBeInTheDocument();
  });

  it("says where a nested thing is kept", () => {
    render(<CarryingOverlay items={[{ ...note, container: "coin pouch" }]} open />);
    expect(screen.getByText("in your coin pouch")).toBeInTheDocument();
  });

  it("shows the quick preview when the viewer has learned anything about the thing", () => {
    render(<CarryingOverlay items={[{ ...note, preview: "Sealed with dark wax. No markings." }]} open />);
    expect(screen.getByText("Sealed with dark wax. No markings.")).toBeInTheDocument();
  });
});
