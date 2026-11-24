import { useLayoutEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Pencil, RefreshCw, Trash2, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { Button } from "./button";

const meta = {
  title: "Components/Overlays/Tooltip",
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The standard case: an icon button keeps its accessible name
 * (`aria-label`), and the tooltip only *describes* it (`aria-describedby`).
 * Opens on hover and keyboard focus, Escape closes.
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

/** All four sides via `side`; permanently open here for comparison. */
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

/** Longer hints wrap at `max-w-72` — tooltips stay short; anything longer
 * belongs in a popover or on the page itself. */
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
 * These stories set attributes on `<html>` (`data-titlebar`, `data-host`) —
 * the document, not the story. On the Docs page every story shares one
 * document, so inline the „desktop" story would also show the hint in its
 * „web" neighbour. In its own iframe each keeps its attributes to itself.
 */
const OWN_IFRAME_IN_DOCS = { docs: { story: { inline: false, iframeHeight: 320 } } };

/**
 * Disabled controls fire no pointer events — so the trigger wraps a
 * focusable `<span>` around the button, keeping the reason it is disabled
 * reachable (hover *and* keyboard).
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
 * Under a hidden title bar (`<html data-titlebar>`, "Native shell") the top
 * window row stays free: a tooltip that would land there — here with
 * `side="top"` directly below the row — moves aside, whatever side the caller
 * asks for. The rule lives in `TooltipContent`.
 */
export const KeepsOutOfTheTitleBar: Story = {
  parameters: { layout: "fullscreen", ...OWN_IFRAME_IN_DOCS },
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
 * `data-desktop-only`: not visible on the web; in the desktop app
 * (`<html data-host="desktop">`) shown the way the element's own classes
 * specify.
 */
export const DesktopOnlyHiddenOnTheWeb: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => <DesktopHost on={false}>{desktopOnly}</DesktopHost>,
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByTestId("hint")).display).toBe("none");
  },
};

export const DesktopOnlyShownInTheDesktopApp: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => <DesktopHost on>{desktopOnly}</DesktopHost>,
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByTestId("hint")).display).toBe("inline-flex");
  },
};
