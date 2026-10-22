import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

/**
 * The shadcn/ui `collapsible` (https://ui.shadcn.com/r/styles/new-york-v4/collapsible.json),
 * imported with the shadcn CLI: Radix Collapsible, unstyled. The base of
 * `Reasoning`, `ChainOfThought` and `Task`.
 */
const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger>Details anzeigen</CollapsibleTrigger>
      <CollapsibleContent>
        <p>Die Anmeldefrist endet vier Wochen vor der Prüfung.</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Details anzeigen" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(/Anmeldefrist/)).toBeVisible();
  },
};
