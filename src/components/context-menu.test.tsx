import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "./context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "./dropdown-menu";

// Oracles for this file, independent of the DS file:
// - shadcn/ui's registry source of `context-menu`
//   (https://ui.shadcn.com/r/styles/new-york-v4/context-menu.json, the
//   revision the shadcn CLI installed): every part carries a `data-slot`;
//   `ContextMenuItem` sets `data-variant` (default "default") and `data-inset`.
// - Radix ContextMenu's documented behaviour (@radix-ui/react-context-menu):
//   opens on the `contextmenu` event (right-click, the context-menu key) and on
//   a touch long-press (pointer held ~700 ms without moving); the content is a
//   `role="menu"` with `menuitem`s; selecting an item fires `onSelect` and
//   closes; Escape closes; a checkbox item is `menuitemcheckbox` with
//   `aria-checked`.
function Subject(props: { onCopy?: () => void; onCheckedChange?: (v: boolean) => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>Antwort</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Antwort</ContextMenuLabel>
        <ContextMenuItem onSelect={props.onCopy}>
          Kopieren
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>Bearbeiten</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={false} onCheckedChange={props.onCheckedChange}>
          Als hilfreich markieren
        </ContextMenuCheckboxItem>
        <ContextMenuItem variant="destructive">Löschen</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const trigger = () => screen.getByText("Antwort", { selector: "[data-slot=context-menu-trigger]" });

describe("ContextMenu", () => {
  afterEach(() => vi.useRealTimers());

  it("is closed until opened", () => {
    render(<Subject />);
    expect(trigger()).toHaveAttribute("data-state", "closed");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens on the contextmenu event (right-click) with its items", () => {
    render(<Subject />);
    fireEvent.contextMenu(trigger());
    expect(screen.getByRole("menu")).toHaveAttribute("data-slot", "context-menu-content");
    expect(trigger()).toHaveAttribute("data-state", "open");
    expect(screen.getByRole("menuitem", { name: /Kopieren/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: "Als hilfreich markieren" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("opens on a touch long-press, not on a short touch", () => {
    vi.useFakeTimers();
    render(<Subject />);
    fireEvent.pointerDown(trigger(), { pointerType: "touch", clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(300));
    fireEvent.pointerUp(trigger(), { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.pointerDown(trigger(), { pointerType: "touch", clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("fires onSelect and closes when an item is chosen", async () => {
    const onCopy = vi.fn();
    render(<Subject onCopy={onCopy} />);
    fireEvent.contextMenu(trigger());
    await userEvent.click(screen.getByRole("menuitem", { name: /Kopieren/ }));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<Subject />);
    fireEvent.contextMenu(trigger());
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("reports a checkbox item's toggle", async () => {
    const onCheckedChange = vi.fn();
    render(<Subject onCheckedChange={onCheckedChange} />);
    fireEvent.contextMenu(trigger());
    await userEvent.click(screen.getByRole("menuitemcheckbox", { name: "Als hilfreich markieren" }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("marks parts with data-slot, items with data-variant and data-inset", () => {
    render(<Subject />);
    fireEvent.contextMenu(trigger());
    expect(trigger()).toHaveAttribute("data-slot", "context-menu-trigger");
    const copy = screen.getByRole("menuitem", { name: /Kopieren/ });
    expect(copy).toHaveAttribute("data-slot", "context-menu-item");
    expect(copy).toHaveAttribute("data-variant", "default");
    expect(screen.getByRole("menuitem", { name: "Bearbeiten" })).toHaveAttribute("data-inset", "true");
    expect(screen.getByRole("menuitem", { name: "Löschen" })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
    expect(screen.getByText("⌘C")).toHaveAttribute("data-slot", "context-menu-shortcut");
  });
});

// DS fixes, each checked against the defect:
// - UI Events / ARIA APG: the context-menu key (and Shift+F10 on Windows/Linux)
//   dispatches `contextmenu` on the FOCUSED element — a consumer's own
//   focusable trigger must receive it.
// - A long-press on touch must not also start a text selection / the iOS
//   callout; a mouse keeps selecting text.
// - COMPONENT_GUIDELINES rule 3: no manual `dark:` colour variants.
// - DropdownMenu is the DS menu reference: same disabled dimming.
const classesOf = (el: Element) => (el.getAttribute("class") ?? "").split(/\s+/);

describe("ContextMenu DS fixes", () => {
  it("takes a consumer's focusable element as trigger via asChild; contextmenu on it opens (fix #1)", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button">Antwort-Aktionen</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Kopieren</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    const button = screen.getByRole("button", { name: "Antwort-Aktionen" });
    expect(button).toHaveAttribute("data-slot", "context-menu-trigger");
    await userEvent.tab();
    expect(button).toHaveFocus();
    fireEvent.contextMenu(button);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("stops text selection and the callout on touch pointers only, opt-out via className (fix #2)", () => {
    const { rerender } = render(<ContextMenu><ContextMenuTrigger>Text</ContextMenuTrigger></ContextMenu>);
    const trigger = screen.getByText("Text");
    expect(trigger).toHaveClass("pointer-coarse:select-none", "pointer-coarse:[-webkit-touch-callout:none]");
    expect(trigger).not.toHaveClass("select-none");
    rerender(
      <ContextMenu>
        <ContextMenuTrigger className="pointer-coarse:select-text">Text</ContextMenuTrigger>
      </ContextMenu>,
    );
    expect(screen.getByText("Text")).toHaveClass("pointer-coarse:select-text");
    expect(screen.getByText("Text")).not.toHaveClass("pointer-coarse:select-none");
  });

  it("uses no manual dark: variant on any part (fix #3)", () => {
    render(<Subject />);
    fireEvent.contextMenu(trigger());
    const parts = [trigger(), ...document.querySelectorAll("[data-slot^=context-menu]")];
    for (const el of parts) {
      expect(classesOf(el).filter((c) => c.includes("dark:"))).toEqual([]);
    }
  });

  it("dims a disabled item like DropdownMenu does (fix #6)", () => {
    render(
      <>
        <DropdownMenu open>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Dropdown</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ContextMenu>
          <ContextMenuTrigger>Ziel</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem disabled>Kontext</ContextMenuItem>
            <ContextMenuCheckboxItem disabled>Kontext-Haken</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      </>,
    );
    fireEvent.contextMenu(screen.getByText("Ziel"));
    const dim = (text: string) =>
      classesOf(screen.getByText(text).closest("[role^=menuitem]")!).filter((c) =>
        c.startsWith("data-[disabled]:opacity-"),
      );
    expect(dim("Dropdown")).toHaveLength(1);
    expect(dim("Kontext")).toEqual(dim("Dropdown"));
    expect(dim("Kontext-Haken")).toEqual(dim("Dropdown"));
  });
});
