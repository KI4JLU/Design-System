import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./avatar";

const meta = {
  title: "Components/Data Display/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { initials: "JL", "aria-label": "Justus Liebig" },
};

export const Sizes: Story = {
  args: { initials: "JL" },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="JL" size="sm" aria-label="Justus Liebig" />
      <Avatar initials="JL" aria-label="Justus Liebig" />
      <Avatar initials="JL" size="lg" aria-label="Justus Liebig" />
    </div>
  ),
};

/** Präsenz-Punkt (`online`) — Status gehört mit ins Label. */
export const Online: Story = {
  args: { initials: "JL" },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="JL" size="sm" online aria-label="Justus Liebig, online" />
      <Avatar initials="JL" online aria-label="Justus Liebig, online" />
      <Avatar initials="JL" size="lg" online aria-label="Justus Liebig, online" />
    </div>
  ),
};

/** Typischer Einsatz: Avatar + Name/Meta in einer Zeile (Sidebar, Gesprächsliste). */
export const WithText: Story = {
  args: { initials: "JL" },
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar initials="JL" online />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-on-surface">Justus Liebig</span>
        <span className="text-xs text-on-surface-variant">justus.liebig@uni-giessen.de</span>
      </div>
    </div>
  ),
};
