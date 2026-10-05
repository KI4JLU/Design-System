import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Separator } from "./separator";

describe("Separator", () => {
  it("is decorative by default: role none, no orientation", () => {
    const { container } = render(<Separator />);
    const line = container.firstElementChild as HTMLElement;
    expect(line).toHaveAttribute("role", "none");
    expect(line).not.toHaveAttribute("aria-orientation");
    expect(screen.queryByRole("separator")).toBeNull();
  });

  it("renders a horizontal hairline in the divider token", () => {
    const { container } = render(<Separator />);
    const line = container.firstElementChild as HTMLElement;
    expect(line).toHaveClass("h-px", "w-full", "bg-outline-variant");
    expect(line).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders a vertical line that stretches in a flex row", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const line = container.firstElementChild as HTMLElement;
    expect(line).toHaveClass("w-px", "self-stretch");
    expect(line).not.toHaveClass("h-px");
  });

  it("is a semantic separator with orientation when not decorative", () => {
    render(<Separator decorative={false} orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("announces horizontal orientation explicitly too", () => {
    render(<Separator decorative={false} />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("passes className through for layout", () => {
    const { container } = render(<Separator className="my-3" />);
    expect(container.firstElementChild).toHaveClass("my-3", "bg-outline-variant");
  });
});
