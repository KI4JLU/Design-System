import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";
import { fn } from "storybook/test";
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
