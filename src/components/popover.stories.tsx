import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListFilter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Components/Overlays/Popover",
  component: Popover,
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Verankertes Panel für Nicht-Menü-Inhalte (Filter, Picker, Mini-Formulare).
 * Für Aktionslisten stattdessen DropdownMenu verwenden.
 */
export const FilterPanel: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter aria-hidden className="h-4 w-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Konversationen filtern">
        <p className="mb-3 text-sm font-semibold text-on-surface">Status</p>
        <div className="flex flex-col gap-2">
          {["Offen", "Beantwortet", "Eskaliert"].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <Checkbox id={`filter-${label}`} defaultChecked={label === "Offen"} />
              <Label htmlFor={`filter-${label}`}>{label}</Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  ),
};
