import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { ImageViewer } from "./image-viewer";
import { CAMPUS_PLAN } from "../test/fixtures/sample-files";

/**
 * An image on the design system's surfaces: the toolbar zooms, fits, copies
 * and goes full screen. JLURAG opens it for an image source inside
 * `PreviewDialog` (see `Components/Files/PreviewDialog → Image`); here it
 * stands alone in a 640 × 420 box.
 */
const meta = {
  title: "Components/Files/ImageViewer",
  component: ImageViewer,
  parameters: { layout: "padded" },
  args: { src: CAMPUS_PLAN, alt: "Lageplan Campus" },
  decorators: [
    (Story) => (
      <div className="flex h-[420px] w-[640px] flex-col overflow-hidden rounded-[var(--ui-radius-box)] border border-outline-variant">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ImageViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * **The site plan, fitted.** The plan (840 × 560) is larger than the box, so
 * it opens scaled down to fit.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. it opens below 100% and inside the canvas [the zoom label; the boxes];
 * 2. „Vergrößern" enlarges it, the fit button brings it back [the image's
 *    box before and after].
 */
export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const image = await canvas.findByRole("img", { name: "Lageplan Campus" });
    const fit = await waitFor(() => canvas.getByRole("button", { name: /^Einpassen \(\d+%\)$/ }));
    const percent = Number(/\((\d+)%\)/.exec(fit.getAttribute("aria-label")!)![1]);
    await expect(percent).toBeLessThan(100);

    const area = canvasElement
      .querySelector("[data-slot='image-viewer-canvas']")!
      .getBoundingClientRect();
    const fitted = image.getBoundingClientRect();
    await expect(fitted.width).toBeLessThanOrEqual(area.width);
    await expect(fitted.height).toBeLessThanOrEqual(area.height);

    await userEvent.click(canvas.getByRole("button", { name: "Vergrößern" }));
    await waitFor(() =>
      expect(image.getBoundingClientRect().width).toBeGreaterThan(fitted.width),
    );
    await userEvent.click(canvas.getByRole("button", { name: /^Einpassen/ }));
    await waitFor(() =>
      expect(image.getBoundingClientRect().width).toBeCloseTo(fitted.width, 0),
    );
  },
};

/**
 * **An image that does not load** shows its message in place of the picture.
 *
 * `play` oracle: the default message is visible [the text].
 */
export const LoadError: Story = {
  args: { src: "data:image/png;base64,AAAA", alt: "Kaputtes Bild" },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Das Bild konnte nicht geladen werden."),
    ).toBeVisible();
  },
};
