import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NavRail } from "./NavRail";
import { ChronicleBar } from "./ChronicleBar";
import { AppShell } from "./AppShell";

const items = [
  { key: "timeline", label: "Timeline", icon: "timeline" as const, href: "#/timeline" },
  { key: "actors", label: "Actors", icon: "actor" as const, href: "#/actors" },
];

describe("shell", () => {
  it("NavRail marks the active item", () => {
    const { getByRole } = render(<NavRail items={items} activeKey="actors" />);
    expect(getByRole("link", { name: /Actors/ })).toHaveClass("dc-navrail__item--active");
  });

  it("ChronicleBar shows breadcrumb + day/time", () => {
    const { getByText } = render(
      <ChronicleBar breadcrumb={<span>Compendium</span>} dayTime="Day 3 · Morning" />,
    );
    expect(getByText("Compendium")).toBeInTheDocument();
    expect(getByText("Day 3 · Morning")).toBeInTheDocument();
  });

  it("renders each named slot it is given, and omits the ones it is not", () => {
    const { container, getByRole, getByText } = render(
      <AppShell
        rail={<NavRail items={items} />}
        bar={<ChronicleBar />}
        scene={<div>scene</div>}
        overlay={<div>overlay</div>}
        aux={<div>aux</div>}
        input={<div>input</div>}
      >
        <p>page</p>
      </AppShell>,
    );
    expect(getByRole("main")).toHaveTextContent("page");
    for (const slot of ["scene", "overlay", "aux", "input"]) {
      expect(getByText(slot)).toBeInTheDocument();
    }
    expect(container.querySelector(".dc-shell__rail")).not.toBeNull();
    expect(container.querySelector(".dc-shell__bar")).not.toBeNull();
  });

  it("omits absent slots entirely rather than rendering empty chrome", () => {
    const { container } = render(
      <AppShell rail={<NavRail items={items} />}>
        <p>page</p>
      </AppShell>,
    );
    for (const cls of [".dc-shell__bar", ".dc-shell__scene", ".dc-shell__aux", ".dc-shell__input"]) {
      expect(container.querySelector(cls)).toBeNull();
    }
  });

  it("presents the SAME aux node docked or full-screen — one component, not two (SPEC-023)", () => {
    const aux = <div>lens</div>;
    const docked = render(<AppShell aux={aux} auxMode="docked" />);
    const full = render(<AppShell aux={aux} auxMode="full" />);

    // Same rendered aux subtree in both presentations; only the grid modifier differs.
    expect(docked.container.querySelector(".dc-shell__aux")?.innerHTML).toBe(
      full.container.querySelector(".dc-shell__aux")?.innerHTML,
    );
    expect(docked.container.querySelector(".dc-shell__grid--aux-docked")).not.toBeNull();
    expect(full.container.querySelector(".dc-shell__grid--aux-full")).not.toBeNull();
  });

  it("draws world art as a backdrop behind the chrome, hidden from assistive tech", () => {
    const { container } = render(<AppShell backdrop="/scene.png" />);
    const backdrop = container.querySelector(".dc-shell__backdrop");
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    expect(backdrop).toHaveStyle({ backgroundImage: "url(/scene.png)" });
  });
});
