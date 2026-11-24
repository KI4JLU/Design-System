import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { ExternalLink, LogOut, Settings } from "lucide-react";
import { SidebarUserMenu } from "./sidebar-user-menu";
import { DropdownMenuItem, DropdownMenuSeparator } from "./dropdown-menu";
import { UserMenuWithSettings } from "../test/fixtures/user-menu";

const meta = {
  title: "Components/Navigation/SidebarUserMenu",
  component: SidebarUserMenu,
  args: {
    initials: "JL",
    name: "Jamie Lee",
    role: "Admin",
  },
  // In real use the row sits in the 256px-wide sidebar footer — recreated
  // here so truncation and full width are visible.
  decorators: [
    (Story) => (
      <div className="w-64 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SidebarUserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: (
      <>
        <DropdownMenuItem>
          <Settings width="1em" height="1em" aria-hidden />
          Einstellungen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut width="1em" height="1em" aria-hidden />
          Abmelden
        </DropdownMenuItem>
      </>
    ),
  },
};

/** Without `role`: only the name, vertically centered next to the avatar. */
export const WithoutRole: Story = {
  args: {
    role: undefined,
    children: (
      <DropdownMenuItem variant="destructive">
        <LogOut width="1em" height="1em" aria-hidden />
        Abmelden
      </DropdownMenuItem>
    ),
  },
};

/** Long values are truncated instead of widening the column. */
export const TruncatesLongValues: Story = {
  args: {
    initials: "MB",
    name: "Maximiliane Bergstrom-Lindqvist",
    role: "Wissenschaftliche Mitarbeiterin (Institut)",
    children: (
      <DropdownMenuItem asChild>
        <a href="#profil">
          <ExternalLink width="1em" height="1em" aria-hidden />
          Profil öffnen
        </a>
      </DropdownMenuItem>
    ),
  },
};

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/**
 * The way to the settings: "Einstellungen" in the user menu opens the
 * `SettingsDialog` via `onSelect`, whose "Darstellung" section carries the
 * `AppearanceSettings` — wired to the real providers the Storybook decorator
 * mounts. A choice in the dialog therefore switches the whole canvas (the next
 * change in the toolbar wins again).
 *
 * The wiring is the shared story fixture `UserMenuWithSettings`
 * (`src/test/fixtures/user-menu.tsx`) — the same one every
 * `Templates/AppShellLayout` story mounts in the column footer (KI-847).
 */
export const OpensSettings: Story = {
  args: { children: null },
  render: (args) => (
    <UserMenuWithSettings initials={args.initials} name={args.name} role={args.role} />
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Jamie Lee/ }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Einstellungen" }));

    const dialog = await body.findByRole("dialog", { name: "Einstellungen" });
    await expect(within(dialog).getByRole("heading", { level: 2, name: "Darstellung" })).toBeVisible();
    for (const row of ["Farbschema", "Kontrast", "Akzentfarbe"]) {
      await expect(within(dialog).getByRole("combobox", { name: row })).toBeVisible();
    }
    // The menu has closed behind the dialog.
    await expect(body.queryByRole("menu")).toBeNull();

    await userEvent.click(within(dialog).getByRole("button", { name: "Schließen" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    // TODO: focus lands on <body> here, not back on the menu trigger (WCAG
    // 2.4.3). Radix Dialog's modal content always moves focus to its own
    // DialogTrigger on close (react-dialog 1.1.19, index.mjs `onCloseAutoFocus`),
    // and SettingsDialog renders none — so this holds for every way of opening
    // it, a plain button included. Not fixed on this card (KI-850); reported as
    // a follow-up. Deferring setOpen (setTimeout / rAF) was tried: no effect.
    // Menu → dialog is the case where two Radix layers hand over
    // `pointer-events: none` on <body>; after closing the page must be usable
    // again — the menu opens a second time.
    await waitFor(() => expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: /Jamie Lee/ }));
    await expect(await body.findByRole("menuitem", { name: "Einstellungen" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};
