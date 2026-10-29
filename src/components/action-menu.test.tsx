import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionMenu } from "./action-menu";

describe("ActionMenu", () => {
  it("renders nothing without actions", () => {
    const { container } = render(<ActionMenu actions={[]} label="Aktionen" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("draws its trigger as a ghost button unless a variant is given", () => {
    const { rerender } = render(<ActionMenu actions={[{ label: "A", onSelect: vi.fn() }]} label="Aktionen" />);
    expect(screen.getByRole("button", { name: "Aktionen" })).not.toHaveClass("bg-primary");
    rerender(<ActionMenu actions={[{ label: "A", onSelect: vi.fn() }]} label="Aktionen" variant="default" />);
    expect(screen.getByRole("button", { name: "Aktionen" })).toHaveClass("bg-primary");
  });

  it("opens the menu and runs the chosen action", async () => {
    const onRename = vi.fn();
    render(
      <ActionMenu
        label="Aktionen"
        actions={[
          { label: "Umbenennen", onSelect: onRename },
          { label: "Löschen", onSelect: vi.fn(), destructive: true, separatorBefore: true },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Aktionen" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Umbenennen" }));
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("does not run a disabled action", async () => {
    const onDelete = vi.fn();
    render(<ActionMenu label="Aktionen" actions={[{ label: "Löschen", onSelect: onDelete, disabled: true }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktionen" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Löschen" }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("shows an item's badge at the end of its row, as part of its name", async () => {
    render(<ActionMenu label="Aktionen" actions={[{ label: "Einstellungen", badge: "Admin", onSelect: vi.fn() }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Aktionen" }));
    const item = await screen.findByRole("menuitem", { name: "Einstellungen (Admin)" });
    expect(item.lastElementChild).toHaveTextContent("Admin");
  });

  it("ends an item that leaves the page in a decorative arrow", async () => {
    render(
      <ActionMenu
        label="Aktionen"
        actions={[
          { label: "Umbenennen…", onSelect: vi.fn() },
          { label: "Einstellungen", opensPage: true, onSelect: vi.fn() },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Aktionen" }));
    const item = await screen.findByRole("menuitem", { name: "Einstellungen" });
    expect(item.lastElementChild).toHaveAttribute("data-testid", "action-menu-opens-page");
    expect(item.lastElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("menuitem", { name: "Umbenennen…" }).querySelector('[data-testid="action-menu-opens-page"]')).toBeNull();
  });
});
