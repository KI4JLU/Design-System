import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, ExternalLink, LogOut, SlidersHorizontal } from "lucide-react";
import { MenuItem } from "./menu-item";

const meta = {
  title: "Components/Actions/MenuItem",
  component: MenuItem,
  argTypes: {
    variant: { control: "select", options: ["default", "destructive"] },
    selected: { control: "boolean" },
    highlighted: { control: "boolean" },
    asChild: { control: false },
  },
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: "Menüeintrag" },
};

/** Dropdown mit Auswahl: selected bekommt Farbe/Gewicht + Check (ml-auto). */
export const SelectMenu: Story = {
  render: () => (
    <div className="w-64 rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-overlay">
      <MenuItem type="button" selected>
        Alle Konversationen
        <Check className="ml-auto text-[16px]" width="1em" height="1em" aria-hidden />
      </MenuItem>
      <MenuItem type="button">Offen</MenuItem>
      <MenuItem type="button" highlighted>
        Beantwortet (Tastatur-Highlight)
      </MenuItem>
    </div>
  ),
};

/** Popover-Menü mit Link (asChild), Icons und destruktiver Aktion. */
export const PopoverMenu: Story = {
  render: () => (
    <div className="w-64 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-overlay">
      <MenuItem asChild className="border-b border-outline-variant">
        <a href="#portal" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="text-[18px]" width="1em" height="1em" aria-hidden />
          Externes Portal
        </a>
      </MenuItem>
      <MenuItem type="button">
        <SlidersHorizontal className="text-[18px]" width="1em" height="1em" aria-hidden />
        Einstellungen
      </MenuItem>
      <MenuItem type="button" variant="destructive">
        <LogOut className="text-[18px]" width="1em" height="1em" aria-hidden />
        Abmelden
      </MenuItem>
    </div>
  ),
};
