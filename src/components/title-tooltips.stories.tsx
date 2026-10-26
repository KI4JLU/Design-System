import type { Meta, StoryObj } from "@storybook/react-vite";
import { Paperclip, RefreshCw, Trash2 } from "lucide-react";
import { expect, waitFor } from "storybook/test";
import { TitleTooltips } from "./title-tooltips";
import { Button } from "./button";
import { Message, MessageContent } from "./message";

const meta = {
  title: "Components/TitleTooltips",
  component: TitleTooltips,
} satisfies Meta<typeof TitleTooltips>;

export default meta;
type Story = StoryObj<typeof meta>;

const tooltipContent = () =>
  document.querySelector<HTMLElement>('[data-slot="tooltip-content"]') ?? undefined;

/**
 * Plain markup with native `title` attributes — no `Tooltip` around any of
 * them. With `TitleTooltips` mounted once, each shows the DS tooltip on hover
 * and keyboard focus instead of the browser's.
 */
export const NativeTitles: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-16">
      <TitleTooltips />
      <Button variant="ghost" size="icon" aria-label="Aktualisieren" title="Daten neu laden">
        <RefreshCw aria-hidden className="h-4 w-4" />
      </Button>
      <Button variant="ghost-destructive" size="icon" aria-label="Löschen" title="Datei endgültig löschen">
        <Trash2 aria-hidden className="h-4 w-4" />
      </Button>
      <a href="#ziel" title={"Mehrzeilig:\nZeilenumbrüche bleiben erhalten"}>
        Link mit Titel
      </a>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const refresh = canvas.getByRole("button", { name: "Aktualisieren" });
    await userEvent.hover(refresh);
    await waitFor(() => expect(tooltipContent()).toHaveTextContent("Daten neu laden"));
    // The native tooltip is suppressed (title emptied) while the DS one shows.
    expect(refresh).toHaveAttribute("title", "");
    await userEvent.unhover(refresh);
    await userEvent.hover(canvas.getByText("Link mit Titel"));
    await waitFor(() => expect(refresh).toHaveAttribute("title", "Daten neu laden"));
  },
};

/**
 * Inside a `Message` (which sets `data-tooltip-tone="inverse"`) the tooltip
 * takes the inverse surface, like `MessageAction`'s, so it stays visible over
 * a primary user bubble.
 */
export const InsideMessage: Story = {
  render: () => (
    <div className="flex w-[480px] flex-col p-16">
      <TitleTooltips />
      <Message from="user">
        <MessageContent>Bitte fasse den Anhang zusammen.</MessageContent>
        <span className="ml-auto inline-flex items-center gap-1 text-xs" title="pruefungsordnung-2026.pdf">
          <Paperclip aria-hidden className="h-3 w-3" /> pruefungsordnung…
        </span>
      </Message>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByText("pruefungsordnung…"));
    await waitFor(() => expect(tooltipContent()).toHaveTextContent("pruefungsordnung-2026.pdf"));
    expect(tooltipContent()).toHaveClass("bg-inverse-surface");
  },
};

export const InsideMessageDark: Story = {
  ...InsideMessage,
  globals: { theme: "dark" },
};
