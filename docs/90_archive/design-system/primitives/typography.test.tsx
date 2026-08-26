import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Heading } from "./Heading";
import { Text } from "./Text";

describe("typography", () => {
  it("Heading renders the requested level with display class", () => {
    const { getByRole } = render(<Heading level={2}>Seren</Heading>);
    const h = getByRole("heading", { level: 2 });
    expect(h).toHaveClass("dc-h", "dc-h--2");
    expect(h).toHaveTextContent("Seren");
  });

  it("Text muted + italic apply modifier classes", () => {
    const { getByText } = render(<Text tone="muted" italic>last known…</Text>);
    expect(getByText("last known…")).toHaveClass("dc-text", "dc-text--muted", "dc-text--italic");
  });
});
