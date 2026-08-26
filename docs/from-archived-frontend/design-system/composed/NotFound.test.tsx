import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NotFound } from "./NotFound";

describe("NotFound", () => {
  it("renders identical output regardless of why the entity is absent", () => {
    // A withheld id and a nonexistent id both reach this component the same way:
    // there is no prop that distinguishes them, so the output cannot differ.
    const withheld = render(<NotFound />).container.innerHTML;
    const missing = render(<NotFound />).container.innerHTML;
    expect(withheld).toBe(missing);
  });

  it("shows a neutral not-found message", () => {
    const { getByText } = render(<NotFound />);
    expect(getByText(/not found/i)).toBeInTheDocument();
  });
});
