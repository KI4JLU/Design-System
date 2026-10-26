import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Download, FileImage, FileText, FileType } from "lucide-react";
import { Button } from "./button";
import { DialogFooter } from "./dialog";
import { ImageViewer } from "./image-viewer";
import { Input } from "./input";
import { PreviewBackLink, PreviewDialog } from "./preview-dialog";
import { RichTextEditor } from "./rich-text-editor";

const meta = {
  title: "Components/PreviewDialog",
  component: PreviewDialog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PreviewDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// A small vector picture as a data URL, so the story needs no asset.
const PLAN = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#dbe4f3"/><rect x="80" y="80" width="420" height="300" fill="#0058b0"/><rect x="560" y="80" width="560" height="640" fill="#7aa7d9"/><text x="120" y="250" font-size="64" fill="#fff" font-family="sans-serif">Hörsaal</text></svg>',
)}`;

const downloadButton = (
  <Button variant="ghost" size="icon" aria-label="Herunterladen">
    <Download aria-hidden="true" className="size-4" />
  </Button>
);

/** A text source: the read-only editor on the page colour. */
export const Text: Story = {
  args: {
    icon: FileType,
    title: "Prüfungsordnung 2026",
    subtitle: "Markdown · 42 Wörter · nur Lesen",
    onClose: () => {},
    children: null,
  },
  render: (args) => (
    <PreviewDialog {...args}>
      <RichTextEditor
        bare
        plain
        readOnly
        count="none"
        className="min-h-0 flex-1"
        aria-label={String(args.title)}
        value={"# Prüfungsordnung\n\nDie Prüfung besteht aus einer Klausur von **90 Minuten**."}
        toolbarEnd={downloadButton}
      />
    </PreviewDialog>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.getByRole("dialog", { name: "Prüfungsordnung 2026" })).toBeInTheDocument();
  },
};

/** An image source in `ImageViewer`: zoom, download, copy, fullscreen; drag to pan when zoomed in. */
export const Image: Story = {
  args: {
    icon: FileImage,
    title: "Lageplan Campus",
    subtitle: "Bild · nur Lesen",
    onClose: () => {},
    children: null,
  },
  render: (args) => (
    <PreviewDialog {...args}>
      <ImageViewer src={PLAN} alt="Lageplan Campus" className="min-h-0 flex-1" toolbarEnd={downloadButton} />
    </PreviewDialog>
  ),
};

/** A new document being named: the title is an input, the actions sit in the footer. */
export const WithTitleFieldAndFooter: Story = {
  args: {
    icon: FileText,
    title: "Text einfügen",
    subtitle: "Markdown · neue Quelle",
    onClose: () => {},
    children: null,
  },
  render: (args) => (
    <PreviewDialog
      {...args}
      titleField={<Input variant="title" aria-label="Titel" placeholder="Titel" />}
      footer={(
        <DialogFooter className="items-center">
          <span className="text-sm text-on-surface-variant sm:mr-auto">0 Wörter · 0 Zeichen</span>
          <Button variant="outline">Abbrechen</Button>
          <Button>Text hinzufügen</Button>
        </DialogFooter>
      )}
    >
      <RichTextEditor bare plain count="none" className="min-h-0 flex-1" aria-label="Inhalt" placeholder="Inhalt" />
    </PreviewDialog>
  ),
};

/** Opened from a list: the back link leads the subheader (the viewer's toolbar), not the title. */
export const WithBackLink: Story = {
  args: {
    icon: FileType,
    title: "CERT-Bund Meldung 2026-1042",
    subtitle: "RSS-Meldung · nur Lesen",
    onClose: () => {},
    children: null,
  },
  render: (args) => (
    <PreviewDialog {...args}>
      <RichTextEditor
        bare
        plain
        readOnly
        count="none"
        className="min-h-0 flex-1"
        aria-label="Meldung"
        value="Ein Update für die Meldung."
        toolbarStart={<PreviewBackLink back={{ trail: ["Aktuelles (HRZ)"], onBack: () => {} }} />}
        toolbarEnd={downloadButton}
      />
    </PreviewDialog>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.getByRole("button", { name: "Zurück zu Aktuelles (HRZ)" })).toBeInTheDocument();
  },
};
