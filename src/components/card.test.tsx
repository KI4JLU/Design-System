import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardCover, CardDescription, CardHeader, CardMeta, CardTitle } from "./card";

describe("Card", () => {
  it("renders the plain surface without interactive/accent classes", () => {
    render(<Card data-testid="card">Inhalt</Card>);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("shadow-card");
    expect(card.className).not.toContain("hover:border-primary");
    expect(card.className).not.toContain("border-l-4");
  });

  it("adds the hover border highlight when interactive, without moving the card", () => {
    render(<Card interactive data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("hover:border-primary");
    expect(card.className).not.toContain("translate");
  });

  it("adds the left accent border when accent", () => {
    render(<Card accent data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveClass("border-l-4", "border-l-primary");
  });

  it("combines both variants", () => {
    render(<Card interactive accent data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("hover:border-primary", "border-l-primary");
  });
});

/**
 * Oracle: the discover-card mockup (JustRAG „Entdecken", 27.10.2026) — a
 * cover band flush with the card's top, then meta line, large title and
 * description. jsdom applies no Tailwind, so the contract pinned here is the
 * one the parts share: the card states its variant, it clips the band, and the
 * band is decorative.
 */
describe("Card variant=discover", () => {
  it("marks the variant and clips the cover band", () => {
    render(
      <Card variant="discover" data-testid="card">
        <CardCover data-testid="cover" style={{ backgroundImage: "linear-gradient(red, blue)" }} />
        <CardHeader>
          <CardMeta>309 Dokumente</CardMeta>
          <CardTitle>Personalrecht kompakt</CardTitle>
          <CardDescription>Beantwortet Fragen …</CardDescription>
        </CardHeader>
      </Card>,
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-variant", "discover");
    expect(card).toHaveClass("overflow-hidden", "group/card");
    const cover = screen.getByTestId("cover");
    expect(cover).toHaveAttribute("aria-hidden", "true");
    expect(cover.style.backgroundImage).toContain("linear-gradient");
    expect(card.firstElementChild).toBe(cover);
  });

  it("enlarges the title only inside a discover card", () => {
    render(<CardTitle>Widget A</CardTitle>);
    expect(screen.getByText("Widget A")).toHaveClass("group-data-[variant=discover]/card:text-display-lg");
  });

  it("is the default variant otherwise", () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveAttribute("data-variant", "default");
    expect(screen.getByTestId("card").className).not.toContain("overflow-hidden");
  });
});

/**
 * Oracle: the accessibility tree (aria-query + dom-accessibility-api through
 * Testing Library's `*ByRole`), i.e. the ARIA in HTML mapping of `h1`–`h6` to
 * `heading` + level. A card title is deliberately **not** in the outline — a
 * grid of cards would otherwise contribute a heading per cell — so „is it a
 * heading" is the property worth pinning, in both directions.
 */
describe("CardTitle — heading semantics are opt-in", () => {
  it("is not a heading by default", () => {
    render(<CardTitle>Widget A</CardTitle>);
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    expect(screen.getByText("Widget A")).toBeInTheDocument();
  });

  it("renders the given element with asChild, so the level is the call site's", () => {
    render(
      <CardTitle asChild>
        <h2>Widget A</h2>
      </CardTitle>,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAccessibleName("Widget A");
    // The type tokens come from CardTitle, not from a copy at the call site.
    expect(heading).toHaveClass("font-headline-md", "text-headline-md");
  });
});
