import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, Eye, Pencil, Shield, Star } from "lucide-react";
import { IconTile } from "./icon-tile";

const TONES = ["primary", "neutral", "solid", "accent", "tint", "success", "warning", "caution", "error", "info"] as const;

const meta = {
  title: "Components/Data Display/IconTile",
  component: IconTile,
  argTypes: {
    tone: { control: "select", options: TONES },
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
  },
  args: { tone: "primary", size: "md", children: <Eye /> },
} satisfies Meta<typeof IconTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every tone on its container pair. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {TONES.map((tone, i) => (
        <IconTile key={tone} tone={tone}>
          {[<Eye key="e" />, <Pencil key="p" />, <Shield key="s" />, <Star key="st" />, <CircleAlert key="c" />][i % 5]}
        </IconTile>
      ))}
    </div>
  ),
};

/** Four sizes: 28, 36, 40 (round like a card corner, the media of an Item) and 48 px. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconTile size="sm"><Eye /></IconTile>
      <IconTile size="md"><Eye /></IconTile>
      <IconTile size="lg"><Eye /></IconTile>
      <IconTile size="xl"><Eye /></IconTile>
    </div>
  ),
};
