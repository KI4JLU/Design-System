import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { PdfViewer } from "./pdf-viewer";
import { STUDY_REGULATION, canvasHasInk, studyRegulationPdfUrl } from "../test/fixtures/sample-files";

/**
 * A PDF on the design system's surfaces, rendered with pdf.js page by page —
 * not the browser's own viewer, which ignores the app's theme. JLURAG opens
 * it for a PDF source. The pdf.js worker is set once in
 * `.storybook/preview.tsx` (`setPdfWorkerSrc`), as an app does at start-up.
 */
const meta = {
  title: "Components/Files/PdfViewer",
  component: PdfViewer,
  parameters: { layout: "padded" },
  args: { src: "" },
  decorators: [
    (Story) => (
      <div className="flex h-[520px] w-[640px] flex-col overflow-hidden rounded-[var(--ui-radius-box)] border border-outline-variant">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PdfViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const PAGES = STUDY_REGULATION.length;

/**
 * The toolbar's page indicator, once the document is laid out. The first
 * story to open a PDF also loads the pdf.js worker, hence the long timeout.
 */
const PDF_TIMEOUT = { timeout: 10_000 };
const pageIndicator = (canvasElement: HTMLElement) =>
  waitFor(() => {
    const toolbar = canvasElement.querySelector("[data-slot='pdf-viewer-toolbar']")!;
    const match = new RegExp(`(\\d+) / ${PAGES}`).exec(toolbar.textContent ?? "");
    if (!match) throw new Error("document not laid out yet");
    return Number(match[1]);
  }, PDF_TIMEOUT);

/**
 * **A three-page study regulation** on the grey canvas.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the toolbar counts the document's pages, starting on page 1 [the
 *    indicator against the fixture's page count];
 * 2. the first page is drawn [dark text pixels on its canvas];
 * 3. „Nächste Seite" moves to page 2, and „Vorherige Seite" is off on page 1
 *    [the indicator; `disabled`].
 */
export const Default: Story = {
  args: { src: studyRegulationPdfUrl() },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(await pageIndicator(canvasElement)).toBe(1);
    await expect(canvas.getByRole("button", { name: "Vorherige Seite" })).toBeDisabled();

    await waitFor(() => {
      const first = canvasElement.querySelector<HTMLCanvasElement>(
        "[data-slot='pdf-viewer-pages'] canvas",
      );
      // Ink, not size: a fresh canvas is already 300px wide.
      if (!first || !canvasHasInk(first)) throw new Error("first page not drawn yet");
    }, PDF_TIMEOUT);

    await userEvent.click(canvas.getByRole("button", { name: "Nächste Seite" }));
    await waitFor(async () => expect(await pageIndicator(canvasElement)).toBe(2));
  },
};

/**
 * **`plain`**: no grey canvas — the pages run edge to edge on the page
 * colour, divided by a hairline, as in a preview window.
 */
export const Plain: Story = {
  args: { src: studyRegulationPdfUrl(), plain: true },
  play: async ({ canvasElement }) => {
    await expect(await pageIndicator(canvasElement)).toBe(1);
  },
};

/**
 * **A file that is not a PDF** shows its message instead of pages.
 *
 * `play` oracle: the default message is visible [the text].
 */
export const LoadError: Story = {
  args: { src: "data:application/pdf;base64,AAAA" },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Das PDF konnte nicht geladen werden."),
    ).toBeVisible();
  },
};
