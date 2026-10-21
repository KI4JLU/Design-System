import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

// Oracle for this file: the WAI-ARIA APG "Disclosure (Show/Hide)" pattern —
// the control is a button, `aria-expanded` reflects the state, `aria-controls`
// names the region, Enter and Space toggle. It is written down outside this
// repo and does not depend on how the component is built.

const renderCollapsible = (props: React.ComponentProps<typeof Collapsible> = {}) =>
  render(
    <Collapsible {...props}>
      <CollapsibleTrigger>Details</CollapsibleTrigger>
      <CollapsibleContent>Verborgener Inhalt</CollapsibleContent>
    </Collapsible>,
  );

describe("Collapsible", () => {
  it("is a button with aria-expanded that shows and hides the content", async () => {
    renderCollapsible();
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Verborgener Inhalt")).not.toBeInTheDocument();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const content = screen.getByText("Verborgener Inhalt");
    expect(trigger).toHaveAttribute("aria-controls", content.id);
    expect(content).toHaveAttribute("data-state", "open");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Verborgener Inhalt")).not.toBeInTheDocument();
  });

  it("toggles from the keyboard with Enter and Space", async () => {
    renderCollapsible();
    const trigger = screen.getByRole("button", { name: "Details" });
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("supports defaultOpen and controlled open with onOpenChange", async () => {
    const { unmount } = renderCollapsible({ defaultOpen: true });
    expect(screen.getByText("Verborgener Inhalt")).toBeInTheDocument();
    unmount();

    const onOpenChange = vi.fn();
    renderCollapsible({ open: false, onOpenChange });
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Controlled and the parent did not apply the change: still closed.
    expect(screen.queryByText("Verborgener Inhalt")).not.toBeInTheDocument();
  });
});
