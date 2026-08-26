import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("renders an svg using currentColor", () => {
    const { container } = render(<Icon name="search" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute("stroke")).toBe("currentColor");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("labelled icon is an accessible image", () => {
    const { getByRole } = render(<Icon name="gem" label="Known" />);
    expect(getByRole("img", { name: "Known" })).toBeInTheDocument();
  });
});
