import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "./skeleton";
import { skeletonVariants } from "./skeleton-variants";

describe("Skeleton", () => {
  it("is always hidden from assistive technology", () => {
    const props = { "aria-hidden": false } as unknown as Record<string, never>;
    const { container } = render(<Skeleton {...props} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("defaults to a text line at the height of the text", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveClass(
      "h-lh",
      "rounded-full",
      "bg-clip-content",
      "bg-surface-container-high",
    );
  });

  it("maps block and circle variants", () => {
    const { container, rerender } = render(<Skeleton variant="block" className="h-32" />);
    expect(container.firstElementChild).toHaveClass("rounded-xl", "h-32");
    expect(container.firstElementChild).not.toHaveClass("h-lh");

    rerender(<Skeleton variant="circle" className="size-10" />);
    expect(container.firstElementChild).toHaveClass("rounded-full", "aspect-square", "size-10");
  });

  it("pulses, but not under reduced motion", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveClass("animate-pulse", "motion-reduce:animate-none");
  });

  it("passes layout classes through and forwards the ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Skeleton ref={ref} className="w-2/3" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass("w-2/3");
  });

  it("exposes the classes without React, for HTML built as strings", () => {
    const classes = skeletonVariants({ variant: "text" }).split(" ");
    expect(classes).toEqual(
      expect.arrayContaining(["bg-surface-container-high", "text-transparent", "h-lh"]),
    );
    expect(skeletonVariants()).toBe(skeletonVariants({ variant: "text" }));
  });
});
