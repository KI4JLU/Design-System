import type { Meta, StoryObj } from "@storybook/react-vite";
import { AttachmentChip } from "./prompt-input";
import { FilePreview } from "./file-preview";
import { HoverPreviewGroup } from "./hover-preview";

const meta = {
  title: "Components/Files/AttachmentChip",
  component: AttachmentChip,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AttachmentChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A sent message's attachments: the composer's chips, read-only (no
 * `onRemove`). Rest the pointer on a chip for its preview; in a
 * `HoverPreviewGroup` the one card then follows to the next chip. The chip
 * with the cut-off name writes it out under the preview.
 */
export const ReadOnly: Story = {
  args: { filename: "Pruefungsordnung-2026.pdf", mediaType: "application/pdf" },
  render: () => (
    <div className="flex flex-wrap justify-end gap-2 pt-56">
      <HoverPreviewGroup>
        <AttachmentChip filename="Pruefungsordnung-2026.pdf" mediaType="application/pdf" />
        <AttachmentChip filename="Notizen.md" mediaType="text/markdown" />
        <AttachmentChip filename="Bildschirmfoto.png" mediaType="image/png" />
        <AttachmentChip
          className="max-w-48"
          filename="one-data-strategy-to-rule-them-all-a-comparative-perspective.pdf"
          mediaType="application/pdf"
        />
      </HoverPreviewGroup>
    </div>
  ),
};

/** `FilePreview`'s text page and custom body (a synced source's facts). */
export const PreviewBodies: Story = {
  args: { filename: "Notizen.md" },
  render: () => (
    <div className="flex gap-4">
      <FilePreview filename="Notizen.md" text={"Prüfungsordnung\n\nDie Prüfung besteht aus einer Klausur von 90 Minuten. Wiederholungen sind zweimal möglich."} />
      <FilePreview badge="RSS">
        <p className="m-0 line-clamp-2 font-medium">Aktuelles (HRZ)</p>
        <p className="m-0 text-on-surface-variant">13 Einträge · aktiv</p>
        <p className="m-0 text-on-surface-variant">Täglich</p>
      </FilePreview>
    </div>
  ),
};
