import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";
import { Pencil, SlidersHorizontal, Star, Trash2, UserPlus } from "lucide-react";
import { ActionMenu } from "./action-menu";

const meta = {
  title: "Components/ActionMenu",
  component: ActionMenu,
  parameters: { layout: "centered", a11y: { test: "error" } },
} satisfies Meta<typeof ActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const icon = "size-4";

/**
 * A topic card's ⋮ menu. "RAG Konfiguration" is offered to
 * administrators only, and its `badge` says so.
 */
export const Default: Story = {
  args: {
    label: "Aktionen: Tetris",
    actions: [
      { label: "Zu Favoriten hinzufügen", icon: <Star aria-hidden="true" className={icon} />, onSelect: () => {} },
      { label: "Teilen", icon: <UserPlus aria-hidden="true" className={icon} />, onSelect: () => {} },
      { label: "Umbenennen", icon: <Pencil aria-hidden="true" className={icon} />, onSelect: () => {} },
      { label: "RAG Konfiguration", badge: "Admin", icon: <SlidersHorizontal aria-hidden="true" className={icon} />, onSelect: () => {} },
      { label: "Löschen", icon: <Trash2 aria-hidden="true" className={icon} />, destructive: true, separatorBefore: true, onSelect: () => {} },
    ],
  },
  // The menu is portaled to <body>, outside the story canvas. Closed again at
  // the end: while it is open Radix hides the rest of the page (aria-hidden),
  // trigger included, and the a11y check after `play` would flag that.
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Aktionen: Tetris" }));
    await expect(await screen.findByRole("menuitem", { name: "RAG Konfiguration (Admin)" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};
