import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, waitFor, within } from "storybook/test";
import { FilePreview } from "./file-preview";
import { CAMPUS_PLAN, canvasHasInk, studyRegulationPdfUrl } from "../test/fixtures/sample-files";

/**
 * The fixed-size preview of a file — what JLURAG shows when the pointer rests
 * on an attachment or a source. Every kind it can show, side by side.
 */
const meta = {
  title: "Components/Files/FilePreview",
  component: FilePreview,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FilePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One preview with its caption, for the gallery. */
function Labelled({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="m-0 flex flex-col gap-2">
      {children}
      <figcaption className="text-xs text-on-surface-variant">{caption}</figcaption>
    </figure>
  );
}

/**
 * **Every kind of preview**: a picture, a PDF's first page, the start of a
 * text file, a file still loading, a file with no preview (glyph only) and a
 * custom body (a synced feed).
 *
 * `play` (Chromium), oracles in brackets:
 * 1. every preview has the same size, whatever it shows [the boxes against
 *    the first one];
 * 2. the type badge comes from the extension, or `badge` [the text];
 * 3. the PDF's first page is drawn [dark text pixels on its canvas];
 * 4. the loading preview shows a spinner, not the glyph [an animated `svg`].
 */
export const Kinds: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      <Labelled caption="Bild">
        <FilePreview url={CAMPUS_PLAN} mediaType="image/svg+xml" filename="Lageplan.svg" />
      </Labelled>
      <Labelled caption="PDF">
        <FilePreview url={studyRegulationPdfUrl()} mediaType="application/pdf" filename="Pruefungsordnung.pdf" />
      </Labelled>
      <Labelled caption="Text">
        <FilePreview
          filename="Notizen.md"
          text={"Prüfungsordnung\n\nDie Prüfung besteht aus einer Klausur von 90 Minuten. Wiederholungen sind zweimal möglich."}
        />
      </Labelled>
      <Labelled caption="Lädt">
        <FilePreview loading filename="Modulhandbuch.pdf" mediaType="application/pdf" />
      </Labelled>
      <Labelled caption="Ohne Vorschau">
        <FilePreview filename="Termine.xlsx" />
      </Labelled>
      <Labelled caption="Eigener Inhalt">
        <FilePreview badge="RSS">
          <div className="flex flex-col gap-1 p-3 text-xs text-on-surface">
            <span className="font-medium">Uni-News</span>
            <span className="text-on-surface-variant">42 Einträge, zuletzt heute</span>
          </div>
        </FilePreview>
      </Labelled>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const previews = [...canvasElement.querySelectorAll<HTMLElement>("[data-slot='file-preview']")];
    await expect(previews).toHaveLength(6);
    const { width, height } = previews[0].getBoundingClientRect();
    for (const preview of previews) {
      const box = preview.getBoundingClientRect();
      await expect(box.width).toBe(width);
      await expect(box.height).toBe(height);
    }

    const [image, pdf, text, loading, glyph, custom] = previews;
    await expect(within(image).getByText("SVG")).toBeVisible();
    await expect(within(pdf).getByText("PDF")).toBeVisible();
    await expect(within(text).getByText("MD")).toBeVisible();
    await expect(within(glyph).getByText("XLSX")).toBeVisible();
    await expect(within(custom).getByText("RSS")).toBeVisible();
    await expect(canvas.getByRole("img", { name: "Lageplan.svg" })).toBeVisible();

    // Drawn, not just mounted: a fresh canvas is already 300px wide, so the
    // oracle is ink on it — the page's black text.
    await waitFor(() => {
      const el = pdf.querySelector("canvas");
      if (!el || !canvasHasInk(el)) throw new Error("PDF page not drawn yet");
    }, { timeout: 10_000 });

    await expect(loading.querySelector("svg.animate-spin")).not.toBeNull();
  },
};
