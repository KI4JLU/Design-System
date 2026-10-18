import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { useEffect } from "react";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputProvider,
  usePromptInputAttachments,
  type PromptInputAttachmentStatus,
} from "./prompt-input";

const meta = {
  title: "Components/PromptInputAttachment",
  component: PromptInputAttachment,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PromptInputAttachment>;

export default meta;
type Story = StoryObj<typeof meta>;

const FILES: { name: string; status?: PromptInputAttachmentStatus; message?: string }[] = [
  { name: "Pruefungsordnung-2026.pdf" },
  { name: "Entwurf-Novelle.docx", status: "uploading", message: "Wird hochgeladen" },
  { name: "Scan-ohne-Text.pdf", status: "error", message: "In „Scan-ohne-Text.pdf“ wurde kein Text gefunden." },
];

/** Adds the demo files once, the way a file dialog would. */
function SeedFiles() {
  const attachments = usePromptInputAttachments();
  useEffect(() => {
    attachments.add(FILES.map(f => new File(["x"], f.name, { type: "application/pdf" })));
    // Seed once on mount; `add` is stable per provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/**
 * Upload status on the attachment chips: the plain chip, one still uploading
 * (spinner, `aria-busy`), one the consumer refused (error tone; the reason is
 * read out with the chip and shown above the hover preview).
 */
export const UploadStatus: Story = {
  args: { data: { id: "x", type: "file", url: "", mediaType: "application/pdf", filename: "x.pdf" } },
  render: () => (
    <PromptInputProvider>
      <PromptInput onSubmit={() => {}} className="mx-auto max-w-3xl">
        <SeedFiles />
        <PromptInputAttachments>
          {(file) => {
            const meta = FILES.find(f => f.name === file.filename);
            return <PromptInputAttachment data={file} status={meta?.status} statusMessage={meta?.message} />;
          }}
        </PromptInputAttachments>
      </PromptInput>
    </PromptInputProvider>
  ),
  play: async ({ canvasElement }) => {
    const chips = await new Promise<NodeListOf<HTMLElement>>((resolve) => {
      const tick = () => {
        const found = canvasElement.querySelectorAll<HTMLElement>('[data-slot="prompt-input-attachments"] > div');
        if (found.length === FILES.length) resolve(found);
        else requestAnimationFrame(tick);
      };
      tick();
    });
    await expect(chips[0]).not.toHaveAttribute("data-status");
    await expect(chips[1]).toHaveAttribute("aria-busy", "true");
    await expect(chips[2]).toHaveAttribute("data-status", "error");
  },
};
