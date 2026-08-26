import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InputField } from "./InputField";
import { Collapsible } from "./Collapsible";

describe("InputField", () => {
  it("takes its accessible name from label and hands onChange the value, not the event", () => {
    const onChange = vi.fn();
    render(<InputField label="Your action" value="" onChange={onChange} />);

    const field = screen.getByRole("textbox", { name: "Your action" });
    fireEvent.change(field, { target: { value: "I lean on the bar" } });

    expect(onChange).toHaveBeenCalledWith("I lean on the bar");
  });

  it("is single-line by default and a textarea when multiline", () => {
    const { container, rerender } = render(
      <InputField label="One" value="" onChange={() => {}} />,
    );
    expect(container.querySelector("input")).not.toBeNull();
    expect(container.querySelector("textarea")).toBeNull();

    rerender(<InputField label="Many" value="" onChange={() => {}} multiline rows={3} />);
    expect(container.querySelector("textarea")).toHaveAttribute("rows", "3");
  });

  it("disables without dropping its accessible name", () => {
    render(<InputField label="Your action" value="x" onChange={() => {}} disabled />);
    expect(screen.getByRole("textbox", { name: "Your action" })).toBeDisabled();
  });
});

describe("Collapsible", () => {
  it("is closed by default and shows its summary", () => {
    const { container } = render(
      <Collapsible summary="Behind the curtain">
        <p>raw numbers</p>
      </Collapsible>,
    );

    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Behind the curtain")).toBeInTheDocument();
  });

  it("opens when asked to start open", () => {
    const { container } = render(
      <Collapsible summary="Behind the curtain" open>
        <p>raw numbers</p>
      </Collapsible>,
    );
    expect(container.querySelector("details")).toHaveAttribute("open");
  });
});
