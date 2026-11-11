import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Plus } from "lucide-react";
import { SidebarAction } from "./sidebar-action";

/*
 * Oracle: the prop's contract — `trailing` is a sibling AFTER the label, in
 * its own slot, so it is not part of the text that truncates; without the
 * prop the row has no such slot.
 */
describe("SidebarAction trailing", () => {
  it("renders the trailing node after the label, outside it", () => {
    render(
      <SidebarAction icon={<Plus />} trailing={<kbd>K</kbd>}>
        Suchen
      </SidebarAction>,
    );
    const label = screen.getByText("Suchen");
    const hint = screen.getByText("K");
    expect(label).not.toContainElement(hint);
    expect(label.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.closest("[data-slot='sidebar-action-trailing']")).not.toBeNull();
  });

  it("has no trailing slot without the prop", () => {
    const { container } = render(<SidebarAction icon={<Plus />}>Neuer Chat</SidebarAction>);
    expect(container.querySelector("[data-slot='sidebar-action-trailing']")).toBeNull();
  });
});
