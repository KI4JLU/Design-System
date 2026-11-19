import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton, SkeletonText } from "./skeleton";

const meta = {
  title: "Components/Feedback/Skeleton",
  component: Skeleton,
  args: { className: "h-4 w-64" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A light sweeps across the bar; the default pulses. */
export const Shimmer: Story = { args: { shimmer: true } };

/** A card's shape: size and radius come from `className`. */
export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Skeleton {...args} className="size-10 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton {...args} className="h-4 w-48" />
        <Skeleton {...args} className="h-4 w-32" />
      </div>
      <Skeleton {...args} className="h-24 w-40 rounded-xl" />
    </div>
  ),
};

/**
 * `delay`: nothing for that long, then the skeleton. A load that is over
 * sooner never shows one.
 */
export const Delayed: Story = {
  args: { delay: 600, shimmer: true },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Skeleton {...args} data-testid="late" />
      {/* After the delay a skeleton's visibility is its own again. */}
      <div className="invisible"><Skeleton {...args} delay={1} data-testid="in-hidden" /></div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const late = canvasElement.querySelector<HTMLElement>('[data-testid="late"]')!;
    const inHidden = canvasElement.querySelector<HTMLElement>('[data-testid="in-hidden"]')!;
    await expect(getComputedStyle(late).visibility).toBe("hidden");
    await new Promise((r) => setTimeout(r, 800));
    await expect(getComputedStyle(late).visibility).toBe("visible");
    await expect(getComputedStyle(inHidden).visibility).toBe("hidden");
  },
};

const text = (
  <>
    <h2 className="m-0 text-2xl font-semibold">Promotionsordnung</h2>
    <p className="m-0 mt-2 text-xs">12 Dokumente · Stand 03.11.2026</p>
    <p className="m-0 mt-3 text-sm leading-6">
      Fragen zur Promotion am Fachbereich: Zulassung, Betreuung, Einreichung und Disputation.
    </p>
  </>
);

/**
 * `SkeletonText` around the real text: every heading and paragraph is a bar
 * as long as its text, so the block is exactly as high as the loaded one.
 */
export const Text: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-8 text-center">
      <SkeletonText data-testid="pending" shimmer align="center">{text}</SkeletonText>
      <div data-testid="loaded">{text}</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const pending = canvasElement.querySelector<HTMLElement>('[data-testid="pending"]')!;
    const loaded = canvasElement.querySelector<HTMLElement>('[data-testid="loaded"]')!;
    await expect(pending.getBoundingClientRect().height).toBe(loaded.getBoundingClientRect().height);
    const bar = pending.querySelector("h2")!;
    const shown = loaded.querySelector("h2")!;
    // The bar is as long as the text, not as the line.
    await expect(bar.getBoundingClientRect().width).toBeLessThan(shown.getBoundingClientRect().width);
    await expect(getComputedStyle(bar).color).toBe("rgba(0, 0, 0, 0)");
    // And it is drawn: a filled bar with the highlight over it.
    await expect(getComputedStyle(bar).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(bar).backgroundImage).toContain("linear-gradient");
  },
};
