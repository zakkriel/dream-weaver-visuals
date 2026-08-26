import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Panel, Card } from "./Panel";
import { Divider } from "./Divider";

describe("surfaces", () => {
  it("Panel renders its title and children", () => {
    const { getByText } = render(<Panel title="Collected knowledge">body</Panel>);
    expect(getByText("Collected knowledge")).toHaveClass("dc-panel__title");
    expect(getByText("body")).toBeInTheDocument();
  });

  it("Card is a Panel", () => {
    expect(Card).toBe(Panel);
  });

  it("Divider renders a separator", () => {
    const { getByRole } = render(<Divider />);
    expect(getByRole("separator")).toHaveClass("dc-divider");
  });
});
