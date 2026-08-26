import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuxIntent } from "./AuxIntent";

describe("AuxIntent — the Intent lens", () => {
  it("numbers the units in the chain's own order and reads back the player's words", () => {
    const { container } = render(
      <AuxIntent
        units={[
          { kind: "QUERY", stated: "look at the bar" },
          { kind: "Communicated", stated: "ask Mara about the courier" },
        ]}
      />,
    );

    const items = container.querySelectorAll(".dc-intent__unit");
    expect(items).toHaveLength(2);
    // The ordinal is the chain's order made visible, not a ranking this lens invented.
    expect(items[0].textContent).toContain("1");
    expect(items[1].textContent).toContain("2");
    expect(items[0].textContent).toContain("look at the bar");
    expect(items[1].textContent).toContain("ask Mara about the courier");
  });

  it("speaks story language and never the engine's own tag (F-2)", () => {
    const { container } = render(
      <AuxIntent units={[{ kind: "OwnershipAccessChanged", stated: "I hand Mara the note" }]} />,
    );

    expect(screen.getByText("Give or grant something")).toBeInTheDocument();
    expect(container.textContent).not.toContain("OwnershipAccessChanged");
  });

  it("carries an out-of-contract kind with no phrase rather than echoing the token", () => {
    const { container } = render(<AuxIntent units={[{ kind: "Teleported", stated: "I blink out" }]} />);

    expect(container.textContent).not.toContain("Teleported");
    // The player's own words survive — absence over invention, nothing lost.
    expect(screen.getByText("I blink out")).toBeInTheDocument();
  });

  it("names the phrase it could not pin, and never a candidate id", () => {
    const { container } = render(
      <AuxIntent units={[{ kind: "UNRESOLVED", stated: "I look at her", reference: "her" }]} />,
    );

    expect(screen.getByText(/Not sure who or what you meant by “her”/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/);
  });

  it("says so when a beat read as nothing actionable, rather than showing an empty panel", () => {
    render(<AuxIntent units={[]} />);
    expect(screen.getByText(/Nothing in that read as something you could do/)).toBeInTheDocument();
  });

  it("offers no edit affordance at all — per-unit correction has no endpoint", () => {
    const { container } = render(
      <AuxIntent
        units={[
          { kind: "QUERY", stated: "look at the bar" },
          { kind: "Communicated", stated: "greet Mara" },
        ]}
      />,
    );

    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
  });

  it("renders no confidence reading, because the payload carries none", () => {
    const { container } = render(<AuxIntent units={[{ kind: "QUERY", stated: "look around" }]} />);
    expect(container.textContent).not.toMatch(/confiden|%/i);
  });
});
