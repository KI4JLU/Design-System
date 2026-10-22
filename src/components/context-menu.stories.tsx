import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyIcon, PencilIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon, Trash2Icon } from "lucide-react";
import { expect, fireEvent, screen, waitFor } from "storybook/test";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "./context-menu";

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
