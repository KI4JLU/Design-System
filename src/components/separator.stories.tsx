import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";

/**
 * shadcn/ui `separator`
 * (https://ui.shadcn.com/r/styles/new-york-v4/separator.json), imported with
 * the shadcn CLI as a registry dependency of `button-group`. Radix Separator:
 * decorative by default (hidden from assistive technology).
 */
const meta = {
  title: "Components/Separator",
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A horizontal rule between two blocks. */
export const Horizontal: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-3 text-sm">
      <span>Oben</span>
      <Separator />
      <span>Unten</span>
    </div>
  ),
};

/** A vertical rule between inline items. */
export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Links</span>
      <Separator orientation="vertical" />
      <span>Rechts</span>
    </div>
  ),
};
