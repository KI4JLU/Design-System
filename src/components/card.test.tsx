import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardBand, CardContent, CardFooter, CardHairline, CardMetaItem, CardMetaLabel, CardMetaList, CardMetaValue, CardTitle } from "./card";
import { legibleColor, onColor } from "../lib/legible-color";
import { cardGlowColor } from "./card-variants";

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
    expect(screen.getByTestId("card")).toHaveClass("border-l-4", "border-l-[var(--card-accent,var(--color-primary))]");
  });

  it("combines both variants", () => {
    render(<Card interactive accent data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("hover:border-primary", "border-l-4");
  });
});

/**
 * Oracle: the hairline mockup (JustRAG home, catalog and role cards,
 * 30.10.2026) — the card's colour reaches the band, the rule and the row
 * edge through one custom property, and every part falls back to neutral
 * without it. jsdom applies no Tailwind, so the contract pinned here is the
 * property, the slots and the fallbacks written into the classes; the look is
 * pinned by the `Components/Data Display/Card` stories.
 */
describe("Card hairline parts", () => {
  it("hands accentColor to the parts as --card-accent, made legible, with its on-colour", () => {
    render(<Card accentColor="rgb(1, 2, 3)" data-testid="card" style={{ width: 10 }} />);
    const card = screen.getByTestId("card");
    expect(card.style.getPropertyValue("--card-accent")).toBe(legibleColor("rgb(1, 2, 3)"));
    expect(card.style.getPropertyValue("--card-on-accent")).toBe(onColor("var(--card-accent)"));
    expect(card.style.getPropertyValue("--card-glow")).toBe(cardGlowColor("var(--card-accent)"));
    expect(card.style.width).toBe("10px");
  });

  it("sets no --card-accent without a colour", () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId("card").style.getPropertyValue("--card-accent")).toBe("");
    expect(screen.getByTestId("card").style.getPropertyValue("--card-on-accent")).toBe("");
    expect(screen.getByTestId("card").style.getPropertyValue("--card-glow")).toBe("");
  });

  it("draws the rule in the accent colour, the card's border colour as the fallback", () => {
    render(<CardHairline data-testid="rule" />);
    const cls = screen.getByTestId("rule").className;
    expect(cls).toContain("before:border-t-[color:var(--card-accent,var(--color-outline-variant))]");
    // The fill (the rule's second pixel) only with an accent colour: 1px neutral, 2px coloured.
    expect(cls).toContain("before:bg-[var(--card-accent,transparent)]");
  });

  it("lights the band with the card's glow, the primary colour as the fallback", () => {
    render(<CardBand data-testid="band" />);
    const cls = screen.getByTestId("band").className;
    expect(cls).toContain("[--band-glow:var(--card-glow,color-mix(in_oklch,var(--color-primary)_44%,transparent))]");
    expect(cls).toContain("var(--card-glow-strength)");
    // No grey: the outline colour is not in the band's tint any more.
    expect(cls).not.toContain("linear-gradient(105deg");
  });

  it("renders an item on the rule only when given one", () => {
    const { rerender } = render(<CardHairline data-testid="rule" />);
    expect(screen.getByTestId("rule").childElementCount).toBe(0);
    rerender(<CardHairline data-testid="rule"><span>Verwaltung</span></CardHairline>);
    expect(screen.getByTestId("rule")).toHaveTextContent("Verwaltung");
  });

  it("marks the band and gives its title the band's size", () => {
    render(
      <Card data-testid="card">
        <CardBand data-testid="band"><CardTitle>Test</CardTitle></CardBand>
        <CardHairline />
        <CardContent data-testid="content" />
        <CardFooter data-testid="footer" />
      </Card>,
    );
    expect(screen.getByTestId("band")).toHaveAttribute("data-slot", "card-band");
    expect(screen.getByText("Test")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByTestId("band").className).toContain("*:data-[slot=card-title]:text-lg");
    // One line, cut with an ellipsis: a long title never makes the band higher.
    expect(screen.getByTestId("band").className).not.toContain("line-clamp");
    expect(screen.getByText("Test").className).toContain("truncate");
    // … and scrolls to its end under the pointer; outside a band a title wraps as before.
    expect(screen.getByText("Test").className).toContain("group-hover/card:indent-[calc(-1*var(--scrolling-text-overflow,0px))]");
    render(<CardTitle>Frei</CardTitle>);
    expect(screen.getByText("Frei").className).not.toContain("truncate");
    // A hairline card is a column with its footer at the bottom; other cards keep their layout.
    expect(screen.getByTestId("card").className).toContain("has-[>[data-slot=card-band]]:flex-col");
    expect(screen.getByTestId("footer").className).toContain("group-has-[>[data-slot=card-band]]/card:mt-auto");
  });

  it("colours the accent edge with the card's colour, primary as the fallback", () => {
    render(<Card accent tint accentColor="red" data-testid="card" />);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("border-l-4", "border-l-[var(--card-accent,var(--color-primary))]");
    expect(card.className).toContain("color-mix(in_oklab,var(--card-accent)_9%");
  });

  it("is not a flex container by itself", () => {
    render(<Card data-testid="card" className="flex-row" />);
    expect(screen.getByTestId("card").className).not.toMatch(/(^|\s)flex-col(\s|$)/);
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

/**
 * Oracle: the JustRAG topic card's meta block (KI-848; the role line,
 * 27.11.2026) — icon, muted label, semibold value, one fact per line. jsdom
 * applies no Tailwind, so this pins the slots and the classes that carry the
 * contract; the sizes and the ellipsis are checked in the browser by the
 * HairlineMetaItems story.
 */
describe("CardMetaItem", () => {
  it("stacks items in a list and gives each part its slot", () => {
    render(
      <CardMetaList data-testid="list">
        <CardMetaItem data-testid="item">
          <svg data-testid="icon" aria-hidden="true" />
          <CardMetaLabel>Genutzt</CardMetaLabel>
          <CardMetaValue>vor 2 Stunden</CardMetaValue>
        </CardMetaItem>
      </CardMetaList>,
    );
    expect(screen.getByTestId("list")).toHaveAttribute("data-slot", "card-meta-list");
    expect(screen.getByTestId("list")).toHaveClass("flex-col");
    expect(screen.getByTestId("item")).toHaveAttribute("data-slot", "card-meta-item");
    expect(screen.getByTestId("item")).toHaveClass("text-on-surface-variant", "[&>svg]:size-4", "[&>svg]:shrink-0");
    expect(screen.getByText("Genutzt")).toHaveAttribute("data-slot", "card-meta-label");
    expect(screen.getByText("Genutzt")).toHaveClass("shrink-0");
    expect(screen.getByText("vor 2 Stunden")).toHaveAttribute("data-slot", "card-meta-value");
    expect(screen.getByText("vor 2 Stunden")).toHaveClass("truncate", "font-semibold", "text-on-surface");
  });

  it("marks the tone on the item, neutral by default, and colours a primary item's icon and value", () => {
    render(
      <>
        <CardMetaItem data-testid="plain"><CardMetaValue>vor 2 Stunden</CardMetaValue></CardMetaItem>
        <CardMetaItem tone="primary" data-testid="role"><CardMetaLabel>Du bist</CardMetaLabel><CardMetaValue>Admin</CardMetaValue></CardMetaItem>
      </>,
    );
    expect(screen.getByTestId("plain")).toHaveAttribute("data-tone", "neutral");
    expect(screen.getByTestId("role")).toHaveAttribute("data-tone", "primary");
    expect(screen.getByTestId("role")).toHaveClass("data-[tone=primary]:[&>svg]:text-primary");
    expect(screen.getByText("Admin")).toHaveClass("group-data-[tone=primary]/card-meta-item:text-primary");
    expect(screen.getByText("Du bist").className).not.toContain("text-primary");
  });
});
