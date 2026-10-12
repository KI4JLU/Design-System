import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd, KbdGroup } from "./kbd";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  args: { children: "Esc" },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Chord: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-on-surface">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Strg</Kbd>
        <span className="text-xs text-on-surface-variant">+</span>
        <Kbd>K</Kbd>
      </KbdGroup>
    </div>
  ),
};

/** Inside a tooltip the key takes the tooltip's on-primary colors. */
export const InTooltip: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline">Suchen</Button>
        </TooltipTrigger>
        <TooltipContent>
          Suche öffnen{" "}
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
