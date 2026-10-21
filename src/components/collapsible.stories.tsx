import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "./button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The unstyled disclosure primitive: a button shows and hides a region.
 * Bring the look with `asChild` (here a `Button`) or use `Reasoning`,
 * `ChainOfThought` or `Task`, which are built on it.
 */
export const Default: Story = {
  render: () => (
    <Collapsible className="max-w-md space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="group">
          Weitere Angaben
          <ChevronDown aria-hidden="true" className="size-4 transition-transform motion-reduce:transition-none group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface">
        Die Datei wurde am 14. Oktober hochgeladen und in drei Themen verwendet.
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Weitere Angaben" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const region = canvas.getByText(/hochgeladen/);
    await expect(trigger).toHaveAttribute("aria-controls", region.id);
    await userEvent.keyboard(" ");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
