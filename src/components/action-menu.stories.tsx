import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";
import { Pencil, Settings, SlidersHorizontal, Trash2, UserPlus } from "lucide-react";
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
 * A topic card's ⋮ menu: only actions on the topic itself. „…" opens a
 * dialog and keeps the page; `opensPage` (↗) leaves it — here for the topic's
 * settings.
 */
export const Default: Story = {
  args: {
    label: "Aktionen: Tetris",
    actions: [
      { label: "Umbenennen…", icon: <Pencil aria-hidden="true" className={icon} />, onSelect: () => {} },
      { label: "Teilen…", icon: <UserPlus aria-hidden="true" className={icon} />, onSelect: () => {} },
      { label: "Einstellungen", icon: <Settings aria-hidden="true" className={icon} />, opensPage: true, separatorBefore: true, onSelect: () => {} },
      { label: "Löschen…", icon: <Trash2 aria-hidden="true" className={icon} />, destructive: true, separatorBefore: true, onSelect: () => {} },
    ],
  },
  // The menu is portaled to <body>, outside the story canvas. Closed again at
  // the end: while it is open Radix hides the rest of the page (aria-hidden),
  // trigger included, and the a11y check after `play` would flag that.
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Aktionen: Tetris" }));
    const settings = await screen.findByRole("menuitem", { name: "Einstellungen" });
    await expect(settings.querySelector('[data-testid="action-menu-opens-page"]')).not.toBeNull();
    await userEvent.keyboard("{Escape}");
  },
};

/** An item with a `badge`: a short pill at the end of its row, part of its name. */
export const WithBadge: Story = {
  args: {
    label: "Aktionen: Tetris",
    actions: [
      { label: "Umbenennen…", icon: <Pencil aria-hidden="true" className={icon} />, onSelect: () => {} },
      { label: "Statistik", badge: "Admin", icon: <SlidersHorizontal aria-hidden="true" className={icon} />, onSelect: () => {} },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Aktionen: Tetris" }));
    await expect(await screen.findByRole("menuitem", { name: "Statistik (Admin)" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};
