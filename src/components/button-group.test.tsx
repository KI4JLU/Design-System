import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group";
import { Separator } from "./separator";
import { Button } from "./button";
import { buttonVariants } from "./button-variants";

// Oracles for this file:
// - shadcn/ui's registry source of `button-group` and `separator`
//   (https://ui.shadcn.com/r/styles/new-york-v4/{button-group,separator}.json,
//   the revisions the shadcn CLI installed): `ButtonGroup` is a `role="group"`
//   div with `data-slot="button-group"` and `data-orientation`; vertical stacks
//   (`flex-col`); `ButtonGroupText` is a div, or its child with `asChild`;
//   `ButtonGroupSeparator` is a Separator, vertical by default; `Separator`
//   defaults to horizontal and decorative.
// - Radix Separator's documented semantics, independent of both files:
//   decorative → `role="none"`; otherwise `role="separator"`, with
//   `aria-orientation` only when vertical.
// - DS fixes: `data-orientation` states the orientation that is in effect
//   (horizontal by default, the cva default); a text segment uses the type of
//   the Button recipe it sits next to (`buttonVariants`' typography classes).
describe("ButtonGroup", () => {
  it("is a role=group carrying its orientation", () => {
    render(
      <ButtonGroup aria-label="Ansicht" orientation="vertical">
        <Button variant="outline">Liste</Button>
        <Button variant="outline">Raster</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Ansicht" });
    expect(group).toHaveAttribute("data-slot", "button-group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group).toHaveClass("flex-col");
  });

  it("states the default horizontal orientation in data-orientation (fix #17)", () => {
    render(
      <ButtonGroup aria-label="Ansicht">
        <Button variant="outline">Liste</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Ansicht" });
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).not.toHaveClass("flex-col");
  });

  it("ButtonGroupText renders a div, or its child with asChild", () => {
    render(
      <>
        <ButtonGroupText>Seite</ButtonGroupText>
        <ButtonGroupText asChild>
          <label htmlFor="x">Feld</label>
        </ButtonGroupText>
      </>,
    );
    expect(screen.getByText("Seite").tagName).toBe("DIV");
    expect(screen.getByText("Feld").tagName).toBe("LABEL");
  });

  it("ButtonGroupText uses the Button recipe's typography (fix #19)", () => {
    render(<ButtonGroupText>Seite</ButtonGroupText>);
    const typography = buttonVariants()
      .split(" ")
      .filter((c) => /^(font|text)-label/.test(c));
    expect(typography.length).toBeGreaterThan(0);
    expect(screen.getByText("Seite")).toHaveClass(...typography);
    expect(screen.getByText("Seite")).not.toHaveClass("text-sm");
  });

  it("ButtonGroupSeparator is vertical and decorative by default", () => {
    render(<ButtonGroupSeparator data-testid="sep" />);
    const sep = screen.getByTestId("sep");
    expect(sep).toHaveAttribute("data-slot", "button-group-separator");
    expect(sep).toHaveAttribute("data-orientation", "vertical");
    expect(sep).toHaveAttribute("role", "none");
  });
});

describe("Separator", () => {
  it("is horizontal and decorative by default", () => {
    render(<Separator data-testid="sep" />);
    const sep = screen.getByTestId("sep");
    expect(sep).toHaveAttribute("data-orientation", "horizontal");
    expect(sep).toHaveAttribute("role", "none");
  });

  it("is a separator in the accessibility tree when not decorative", () => {
    render(<Separator decorative={false} orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });
});
