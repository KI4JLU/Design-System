import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ChatStage } from "./chat-stage";
import { PromptSuggestions } from "./prompt-suggestions";
import { Textarea } from "./textarea";

const composer = (
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 pb-4">
    <Textarea aria-label="Nachricht" placeholder="Stelle eine Frage…" />
    <PromptSuggestions title="Vorschläge" suggestions={["Fasse zusammen", "Was sind die Kernaussagen?"]} onSelect={fn()} dismissible />
  </div>
);

const meta = {
  title: "Components/AI/ChatStage",
  component: ChatStage,
  decorators: [(Story) => <div className="flex h-[560px] flex-col bg-surface">{Story()}</div>],
  args: { composer, footer: "Antworten werden aus deinen Quellen generiert. Die KI kann Fehler machen.", footerId: "chat-disclaimer" },
} satisfies Meta<typeof ChatStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    empty: true,
    children: (
      <div className="px-6 pb-6 text-center">
        <h1 className="text-2xl font-semibold text-on-surface">FAQ Test</h1>
        <p className="text-on-surface-variant">Frage mich alles über deine Quellen.</p>
      </div>
    ),
  },
};

export const Conversation: Story = {
  args: {
    children: (
      <div className="flex-1 overflow-y-auto px-6 py-4 text-on-surface">
        {Array.from({ length: 30 }, (_, i) => <p key={i}>Nachricht {i + 1}</p>)}
      </div>
    ),
  },
};
