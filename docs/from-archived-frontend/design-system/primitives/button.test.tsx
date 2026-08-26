import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("actions", () => {
  it("Button defaults to primary and fires onClick", () => {
    const onClick = vi.fn();
    const { getByRole } = render(<Button onClick={onClick}>Continue</Button>);
    const btn = getByRole("button", { name: "Continue" });
    expect(btn).toHaveClass("dc-btn", "dc-btn--primary");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("Button quiet variant", () => {
    const { getByRole } = render(<Button variant="quiet">Report</Button>);
    expect(getByRole("button")).toHaveClass("dc-btn--quiet");
  });

  it("IconButton requires an accessible label", () => {
    const { getByRole } = render(<IconButton label="Search">{"⌕"}</IconButton>);
    expect(getByRole("button", { name: "Search" })).toHaveClass("dc-iconbtn");
  });
});
