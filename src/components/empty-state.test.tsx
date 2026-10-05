import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox } from "lucide-react";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders title and description, title as a paragraph by default", () => {
    render(<EmptyState title="Noch keine Widgets" description="Füge Widgets hinzu." />);
    expect(screen.getByText("Noch keine Widgets").tagName).toBe("P");
    expect(screen.getByText("Füge Widgets hinzu.")).toHaveClass("text-on-surface-variant");
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("renders the title as a heading of the given level", () => {
    render(<EmptyState title="Seite nicht gefunden" headingLevel={1} />);
    expect(screen.getByRole("heading", { level: 1, name: "Seite nicht gefunden" })).toHaveClass(
      "m-0",
    );
  });

  it("hides the icon tile from assistive technology", () => {
    const { container } = render(<EmptyState icon={<Inbox />} title="Leer" />);
    const tile = container.querySelector("[aria-hidden='true']");
    expect(tile).toHaveClass("rounded-full", "bg-surface-container");
    expect(tile?.querySelector("svg")).not.toBeNull();
  });

  it("renders no tile, description or actions when not given", () => {
    const { container } = render(<EmptyState title="Leer" />);
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders actions that stay operable", async () => {
    const onAdd = vi.fn();
    render(
      <EmptyState title="Leer" actions={<Button onClick={onAdd}>Widget hinzufügen</Button>} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Widget hinzufügen" }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("switches spacing and type with size", () => {
    const { container, rerender } = render(<EmptyState title="Leer" />);
    expect(container.firstElementChild).toHaveClass("py-10");
    expect(screen.getByText("Leer")).toHaveClass("text-headline-md-mobile");
    rerender(<EmptyState size="compact" title="Leer" />);
    expect(container.firstElementChild).toHaveClass("p-4");
    expect(screen.getByText("Leer")).toHaveClass("text-sm");
  });

  it("passes className and other attributes to the root", () => {
    const { container } = render(<EmptyState title="Leer" className="min-h-40" data-testid="e" />);
    expect(container.firstElementChild).toHaveClass("min-h-40", "text-center");
    expect(screen.getByTestId("e")).toBe(container.firstElementChild);
  });
});
