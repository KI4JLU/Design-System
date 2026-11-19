import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, SkeletonText } from "./skeleton";

describe("Skeleton", () => {
  it("is decoration: hidden from assistive technology", () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    const el = container.querySelector('[data-slot="skeleton"]')!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("h-4", "w-10", "animate-skeleton-pulse");
  });

  it("shimmers instead of pulsing with `shimmer`", () => {
    const { container } = render(<Skeleton shimmer />);
    const el = container.querySelector('[data-slot="skeleton"]')!;
    expect(el).toHaveClass("animate-skeleton-shimmer");
    expect(el).not.toHaveClass("animate-skeleton-pulse");
  });

  it("hands `delay` to the animation and keeps the caller's style", () => {
    const { container } = render(<Skeleton delay={300} style={{ width: 40 }} />);
    const el = container.querySelector<HTMLElement>('[data-slot="skeleton"]')!;
    expect(el.style.animationDelay).toBe("300ms, 0s");
    expect(el.style.width).toBe("40px");
  });

  it("sets no delay when none is asked for", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector<HTMLElement>('[data-slot="skeleton"]')!.style.animationDelay).toBe("");
  });
});

describe("SkeletonText", () => {
  it("keeps the text in place but out of reach", () => {
    render(<SkeletonText shimmer align="center" delay={200}><h2>Titel</h2></SkeletonText>);
    expect(screen.queryByRole("heading")).toBeNull();
    const wrapper = screen.getByText("Titel").closest<HTMLElement>('[data-slot="skeleton-text"]')!;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper).toHaveAttribute("inert");
    expect(wrapper).toHaveAttribute("data-shimmer");
    expect(wrapper).toHaveAttribute("data-align", "center");
    expect(wrapper.style.animationDelay).toBe("200ms, 0s");
  });

  it("pulses and aligns to the start by default", () => {
    render(<SkeletonText><p>Text</p></SkeletonText>);
    const wrapper = screen.getByText("Text").closest('[data-slot="skeleton-text"]')!;
    expect(wrapper).not.toHaveAttribute("data-shimmer");
    expect(wrapper).toHaveAttribute("data-align", "start");
  });
});
