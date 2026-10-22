import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { useEffect } from "react";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputProvider,
  usePromptInputAttachments,
  type PromptInputAttachmentStatus,
} from "./prompt-input";
import { resolvedColor, resolvedStyle } from "../test/fixtures/combobox-panel";
import { realHover, realUnhover } from "../test/fixtures/real-pointer";

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

// A real 1×1 PNG, so the image chip renders a decoded thumbnail.
const PNG_1PX = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0),
);

/** Adds a text file and an image once (no PDF: its preview needs pdf.js). */
function SeedFileAndImage() {
  const attachments = usePromptInputAttachments();
  useEffect(() => {
    attachments.add([
      new File(["Notizen"], "Notizen.txt", { type: "text/plain" }),
      new File([PNG_1PX], "Foto.png", { type: "image/png" }),
    ]);
    // Seed once on mount; `add` is stable per provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ChipComposer({ className }: { className?: string }) {
  return (
    <PromptInputProvider>
      <PromptInput onSubmit={() => {}} className={className}>
        <SeedFileAndImage />
        <PromptInputAttachments>
          {(file) => <PromptInputAttachment data={file} />}
        </PromptInputAttachments>
      </PromptInput>
    </PromptInputProvider>
  );
}

/** Both seeded chips, once they are rendered (the provider adds files asynchronously). */
const findChips = async (canvasElement: HTMLElement) => {
  let chips: HTMLElement[] = [];
  await waitFor(() => {
    chips = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="prompt-input-attachments"] > div')];
    expect(chips).toHaveLength(2);
  });
  return chips;
};

/** Hovers `chip` and returns its preview once it is placed and its open animation has ended. */
const openPreview = async (chip: HTMLElement, hover: (el: HTMLElement) => Promise<void>) => {
  await hover(chip);
  let preview: HTMLElement | null = null;
  await waitFor(() => {
    preview = document.body.querySelector<HTMLElement>('[data-radix-popper-content-wrapper] [data-state="open"]');
    expect(preview).not.toBeNull();
  });
  const el = preview as unknown as HTMLElement;
  await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished));
  return el;
};

const TRANSPARENT = "rgba(0, 0, 0, 0)";

/**
 * The chip as the composer shows it: the file glyph sits on the chip without
 * a box (only an image thumbnail keeps its rounded frame), the remove × in
 * the corner is red like every delete action, and the hover preview opens
 * above the chip, so it does not cover the composer or the suggestions under
 * it.
 */
export const ChipAndPreview: Story = {
  args: UploadStatus.args,
  render: () => <ChipComposer className="mx-auto mt-72 max-w-3xl" />,
  // ORACLE: the browser — computed colours against tokens resolved on probe
  // elements, and layout boxes (`getBoundingClientRect`); nothing is read
  // from the component's class strings or state.
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const [fileChip, imageChip] = await findChips(canvasElement);

    await step("the file glyph has no box, the image thumbnail keeps its frame", async () => {
      const glyph = [...fileChip.querySelectorAll("svg")].find((svg) => !svg.closest("button"));
      await expect(glyph).toBeDefined();
      for (let el = glyph!.parentElement; el && el !== fileChip; el = el.parentElement) {
        await expect(getComputedStyle(el).backgroundColor).toBe(TRANSPARENT);
        await expect(getComputedStyle(el).borderTopLeftRadius).toBe("0px");
      }
      const thumbnail = imageChip.querySelector("img")!;
      const frame = thumbnail.parentElement!;
      await expect(getComputedStyle(frame).backgroundColor).toBe(
        resolvedStyle(canvasElement, "backgroundColor", "var(--color-surface)"),
      );
      await expect(getComputedStyle(frame).borderTopLeftRadius).not.toBe("0px");
    });

    await step("the remove × is red", async () => {
      const error = resolvedColor(canvasElement, "var(--color-error)");
      const removes = canvas.getAllByRole("button", { name: "Remove attachment" });
      await expect(removes).toHaveLength(2);
      for (const remove of removes) {
        await expect(getComputedStyle(remove).color).toBe(error);
      }
    });

    await step("the preview opens above the chip", async () => {
      const preview = await openPreview(fileChip, (el) => userEvent.hover(el));
      await expect(preview.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        fileChip.getBoundingClientRect().top,
      );
      await userEvent.unhover(fileChip);
    });

    // The real Playwright pointer (`realHover`), so `:hover` applies; skipped
    // in the Storybook UI, outside the Vitest runner.
    await step("the remove × lays the error container under itself on hover", async () => {
      const remove = canvas.getAllByRole("button", { name: "Remove attachment" })[0];
      if (!(await realHover(remove))) return;
      await expect(getComputedStyle(remove).backgroundColor).toBe(
        resolvedStyle(canvasElement, "backgroundColor", "var(--color-error-container)"),
      );
      await expect(getComputedStyle(remove).color).toBe(
        resolvedColor(canvasElement, "var(--color-on-error-container)"),
      );
      await realUnhover(remove);
    });
  },
};

/** The same chip in the dark theme: the red ×, its hover and the preview placement. */
export const ChipAndPreviewDark: Story = {
  ...ChipAndPreview,
  globals: { theme: "dark" },
  play: async (context) => {
    // The story really runs dark (`ThemeProvider` is the only writer of `<html data-theme>`).
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await ChipAndPreview.play!(context);
  },
};

/**
 * With no room above (the composer at the top of the page), the preview
 * still flips below the chip — the top default keeps Radix's collision
 * handling.
 */
export const PreviewFlipsBelow: Story = {
  args: UploadStatus.args,
  render: () => <ChipComposer className="mx-auto max-w-3xl" />,
  // ORACLE: layout boxes — the preview's top against the chip's bottom.
  play: async ({ canvasElement, userEvent }) => {
    const [fileChip] = await findChips(canvasElement);
    const preview = await openPreview(fileChip, (el) => userEvent.hover(el));
    await expect(preview.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      fileChip.getBoundingClientRect().bottom,
    );
  },
};
