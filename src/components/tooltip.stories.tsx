import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, RefreshCw, Trash2, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { Button } from "./button";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Der Standardfall: ein Icon-Button behält seinen zugänglichen Namen
 * (`aria-label`), der Tooltip *beschreibt* ihn nur (`aria-describedby`).
 * Öffnet bei Hover und Tastaturfokus, Escape schließt.
 */
export const IconButton: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Aktualisieren">
          <RefreshCw aria-hidden className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Daten neu laden</TooltipContent>
    </Tooltip>
  ),
};

/** Alle vier Seiten über `side`; hier dauerhaft offen für den Vergleich. */
export const Placements: Story = {
  render: () => (
    <div className="flex flex-wrap items-center justify-center gap-16 p-16">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} open>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              {side}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Tooltip {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

/** Längere Hinweise brechen bei `max-w-72` um — Tooltips bleiben kurz,
 * alles Längere gehört in ein Popover oder auf die Seite selbst. */
export const LongContent: Story = {
  render: () => (
    <Tooltip open>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Hochladen">
          <Upload aria-hidden className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Unterstützt PDF, DOCX und Markdown bis 25 MB; die Verarbeitung läuft im
        Hintergrund und kann einige Minuten dauern.
      </TooltipContent>
    </Tooltip>
  ),
};

/**
 * Deaktivierte Controls feuern keine Pointer-Events — der Trigger umschließt
 * deshalb einen fokussierbaren `<span>` um den Button, damit der Grund der
 * Deaktivierung erreichbar bleibt (Hover *und* Tastatur).
 */
export const DisabledTrigger: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Bearbeiten">
            <Pencil aria-hidden className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Konnektor bearbeiten</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex rounded-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
            <Button variant="ghost-destructive" size="icon" aria-label="Löschen" disabled>
              <Trash2 aria-hidden className="h-4 w-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Wird von 3 Konnektoren verwendet</TooltipContent>
      </Tooltip>
    </div>
  ),
};
