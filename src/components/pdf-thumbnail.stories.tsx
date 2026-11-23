import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";
import { PdfThumbnail } from "./pdf-thumbnail";
import { renderPdfFirstPage } from "../lib/pdf-render";
import { canvasHasInk, studyRegulationPdfUrl } from "../test/fixtures/sample-files";

/**
 * The first page of a PDF as a thumbnail, rendered with pdf.js into a
 * `<canvas>` and fitted into a box like an `<img>` — the preview of a PDF
 * source or attachment (JustRAG: `FilePreview`, the hover preview of a
 * source). `renderPdfFirstPage` gives the same bitmap ahead of time, as a
 * data URL. The pdf.js worker is set once in `.storybook/preview.tsx`
 * (`setPdfWorkerSrc`), as an app does at start-up.
 */
const meta = {
  title: "Components/Files/PdfThumbnail",
  component: PdfThumbnail,
  parameters: { layout: "padded" },
  args: { src: "", width: 160, height: 220 },
} satisfies Meta<typeof PdfThumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;

const PDF_TIMEOUT = { timeout: 10_000 };
const BOX = { width: 160, height: 220 };

/** The fixed box the page is fitted into, on the preview surface. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-testid="frame"
      className="flex items-center justify-center rounded-[var(--ui-radius-box)] border border-outline-variant bg-surface-container"
      style={{ width: BOX.width + 16, height: BOX.height + 16 }}
    >
      {children}
    </div>
  );
}

/**
 * The page fitted into a 160 × 220 box. `play` oracles [the canvas; the
 * box]: the page is painted (non-white pixels on the canvas) and shown; its
 * CSS size fits the box and fills it along one side — the page keeps its
 * aspect ratio, as an `<img>` with `object-fit: contain` would.
 */
export const Default: Story = {
  render: () => (
    <Frame>
      <PdfThumbnail src={studyRegulationPdfUrl()} {...BOX} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = await waitFor(() => {
      const c = canvasElement.querySelector("canvas");
      if (!c || !canvasHasInk(c)) throw new Error("page not drawn yet");
      return c;
    }, PDF_TIMEOUT);
    await waitFor(() => expect(getComputedStyle(canvas).opacity).toBe("1"));
    const { width, height } = canvas.getBoundingClientRect();
    await expect(width).toBeLessThanOrEqual(BOX.width + 0.5);
    await expect(height).toBeLessThanOrEqual(BOX.height + 0.5);
    await expect(Math.max(width / BOX.width, height / BOX.height)).toBeGreaterThan(0.98);
  },
};

/**
 * A file pdf.js cannot read: `onError` fires and the app shows its own
 * stand-in — here the file icon. The canvas stays invisible.
 */
function BrokenFileDemo() {
  const [failed, setFailed] = useState(false);
  const src = `data:application/pdf;base64,${btoa("kein PDF")}`;
  return (
    <Frame>
      {failed ? (
        <span role="img" aria-label="Vorschau nicht verfügbar" className="text-on-surface-variant">
          <FileText className="size-8" aria-hidden="true" />
        </span>
      ) : null}
      <PdfThumbnail src={src} {...BOX} onError={() => setFailed(true)} className={failed ? "hidden" : undefined} />
    </Frame>
  );
}

/** `play` oracle [ARIA]: the stand-in appears once `onError` has fired. */
export const BrokenFile: Story = {
  render: () => <BrokenFileDemo />,
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("img", { name: "Vorschau nicht verfügbar" }, PDF_TIMEOUT)).toBeVisible();
  },
};

/** `renderPdfFirstPage`: the same page as a data URL, for an `<img>` or a cache. */
function RenderedAheadDemo() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void renderPdfFirstPage(studyRegulationPdfUrl(), BOX.width, BOX.height).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <Frame>
      {url ? <img src={url} alt="Prüfungsordnung, Seite 1" className="max-h-full max-w-full" /> : null}
    </Frame>
  );
}

/**
 * The bitmap rendered ahead of time and shown as an `<img>`. `play` oracles
 * [ARIA; the image]: the image arrives, is a PNG data URL and decodes to a
 * page in the box's proportions (rendered at the device pixel ratio, so its
 * natural size is the box times `devicePixelRatio`).
 */
export const RenderedAhead: Story = {
  render: () => <RenderedAheadDemo />,
  play: async ({ canvasElement }) => {
    const img = (await within(canvasElement).findByRole(
      "img",
      { name: "Prüfungsordnung, Seite 1" },
      PDF_TIMEOUT,
    )) as HTMLImageElement;
    await expect(img.src.startsWith("data:image/png")).toBe(true);
    await waitFor(() => expect(img.naturalWidth).toBeGreaterThan(0));
    const dpr = window.devicePixelRatio || 1;
    const fill = Math.max(img.naturalWidth / (BOX.width * dpr), img.naturalHeight / (BOX.height * dpr));
    await expect(fill).toBeGreaterThan(0.98);
    await expect(fill).toBeLessThanOrEqual(1.01);
  },
};
