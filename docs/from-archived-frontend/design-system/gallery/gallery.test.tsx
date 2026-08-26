import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Gallery } from "./Gallery";

describe("Gallery", () => {
  beforeEach(() => { delete document.documentElement.dataset.skin; });

  it("renders a skin switcher that re-skins the document", () => {
    const { getByLabelText } = render(<Gallery />);
    const select = getByLabelText("Skin") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "fantasy" } });
    expect(document.documentElement.dataset.skin).toBe("fantasy");
  });
});
