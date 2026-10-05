import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColorSwatch } from "./color-swatch";

describe("ColorSwatch", () => {
  it("is decorative by default", () => {
    render(<ColorSwatch color="var(--color-category-1)" data-testid="swatch" />);
    const swatch = screen.getByTestId("swatch");
    expect(swatch).toHaveAttribute("aria-hidden", "true");
    expect(swatch).not.toHaveAttribute("role");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("becomes a named img with label", () => {
    render(<ColorSwatch color="var(--color-category-2)" label="Sprecher 2" />);
    const swatch = screen.getByRole("img", { name: "Sprecher 2" });
    expect(swatch).not.toHaveAttribute("aria-hidden");
  });

  it("paints the given colour", () => {
    render(<ColorSwatch color="var(--color-category-3)" data-testid="swatch" />);
    expect(screen.getByTestId("swatch").style.backgroundColor).toBe("var(--color-category-3)");
  });

  it("sizes: default 20px, sm 12px", () => {
    const { rerender } = render(<ColorSwatch color="red" data-testid="swatch" />);
    expect(screen.getByTestId("swatch")).toHaveClass("size-5");
    rerender(<ColorSwatch color="red" size="sm" data-testid="swatch" />);
    expect(screen.getByTestId("swatch")).toHaveClass("size-3");
  });
});
