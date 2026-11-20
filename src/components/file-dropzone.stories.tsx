import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { FileDropzone } from "./file-dropzone";

/**
 * A drop target for files. JLURAG shows it in an empty sources panel and over
 * the whole window while files are dragged in (`useWindowFileDrag`).
 */
const meta = {
  title: "Components/Files/FileDropzone",
  component: FileDropzone,
  parameters: { layout: "padded" },
  args: {
    title: "Dateien hier ablegen",
    hint: "PDF, DOCX, XLSX, TXT – bis 50 MB",
    onFiles: fn(),
    onBrowse: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A drag event carrying `files`, as the browser sends it. */
function dragEvent(type: string, files: File[]) {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data });
}

/**
 * **The dropzone on the card surface**, with `onBrowse` as its keyboard path.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. it is a named button, and Enter opens the picker [ARIA `button`; the
 *    `onBrowse` call count];
 * 2. files dragged over it highlight it, and leaving clears that
 *    [`data-over`];
 * 3. a drop hands over exactly the dropped files [the `onFiles` call].
 */
export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const zone = canvas.getByRole("button", { name: /Dateien hier ablegen/ });
    zone.focus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onBrowse).toHaveBeenCalledTimes(1);

    const file = new File(["Prüfungsordnung"], "Pruefungsordnung.txt", { type: "text/plain" });
    const target = canvasElement.querySelector<HTMLElement>("[data-slot='file-dropzone']")!;
    // React applies the state after the event, so the attribute is awaited.
    target.dispatchEvent(dragEvent("dragenter", [file]));
    await waitFor(() => expect(target).toHaveAttribute("data-over"));
    target.dispatchEvent(dragEvent("dragleave", [file]));
    await waitFor(() => expect(target).not.toHaveAttribute("data-over"));

    target.dispatchEvent(dragEvent("dragenter", [file]));
    target.dispatchEvent(dragEvent("drop", [file]));
    await waitFor(() => expect(args.onFiles).toHaveBeenCalledTimes(1));
    const dropped = (args.onFiles as ReturnType<typeof fn>).mock.calls[0][0] as File[];
    await expect(dropped.map((f) => f.name)).toEqual(["Pruefungsordnung.txt"]);
    await waitFor(() => expect(target).not.toHaveAttribute("data-over"));
  },
};

/**
 * **`variant="translucent"`** over a coloured page glow: the fill lets the
 * colour through. Without `onBrowse` the zone is not a button — drop only,
 * so an upload button beside it is the keyboard path.
 *
 * `play` oracle: no button role [ARIA].
 */
export const Translucent: Story = {
  args: { variant: "translucent", onBrowse: undefined },
  decorators: [
    (Story) => (
      <div className="bg-linear-to-br from-primary-container to-tertiary-container p-6">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};
