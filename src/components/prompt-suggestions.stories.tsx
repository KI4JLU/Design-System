import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";
import { expect, fn } from "storybook/test";
import { PromptSuggestions } from "./prompt-suggestions";

const meta = {
  title: "Components/AI/PromptSuggestions",
  component: PromptSuggestions,
  args: {
    title: "Vorschläge",
    suggestions: [
      "Fasse die wichtigsten Punkte meiner Dokumente zusammen",
      "Was sind die wichtigsten Erkenntnisse?",
      "Erstelle eine Gliederung",
      "Welche offenen Fragen gibt es?",
      "Erkläre die Begriffe",
    ],
    previousLabel: "Zurück",
    nextLabel: "Weiter",
    dismissLabel: "Schließen",
    onDismiss: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof PromptSuggestions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIcon: Story = { args: { icon: <Sparkles aria-hidden="true" /> } };
export const Disabled: Story = { args: { disabled: true } };
/** Still loading: placeholder chips stand in for the suggestions. */
export const Loading: Story = { args: { suggestions: [], loading: true } };
/** No suggestions (yet): nothing to see, but the space is kept. */
export const ReservedSpace: Story = { args: { suggestions: [], reserveSpace: true } };

/**
 * With `reserveSpace` the component is as high with nothing, with
 * placeholders and with suggestions — also when the row overflows and the
 * stepping arrows join, and without a headline or close button.
 */
export const SameHeightInEveryState: Story = {
  args: { reserveSpace: true },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      {[
        { title: "Vorschläge" as const, onDismiss: args.onDismiss },
        { title: undefined, onDismiss: undefined },
      ].map((header, i) => (
        <div key={i} data-testid="group" className="flex flex-col gap-6">
          <PromptSuggestions {...args} {...header} suggestions={[]} />
          <PromptSuggestions {...args} {...header} suggestions={[]} loading />
          <PromptSuggestions {...args} {...header} />
          <PromptSuggestions {...args} {...header} icon={<Sparkles aria-hidden="true" />} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const group of canvasElement.querySelectorAll('[data-testid="group"]')) {
      const states = Array.from(group.querySelectorAll<HTMLElement>('[data-slot="prompt-suggestions"]'));
      await expect(states).toHaveLength(4);
      // The filled rows overflow 320px, so their arrows are there.
      await expect(states[2].querySelector('button[aria-label="Weiter"]')).not.toBeNull();
      const heights = states.map((el) => el.getBoundingClientRect().height);
      await expect(heights[0]).toBeGreaterThan(0);
      for (const h of heights) await expect(h).toBe(heights[0]);
    }
  },
};
