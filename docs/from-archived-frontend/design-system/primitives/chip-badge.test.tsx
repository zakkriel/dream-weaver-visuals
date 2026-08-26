import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Chip } from "./Chip";
import { Badge } from "./Badge";

describe("chip + badge", () => {
  it("Chip with href renders a link", () => {
    const { getByRole } = render(<Chip href="#/locations/x">Dawnfall Market</Chip>);
    const a = getByRole("link", { name: /Dawnfall Market/ });
    expect(a).toHaveClass("dc-chip");
    expect(a).toHaveAttribute("href", "#/locations/x");
  });

  it("Chip without href renders a span", () => {
    const { getByText } = render(<Chip>Silver coin pouch</Chip>);
    expect(getByText("Silver coin pouch").tagName).toBe("SPAN");
  });

  it("Badge applies status modifier", () => {
    const { getByText } = render(<Badge status="high">High</Badge>);
    expect(getByText("High")).toHaveClass("dc-badge", "dc-badge--high");
  });
});
