import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Star } from "lucide-react";
import { IconTile } from "./icon-tile";

describe("IconTile", () => {
  it("is decorative and carries its tone and size as data attributes", () => {
    const { container } = render(<IconTile tone="warning" size="xl"><Star /></IconTile>);
    const tile = container.querySelector('[data-slot="icon-tile"]')!;
    expect(tile).toHaveAttribute("aria-hidden", "true");
    expect(tile).toHaveAttribute("data-tone", "warning");
    expect(tile).toHaveAttribute("data-size", "xl");
    expect(tile).toHaveClass("bg-warning-container", "size-12");
  });

  it("takes Badge's filled tone for status tones", () => {
    const { container } = render(<IconTile tone="caution"><Star /></IconTile>);
    expect(container.firstChild).toHaveClass("bg-caution-container", "text-on-caution-container");
  });

  it("defaults to the primary tone at md", () => {
    const { container } = render(<IconTile><Star /></IconTile>);
    expect(container.firstChild).toHaveClass("bg-primary-container", "size-9");
  });

  it("is a named image when it stands alone", () => {
    const { getByRole } = render(<IconTile aria-hidden={false} aria-label="Favorit"><Star /></IconTile>);
    expect(getByRole("img", { name: "Favorit" })).toHaveAttribute("data-slot", "icon-tile");
  });

  it("renders onto its child with asChild", () => {
    const { container } = render(<IconTile asChild><div data-testid="own"><Star /></div></IconTile>);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveAttribute("data-slot", "icon-tile");
  });
});
