import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarCardGroup, SidebarCardPreview, SidebarSection } from "./sidebar-section";

/*
 * Oracle: the component's contract — the heading folds the section
 * (aria-expanded, onOpenChange); an open section without rows shows `empty`;
 * `renaming` turns the heading into a field, and `onRename` gets the trimmed
 * new name, or null when nothing is to be saved.
 */
describe("SidebarSection", () => {
  it("folds from its heading and shows its rows only while open", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ul>
        <SidebarSection label="Angepinnt" open onOpenChange={onOpenChange}>
          <p>Zeile</p>
        </SidebarSection>
      </ul>,
    );
    const toggle = screen.getByRole("button", { name: "Angepinnt" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Angepinnt");
    await userEvent.click(toggle);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    rerender(
      <ul>
        <SidebarSection label="Angepinnt" open={false} onOpenChange={onOpenChange}>
          <p>Zeile</p>
        </SidebarSection>
      </ul>,
    );
    expect(screen.queryByText("Zeile")).toBeNull();
    expect(screen.getByRole("button", { name: "Angepinnt" })).toHaveAttribute("aria-expanded", "false");
  });

  it("says so when it is open and holds nothing, and not when it is folded", () => {
    const { rerender } = render(<ul><SidebarSection label="Arbeit" empty="Hier ist noch nichts">{false}</SidebarSection></ul>);
    expect(screen.getByText("Hier ist noch nichts")).toBeInTheDocument();
    rerender(<ul><SidebarSection label="Arbeit" open={false} empty="Hier ist noch nichts">{false}</SidebarSection></ul>);
    expect(screen.queryByText("Hier ist noch nichts")).toBeNull();
    rerender(<ul><SidebarSection label="Arbeit" empty="Hier ist noch nichts"><p>Zeile</p></SidebarSection></ul>);
    expect(screen.queryByText("Hier ist noch nichts")).toBeNull();
  });

  it("offers its actions from a menu named by actionsLabel", async () => {
    const onDelete = vi.fn();
    render(
      <ul>
        <SidebarSection label="Arbeit" actionsLabel="Aktionen für Arbeit" actions={[{ label: "Löschen", onSelect: onDelete }]} />
      </ul>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Aktionen für Arbeit" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Löschen" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  describe("renaming in the heading", () => {
    const setup = () => {
      const onRename = vi.fn();
      render(<ul><SidebarSection label="Arbeit" renaming renameLabel="Name des Abschnitts" maxNameLength={60} onRename={onRename} /></ul>);
      return { onRename, field: screen.getByRole("textbox", { name: "Name des Abschnitts" }) as HTMLInputElement };
    };

    it("shows a field holding the name instead of the fold button", () => {
      const { field } = setup();
      expect(field).toHaveValue("Arbeit");
      expect(field).toHaveAttribute("maxlength", "60");
      expect(screen.queryByRole("button", { name: "Arbeit" })).toBeNull();
    });

    it("saves the trimmed name on Enter", async () => {
      const { onRename, field } = setup();
      await userEvent.clear(field);
      await userEvent.type(field, "  Beruf {Enter}");
      expect(onRename).toHaveBeenCalledExactlyOnceWith("Beruf");
    });

    it("keeps the old name on Escape, for an empty name and for an unchanged one", async () => {
      const first = setup();
      await userEvent.type(first.field, "x{Escape}");
      expect(first.onRename).toHaveBeenCalledExactlyOnceWith(null);
    });

    it("saves nothing for an unchanged or an empty name", async () => {
      const unchanged = setup();
      await userEvent.type(unchanged.field, "{Enter}");
      expect(unchanged.onRename).toHaveBeenCalledExactlyOnceWith(null);
    });

    // Oracle: the IME rule — Enter that confirms a composition (keyCode 229) is not „save".
    it("does not save on the Enter that confirms an IME candidate", async () => {
      const { onRename, field } = setup();
      field.focus();
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.keyDown(field, { key: "Enter", keyCode: 229 });
      expect(onRename).not.toHaveBeenCalled();
    });
  });
});

describe("SidebarCardGroup and SidebarCardPreview", () => {
  it("labels a run of rows with a third-level heading, and none without a label", () => {
    const { rerender } = render(<SidebarCardGroup label="Heute"><p>Zeile</p></SidebarCardGroup>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Heute");
    rerender(<SidebarCardGroup><p>Zeile</p></SidebarCardGroup>);
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("shows the full title and its lines", () => {
    render(<SidebarCardPreview title="Ein sehr langer Titel" lines={[{ text: "Meine Themen · Haushalt" }, { text: "Letzte Aktivität: heute" }]} />);
    expect(screen.getByText("Ein sehr langer Titel")).toBeInTheDocument();
    expect(screen.getByText("Meine Themen · Haushalt")).toBeInTheDocument();
    expect(screen.getByText("Letzte Aktivität: heute")).toBeInTheDocument();
  });
});
