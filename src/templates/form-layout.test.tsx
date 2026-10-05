import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormLayout } from "./form-layout";

const actions = (
  <>
    <button type="button">Abbrechen</button>
    <button type="submit">Speichern</button>
  </>
);

const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe("FormLayout", () => {
  it("defaults to the reading width and the static action row under a rule", () => {
    const { container } = render(
      <FormLayout title="Element-Einstellungen" actions={actions}>
        Felder
      </FormLayout>,
    );
    expect(root(container)).toHaveClass("max-w-(--max-width-container-reading)");
    const row = screen.getByRole("button", { name: "Speichern" }).parentElement!;
    expect(row).toHaveClass("border-t", "flex-col-reverse", "sm:justify-end");
    expect(row).not.toHaveClass("sticky");
    expect(container.querySelector("[data-slot=form-action-bar]")).toBeNull();
  });

  it("puts the actions into a sticky FormActionBar with stickyActions", () => {
    const { container } = render(
      <FormLayout title="Transkription" actions={actions} stickyActions>
        Felder
      </FormLayout>,
    );
    const bar = container.querySelector("[data-slot=form-action-bar]");
    expect(bar).toHaveClass("sticky", "bottom-stack-md");
    expect(bar).toContainElement(screen.getByRole("button", { name: "Speichern" }));
    expect(container.querySelector(".border-t")).toBeNull();
  });

  it("renders no bar when stickyActions is set without actions", () => {
    const { container } = render(<FormLayout title="Transkription" stickyActions />);
    expect(container.querySelector("[data-slot=form-action-bar]")).toBeNull();
  });

  it("takes a Container size", () => {
    const { container } = render(<FormLayout title="Transkription" size="content" />);
    expect(root(container)).toHaveClass("max-w-(--max-width-container-content)");
    expect(root(container)).not.toHaveClass("max-w-(--max-width-container-reading)");
  });
});
