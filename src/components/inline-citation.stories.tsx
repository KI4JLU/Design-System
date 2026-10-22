import type { Meta, StoryObj } from "@storybook/react-vite";
import { TableIcon } from "lucide-react";
import { expect, screen, waitFor } from "storybook/test";
import { Button } from "./button";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationText,
} from "./inline-citation";

/**
 * AI Elements `InlineCitation`
 * (https://elements.ai-sdk.dev/api/registry/inline-citation.json), imported
 * with the shadcn CLI, on the DS `Popover` with hover intent (~300 ms; the
 * pointer may travel chip → card), click / Enter pins it and moves focus in,
 * Esc closes and returns focus to the chip. The chip shows only the number.
 */
const meta = {
  title: "Components/InlineCitation",
  component: InlineCitationCard,
} satisfies Meta<typeof InlineCitationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The source preview's content, as in the mockup (built by the consumer). */
export function PreviewContent() {
  const cells = [
    ["Anforderung", "Fehler den Nutzenden verständlich melden (Sinnvolle Statusmeldungen)"],
    ["Zuständig · Status", <><mark className="rounded bg-primary-fixed px-0.5 text-on-primary-fixed">Sten, Steffen</mark> · <mark className="rounded bg-primary-fixed px-0.5 text-on-primary-fixed">Offen</mark></>],
    ["Bemerkung", <mark className="rounded bg-primary-fixed px-0.5 text-on-primary-fixed">Abstimmung zwischen Sten und Steffen nötig</mark>],
  ] as const;
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
          <TableIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[15px] font-semibold text-on-surface">Anforderungen JLU RAG</p>
          <p className="m-0 text-xs text-on-surface-variant">Quelle 1 · Tabelle · Zeile F-06b</p>
        </div>
      </div>
      <dl className="m-0 grid gap-4 rounded-xl bg-surface-container-low p-4 text-sm [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {cells.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-on-surface-variant">{label}</dt>
            <dd className="m-0 text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Desktop: the answer with a marker and the opened, pinned preview (main.png). */
export const DesktopPopover: Story = {
  render: () => (
    <p className="max-w-2xl text-base text-on-surface">
      <InlineCitation>
        <InlineCitationText>
          Zuständig sind <strong>Sten und Steffen</strong> – über die Anforderung <strong>F-06b</strong>.
          Laut Anforderungsliste ist eine Abstimmung zwischen beiden nötig.
        </InlineCitationText>
        <InlineCitationCard>
          <InlineCitationCardTrigger aria-label="Quelle 1: Anforderungen JLU RAG">1</InlineCitationCardTrigger>
          <InlineCitationCardBody
            align="start"
            aria-label="Quelle 1: Anforderungen JLU RAG"
            className="w-[min(90vw,42rem)]"
          >
            <PreviewContent />
            <div className="flex justify-end gap-2 px-5 pb-5">
              <Button variant="outline">Alle 5 Quellen</Button>
              <Button>In Quelle öffnen</Button>
            </div>
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
    </p>
  ),
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByRole("button", { name: "Quelle 1: Anforderungen JLU RAG" });
    await userEvent.click(chip);
    const dialog = await screen.findByRole("dialog", { name: "Quelle 1: Anforderungen JLU RAG" });
    await expect(chip).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await expect(screen.getByRole("button", { name: "In Quelle öffnen" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(chip).toHaveFocus());
    await userEvent.click(chip); // leave it open for the visual check
  },
};

/** The same in the dark theme. */
export const DesktopPopoverDark: Story = {
  ...DesktopPopover,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await DesktopPopover.play!(context);
  },
};
