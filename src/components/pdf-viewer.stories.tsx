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
    // The announced position ("2 / 3"), not the toolbar's whole text: the
    // page field's "/ 3" sits beside it.
    const live = canvasElement.querySelector("[data-slot='pdf-viewer-toolbar'] [aria-live]");
    const match = new RegExp(`^(\\d+) / ${PAGES}$`).exec(live?.textContent?.trim() ?? "");
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
 * **`highlights`**: a cited passage marked on its page, as when JLURAG opens
 * a source from an answer's citation on the cited page. The passage is the
 * extracted text, with a line break where the PDF has none — the lookup is
 * tolerant of spacing.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the viewer opens on page 2 [the indicator];
 * 2. the passage is marked there, and only there [mark boxes inside page 2,
 *    none on the other pages];
 * 3. the mark lies over the passage's line, not at the page's top edge
 *    [its top is below 5% of the page].
 */
export const Highlights: Story = {
  args: {
    src: studyRegulationPdfUrl(),
    initialPage: 2,
    highlights: [{ text: "Eine nicht bestandene Prüfung\nkann zweimal wiederholt werden.", page: 2 }],
  },
  play: async ({ canvasElement }) => {
    await waitFor(async () => expect(await pageIndicator(canvasElement)).toBe(2), PDF_TIMEOUT);
    const marks = await waitFor(() => {
      const found = canvasElement.querySelectorAll<HTMLElement>("[data-page='2'] [data-slot='pdf-viewer-mark']");
      if (found.length === 0) throw new Error("no mark yet");
      return found;
    }, PDF_TIMEOUT);
    await expect(canvasElement.querySelectorAll("[data-slot='pdf-viewer-mark']").length).toBe(marks.length);
    await expect(parseFloat(marks[0].style.top)).toBeGreaterThan(5);
  },
};

/**
 * **`pages`**: only the cited page, with its passage marked — JLURAG's full
 * view of a citation. The indicator keeps the document's own numbering.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. exactly one page is laid out, page 2 [the page elements];
 * 2. the toolbar names the page, „Seite 2 von 3", and offers no stepping
 *    [the text; no previous / next button];
 * 3. the passage is marked on it in the highlight yellow [a mark with
 *    `bg-highlight` and a computed background colour].
 */
export const CitedPage: Story = {
  args: {
    src: studyRegulationPdfUrl(),
    initialPage: 2,
    pages: [2],
    highlights: [{ text: "Die Wiederholung findet im folgenden Semester statt.", page: 2 }],
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByText("Seite 2 von 3", {}, PDF_TIMEOUT)).toBeVisible();
    const laidOut = [...canvasElement.querySelectorAll<HTMLElement>("[data-slot='pdf-viewer-pages'] [data-page]")];
    await expect(laidOut.map((el) => el.dataset.page)).toEqual(["2"]);
    await expect(canvas.queryByRole("button", { name: "Vorherige Seite" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Nächste Seite" })).toBeNull();
    const mark = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>("[data-page='2'] [data-slot='pdf-viewer-mark']");
      if (!found) throw new Error("no mark yet");
      return found;
    }, PDF_TIMEOUT);
    await expect(mark.className).toContain("bg-highlight");
    // The token resolves to a colour: the utility exists in the built CSS.
    await expect(getComputedStyle(mark).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  },
};

/**
 * **Jump to a page**: the counter is a field — type a page, Enter goes there.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. typing 3 + Enter moves to page 3 [the indicator];
 * 2. a page that does not exist is ignored, the field shows the current page
 *    again [the indicator stays 3; the field's value].
 */
export const JumpToPage: Story = {
  args: { src: studyRegulationPdfUrl() },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(await pageIndicator(canvasElement)).toBe(1);
    const field = canvas.getByRole("textbox", { name: "Seite" });
    await userEvent.click(field);
    await userEvent.keyboard("3{Enter}");
    await waitFor(async () => expect(await pageIndicator(canvasElement)).toBe(3));
    await userEvent.click(field);
    await userEvent.keyboard("9{Enter}");
    await expect(await pageIndicator(canvasElement)).toBe(3);
    await expect(field).toHaveValue("3");
  },
};

/**
 * **`pages` with several pages** (a passage over a page break): the steps
 * move through those pages only, in the document's numbering.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. pages 1 and 3 are laid out, not 2 [the page elements];
 * 2. „Nächste Seite" goes from 1 straight to 3, then is off [the indicator; `disabled`].
 */
export const SomePages: Story = {
  args: { src: studyRegulationPdfUrl(), pages: [1, 3] },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(await pageIndicator(canvasElement)).toBe(1);
    const laidOut = [...canvasElement.querySelectorAll<HTMLElement>("[data-slot='pdf-viewer-pages'] [data-page]")];
    await expect(laidOut.map((el) => el.dataset.page)).toEqual(["1", "3"]);
    await userEvent.click(canvas.getByRole("button", { name: "Nächste Seite" }));
    await waitFor(async () => expect(await pageIndicator(canvasElement)).toBe(3));
    await expect(canvas.getByRole("button", { name: "Nächste Seite" })).toBeDisabled();
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
