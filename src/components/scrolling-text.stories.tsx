import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { ScrollingText } from "./scrolling-text";

/**
 * One line that never wraps: cut with an ellipsis at rest, scrolled to its
 * end under the pointer or the keyboard focus. JLURAG's topic cards title
 * their topic with it (`KbCard.tsx`: `<ScrollingText asChild><button>`); see
 * also `Components/Data Display/Card`. Here it stands in a 220px box.
 */
const meta = {
  title: "Components/Data Display/ScrollingText",
  component: ScrollingText,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-[220px] rounded-[var(--ui-radius-row)] border border-outline-variant p-2 text-sm text-on-surface">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScrollingText>;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG = "Prüfungsordnung Informatik (Master of Science), Fassung 2026";

/**
 * **A name too long for its line**, as a button — the keyboard path.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. at rest it is one line, cut [scroll vs. client width; the box is one
 *    line high];
 * 2. focus measures how far it has to move — exactly what sticks out
 *    [`--scrolling-text-overflow` against the element's own scroll metrics];
 * 3. after the pause it moves left [the computed `text-indent` turns
 *    negative].
 */
export const LongName: Story = {
  render: () => (
    <ScrollingText asChild>
      <button type="button" className="w-full cursor-pointer text-left">
        {LONG}
      </button>
    </ScrollingText>
  ),
  play: async ({ canvas }) => {
    const line = canvas.getByRole("button", { name: LONG });
    const overflow = line.scrollWidth - line.clientWidth;
    await expect(overflow).toBeGreaterThan(0);
    await expect(line.getBoundingClientRect().height).toBeLessThan(
      2 * parseFloat(getComputedStyle(line).lineHeight),
    );

    line.focus();
    await expect(line.style.getPropertyValue("--scrolling-text-overflow")).toBe(`${overflow}px`);
    await waitFor(
      () => expect(parseFloat(getComputedStyle(line).textIndent)).toBeLessThan(0),
      { timeout: 3000 },
    );
    line.blur();
  },
};

/**
 * **A name that fits** does nothing: nothing to scroll.
 *
 * `play` oracle: the measured distance is 0 [`--scrolling-text-overflow`].
 */
export const ShortName: Story = {
  render: () => (
    <ScrollingText asChild>
      <button type="button" className="w-full cursor-pointer text-left">
        Modulhandbuch
      </button>
    </ScrollingText>
  ),
  play: async ({ canvas }) => {
    const line = canvas.getByRole("button", { name: "Modulhandbuch" });
    line.focus();
    await expect(line.style.getPropertyValue("--scrolling-text-overflow")).toBe("0px");
    line.blur();
  },
};
