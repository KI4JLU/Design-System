import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Shimmer } from "./shimmer";

describe("Shimmer", () => {
  it("renders its text in a paragraph by default", () => {
    render(<Shimmer>Denke nach …</Shimmer>);
    const el = screen.getByText("Denke nach …");
    expect(el.tagName).toBe("P");
    expect(el).toHaveClass("animate-shimmer", "bg-clip-text", "text-transparent");
  });

  it("renders the element given by `as`", () => {
    render(<Shimmer as="span">Suche</Shimmer>);
    expect(screen.getByText("Suche").tagName).toBe("SPAN");
  });

  // Oracle: the band half-width is text length × spread. "Denke nach …" is
  // 12 characters (counted by hand), so 12 × 3 = 36px.
  it("scales the band with text length and spread, and sets the duration", () => {
    render(
      <Shimmer spread={3} duration={1.5}>
        Denke nach …
      </Shimmer>,
    );
    const el = screen.getByText("Denke nach …");
    expect(el.style.getPropertyValue("--shimmer-spread")).toBe("36px");
    expect(el.style.getPropertyValue("--shimmer-duration")).toBe("1.5s");
  });

  it("passes through attributes for live-region use", () => {
    render(
      <Shimmer role="status" aria-live="polite">
        Denke nach …
      </Shimmer>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Denke nach …");
  });
});
