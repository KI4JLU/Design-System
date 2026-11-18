import type { Meta, StoryObj } from "@storybook/react-vite";
import { LogOut, Pencil, Settings, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
