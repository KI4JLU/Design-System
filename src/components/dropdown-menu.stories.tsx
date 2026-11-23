import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, FileText, LifeBuoy, LogOut, Pencil, Settings, ShieldCheck, Trash2, User } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { Avatar } from "./avatar";

const meta = {
  title: "Components/Actions/DropdownMenu",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Aktionsmenü: Escape, Pfeiltasten, Typeahead und Fokus-Rückgabe kommen von
 * Radix. Der Outline-Trigger zeigt seinen Offen-Zustand automatisch
 * (`data-state="open"`).
 */
export const Actions: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Optionen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <Pencil aria-hidden className="h-4 w-4" />
          Umbenennen
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings aria-hidden className="h-4 w-4" />
          Einstellungen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 aria-hidden className="h-4 w-4" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

/** Nutzermenü-Muster (Sidebar): Avatar-Trigger, Label-Kopf, destruktives Abmelden. */
export const UserMenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none">
        <Avatar initials="SK" aria-label="Nutzermenü öffnen" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>sten.seegel@uni-giessen.de</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings aria-hidden className="h-4 w-4" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <LogOut aria-hidden className="h-4 w-4" />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

/**
 * JustRAG's user menu (`AppUserMenu.tsx`): the account as a label, then
 * „Profil", „Einstellungen", and „Hilfe" as a submenu with the legal pages —
 * „Impressum" is an external page (a link item with the external-link mark).
 *
 * `play` oracles [ARIA; focus]: the label is text, not an item; „Hilfe"
 * announces its submenu (`aria-haspopup="menu"`, `aria-expanded`); → from it
 * opens the submenu with the four pages and puts the focus on the first;
 * „Impressum" is a link that opens a new tab; ← closes the submenu and gives
 * the focus back to „Hilfe".
 */
export const HelpSubmenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Jamie Lee
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>jamie.lee@uni-giessen.de</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User aria-hidden className="h-4 w-4" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings aria-hidden className="h-4 w-4" />
          Einstellungen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <LifeBuoy aria-hidden className="h-4 w-4" />
            Hilfe
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <DropdownMenuItem asChild>
              <a href="https://www.uni-giessen.de/de/impressum" target="_blank" rel="noopener noreferrer">
                <FileText aria-hidden className="h-4 w-4" />
                Impressum
                <ExternalLink className="ml-auto !size-3.5 text-on-surface-variant" aria-hidden="true" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText aria-hidden className="h-4 w-4" />
              Nutzungsbedingungen
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ShieldCheck aria-hidden className="h-4 w-4" />
              Datenschutz
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText aria-hidden className="h-4 w-4" />
              Barrierefreiheit
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut aria-hidden className="h-4 w-4" />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Jamie Lee" }));
    const menu = await body.findByRole("menu");
    await expect(within(menu).getByText("jamie.lee@uni-giessen.de")).toBeVisible();
    await expect(within(menu).queryByRole("menuitem", { name: /jamie\.lee/ })).toBeNull();

    const help = within(menu).getByRole("menuitem", { name: "Hilfe" });
    await expect(help).toHaveAttribute("aria-haspopup", "menu");
    await expect(help).toHaveAttribute("aria-expanded", "false");
    help.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(help).toHaveAttribute("aria-expanded", "true"));
    const sub = await waitFor(() => {
      const menus = body.getAllByRole("menu");
      if (menus.length < 2) throw new Error("submenu not open");
      return menus[menus.length - 1];
    });
    await expect(within(sub).getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "Impressum",
      "Nutzungsbedingungen",
      "Datenschutz",
      "Barrierefreiheit",
    ]);
    const imprint = within(sub).getByRole("menuitem", { name: "Impressum" });
    await waitFor(() => expect(imprint).toHaveFocus());
    await expect(imprint.tagName).toBe("A");
    await expect(imprint).toHaveAttribute("target", "_blank");

    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(help).toHaveFocus());
    await expect(help).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};
