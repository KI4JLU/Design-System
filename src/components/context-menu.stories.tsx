import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyIcon, PencilIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon, Trash2Icon } from "lucide-react";
import { expect, fireEvent, screen, waitFor } from "storybook/test";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { contrastRatio, realKeyboard } from "../test/fixtures/real-pointer";

/**
 * shadcn/ui `context-menu`
 * (https://ui.shadcn.com/r/styles/new-york-v4/context-menu.json), imported
 * with the shadcn CLI. Radix ContextMenu: opens on right-click (and the
 * context-menu key) on desktop and on a long-press (~700 ms) on touch — the
 * mobile entry point to a message's actions.
 */
const meta = {
  title: "Components/ContextMenu",
  component: ContextMenu,
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A message's actions behind right-click / long-press. */
export const MessageActions: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="block max-w-md rounded-lg border border-dashed border-outline-variant p-4 text-sm">
        Die Anmeldefrist endet am 15. November. (Rechtsklick oder lange drücken)
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem>
          <CopyIcon />
          Kopieren
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <PencilIcon />
          Bearbeiten
        </ContextMenuItem>
        <ContextMenuItem>
          <RefreshCcwIcon />
          Neu generieren
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <ThumbsUpIcon />
          Gute Antwort
        </ContextMenuItem>
        <ContextMenuItem>
          <ThumbsDownIcon />
          Schlechte Antwort
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Trash2Icon />
          Löschen
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByText(/Anmeldefrist/);
    // Right-click
    await userEvent.pointer({ keys: "[MouseRight]", target: trigger });
    const menu = await screen.findByRole("menu");
    await expect(screen.getByRole("menuitem", { name: /Kopieren/ })).toBeVisible();
    await expect(screen.getAllByRole("menuitem")).toHaveLength(6);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(menu).not.toBeInTheDocument());
    // Long-press (touch): pointer held past Radix's 700 ms
    fireEvent.pointerDown(trigger, { pointerType: "touch", clientX: 20, clientY: 20 });
    await new Promise((r) => setTimeout(r, 800));
    await expect(await screen.findByRole("menu")).toBeVisible();
    fireEvent.pointerUp(trigger, { pointerType: "touch" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  },
};

/** The same in the dark theme. */
export const MessageActionsDark: Story = {
  ...MessageActions,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await MessageActions.play!(context);
  },
};

/**
 * Keyboard path: with `asChild` the consumer's own focusable element is the
 * trigger, so Tab reaches it and the context-menu key opens the menu
 * (Shift+F10 does the same on Windows/Linux).
 */
export const KeyboardTrigger: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button variant="outline">Antwort-Aktionen</Button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Kopieren</ContextMenuItem>
        <ContextMenuItem>Bearbeiten</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Antwort-Aktionen" });
    button.focus();
    if (!(await realKeyboard("{ContextMenu}"))) return; // outside Vitest: no real keyboard
    await expect(await screen.findByRole("menu")).toBeVisible();
    await realKeyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  },
};

const corners = (el: Element) => {
  const s = getComputedStyle(el);
  return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius];
};

/**
 * The popup and its rows follow the app Style like DropdownMenu (open on the
 * left for comparison); the destructive row, highlighted, keeps 4.5:1.
 */
export const StyleParity: Story = {
  render: () => (
    <div className="flex gap-16">
      <DropdownMenu modal={false} open>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Dropdown</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-testid="dropdown">
          <DropdownMenuItem>Dropdown-Zeile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu modal={false}>
        <ContextMenuTrigger className="rounded-lg border border-dashed border-outline-variant p-4 text-sm">
          Kontextmenü-Ziel
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            <CopyIcon />
            Kontext-Zeile
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <CopyIcon />
              Antwort exportieren
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Als Markdown</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem variant="destructive">
            <Trash2Icon />
            Löschen
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    fireEvent.contextMenu(canvas.getByText("Kontextmenü-Ziel"), { clientX: 400, clientY: 60 });
    const contextMenu = (await screen.findAllByRole("menu")).find((m) =>
      m.matches("[data-slot=context-menu-content]"),
    )!;
    const dropdown = screen.getByTestId("dropdown");
    await expect(corners(contextMenu)).toEqual(corners(dropdown));
    const row = screen.getByRole("menuitem", { name: "Kontext-Zeile" });
    const dropdownRow = screen.getByRole("menuitem", { name: "Dropdown-Zeile" });
    await expect(corners(row)).toEqual(corners(dropdownRow));
    // The sub-trigger spaces icon and label like an item.
    const subTrigger = screen.getByRole("menuitem", { name: "Antwort exportieren" });
    await expect(getComputedStyle(row).columnGap).not.toBe("normal");
    await expect(getComputedStyle(subTrigger).columnGap).toBe(getComputedStyle(row).columnGap);
    // Destructive row, highlighted (Radix focuses the highlighted item)
    const destructive = screen.getByRole("menuitem", { name: "Löschen" });
    destructive.focus();
    await waitFor(() => expect(destructive).toHaveAttribute("data-highlighted"));
    const s = getComputedStyle(destructive);
    await expect(contrastRatio(s.color, s.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    const icon = getComputedStyle(destructive.querySelector("svg")!);
    await expect(contrastRatio(icon.color, s.backgroundColor)).toBeGreaterThanOrEqual(4.5);
  },
};

/** The same with the pill Style. */
export const StyleParityPill: Story = { ...StyleParity, globals: { shape: "pill" } };

/** The same in the dark theme. */
export const StyleParityDark: Story = {
  ...StyleParity,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await StyleParity.play!(context);
  },
};
