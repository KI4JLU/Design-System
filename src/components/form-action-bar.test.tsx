import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormActionBar } from "./form-action-bar";
import { Button } from "./button";

const actions = (
  <>
    <Button variant="secondary" type="button">
      Abbrechen
    </Button>
    <Button type="submit">Speichern</Button>
  </>
);

const bar = () => document.querySelector("[data-slot=form-action-bar]") as HTMLElement;

describe("FormActionBar", () => {
  it("is sticky at the bottom with an offset, above the content, by default", () => {
    render(<FormActionBar>{actions}</FormActionBar>);
    expect(bar()).toHaveClass("sticky", "bottom-stack-md", "z-10", "shadow-overlay");
  });

  it("renders a static row with sticky={false}", () => {
    render(<FormActionBar sticky={false}>{actions}</FormActionBar>);
    expect(bar()).not.toHaveClass("sticky");
    expect(bar()).not.toHaveClass("z-10");
    expect(bar()).toHaveClass("shadow-card");
  });

  it("keeps the actions in source order: secondary first, primary last", () => {
    render(<FormActionBar>{actions}</FormActionBar>);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Abbrechen", "Speichern"]);
    const group = document.querySelector("[data-slot=form-action-bar-actions]");
    expect(group).toContainElement(buttons[0]);
    // Narrow: reversed visually, so the primary action sits on top.
    expect(group).toHaveClass("flex-col-reverse", "@md:flex-row");
  });

  it("renders the message slot before the actions, only when given", () => {
    const { rerender } = render(
      <FormActionBar message={<span>Speichern fehlgeschlagen</span>}>{actions}</FormActionBar>,
    );
    const message = document.querySelector("[data-slot=form-action-bar-message]")!;
    expect(message).toHaveTextContent("Speichern fehlgeschlagen");
    expect(
      message.compareDocumentPosition(screen.getByRole("button", { name: "Abbrechen" })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    rerender(<FormActionBar message={null}>{actions}</FormActionBar>);
    expect(document.querySelector("[data-slot=form-action-bar-message]")).toBeNull();
  });

  it("passes className and HTML attributes through", () => {
    render(
      <FormActionBar className="mt-4" aria-label="Formularaktionen" role="group">
        {actions}
      </FormActionBar>,
    );
    expect(screen.getByRole("group", { name: "Formularaktionen" })).toHaveClass("mt-4", "sticky");
  });
});
