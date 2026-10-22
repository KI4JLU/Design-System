import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

// Oracle for this file: the registry source of shadcn/ui's `collapsible`
// (https://ui.shadcn.com/r/styles/new-york-v4/collapsible.json) — each part
// adds a `data-slot` and forwards everything else to Radix Collapsible — and
// Radix Collapsible's documented behaviour (closed content is not mounted,
// the trigger carries aria-expanded). Neither is derived from this repo.
describe("Collapsible", () => {
  function renderCollapsible(props: { defaultOpen?: boolean } = {}) {
    return render(
      <Collapsible data-testid="root" {...props}>
        <CollapsibleTrigger>Mehr</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">Inhalt</CollapsibleContent>
      </Collapsible>,
    );
  }

  it("marks every part with its data-slot", () => {
    renderCollapsible({ defaultOpen: true });
    expect(screen.getByTestId("root")).toHaveAttribute("data-slot", "collapsible");
    expect(screen.getByRole("button", { name: "Mehr" })).toHaveAttribute(
      "data-slot",
      "collapsible-trigger",
    );
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "collapsible-content");
  });

  it("is closed by default and does not mount the closed content", () => {
    renderCollapsible();
    expect(screen.getByRole("button", { name: "Mehr" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Inhalt")).not.toBeInTheDocument();
  });

  it("toggles open and closed from the trigger", () => {
    renderCollapsible();
    const trigger = screen.getByRole("button", { name: "Mehr" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Inhalt")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
