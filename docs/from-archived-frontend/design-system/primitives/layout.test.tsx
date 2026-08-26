import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Stack } from "./Stack";
import { Inline } from "./Inline";

describe("layout primitives", () => {
  it("Stack is a column with token gap", () => {
    const { getByTestId } = render(<Stack gap={5} data-testid="s">x</Stack>);
    const el = getByTestId("s");
    expect(el).toHaveStyle({ display: "flex", flexDirection: "column" });
    expect(el.style.gap).toBe("var(--dc-space-5)");
  });

  it("Inline is a row with token gap", () => {
    const { getByTestId } = render(<Inline gap={2} data-testid="i">x</Inline>);
    const el = getByTestId("i");
    expect(el).toHaveStyle({ display: "flex", flexDirection: "row" });
    expect(el.style.gap).toBe("var(--dc-space-2)");
  });
});
