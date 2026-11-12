import { useLayoutEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
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

function HiddenTitlebar({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.dataset.titlebar = "inset";
    return () => {
      delete document.documentElement.dataset.titlebar;
    };
  }, []);
  return <>{children}</>;
}

/**
 * Unter einer versteckten Titelleiste (`<html data-titlebar>`, „Native
 * shell") bleibt die oberste Fensterzeile frei: Ein Tooltip, der dort landen
 * würde — hier mit `side="top"` direkt unter der Zeile —, weicht aus, egal
 * welche Seite der Aufrufer verlangt. Die Regel sitzt in `TooltipContent`.
 */
export const KeepsOutOfTheTitleBar: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <HiddenTitlebar>
      <div className="flex flex-col items-start gap-2 pt-15 pl-3">
        <Tooltip open>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Neuer Chat">
              <Pencil aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Neuer Chat</TooltipContent>
        </Tooltip>
      </div>
    </HiddenTitlebar>
  ),
  play: async ({ canvasElement }) => {
    const tip = await within(canvasElement.ownerDocument.body).findByRole("tooltip");
    const box = tip.closest("[data-slot='tooltip-content']")!.getBoundingClientRect();
    // 56px: the window's title row.
    await expect(box.top).toBeGreaterThanOrEqual(56);
  },
};

function DesktopHost({ on, children }: { on: boolean; children: React.ReactNode }) {
  useLayoutEffect(() => {
    if (on) document.documentElement.dataset.host = "desktop";
    return () => {
      delete document.documentElement.dataset.host;
    };
  }, [on]);
  return <>{children}</>;
}

const desktopOnly = (
  <span data-desktop-only="" data-testid="hint" className="inline-flex">
    ⌘N
  </span>
);

/**
 * `data-desktop-only`: im Web nicht sichtbar, in der Desktop-App
 * (`<html data-host="desktop">`) mit der Darstellung, die die eigenen Klassen
 * des Elements vorgeben.
 */
export const DesktopOnlyHiddenOnTheWeb: Story = {
  render: () => <DesktopHost on={false}>{desktopOnly}</DesktopHost>,
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByTestId("hint")).display).toBe("none");
  },
};

export const DesktopOnlyShownInTheDesktopApp: Story = {
  render: () => <DesktopHost on>{desktopOnly}</DesktopHost>,
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByTestId("hint")).display).toBe("inline-flex");
  },
};
