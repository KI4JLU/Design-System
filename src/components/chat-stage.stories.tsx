import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Badge } from "./badge";
import { Button } from "./button";
import { ChatStage, ChatStageColumn } from "./chat-stage";
import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport,
} from "./message-scroller";
import { PromptSuggestions } from "./prompt-suggestions";
import { Textarea } from "./textarea";

const composer = (
  <div className="flex flex-col gap-4">
    <Textarea aria-label="Nachricht" placeholder="Stelle eine Frage…" />
    <PromptSuggestions title="Vorschläge" suggestions={["Fasse zusammen", "Was sind die Kernaussagen?"]} onSelect={fn()} dismissible />
  </div>
);

const transcript = (
  <MessageScrollerProvider>
    <MessageScroller>
      <MessageScrollerViewport>
        <ChatStageColumn asChild>
          <MessageScrollerContent className="py-4 text-on-surface">
            {Array.from({ length: 30 }, (_, i) => (
              <MessageScrollerItem key={i} messageId={`m${i}`}>Nachricht {i + 1}</MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </ChatStageColumn>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  </MessageScrollerProvider>
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
      <ChatStageColumn className="pb-6 text-center">
        <h1 className="text-2xl font-semibold text-on-surface">FAQ Test</h1>
        <p className="text-on-surface-variant">Frage mich alles über deine Quellen.</p>
      </ChatStageColumn>
    ),
  },
};

export const Conversation: Story = {
  args: { children: transcript },
};

/**
 * Anchored at the top (`align="start"`): content that grows — an editor
 * opening under the title — grows downwards, and the title stays put. The
 * disclaimer stays at the bottom.
 */
export const EmptyAtTop: Story = {
  name: "Empty, at the top",
  args: { ...Empty.args, align: "start" },
};

/** The row above the content: what the chat was started as, and a way back. */
export const WithHeader: Story = {
  args: {
    ...Empty.args,
    header: (
      <>
        <Button variant="ghost" size="sm">Zurück zur Startseite</Button>
        <Badge tone="primary">Rolle: Assistent</Badge>
      </>
    ),
  },
};

/**
 * Beside the shell's open card: `AppShellLayout` publishes what the card
 * covers as `--app-shell-bubble-inset` (here set by hand, 320px). The stage
 * moves its centre axis towards the start by what the column is missing
 * beside the card — and the header row, the transcript (`ChatStageColumn`),
 * the composer, the disclaimer and the scroller's jump button all follow.
 * Scroll up to see the button on the column's axis.
 */
export const BesideTheCard: Story = {
  name: "Beside the card",
  decorators: [(Story) => <div style={{ "--app-shell-bubble-inset": "320px" } as React.CSSProperties} className="flex h-[560px] flex-col">{Story()}</div>],
  args: {
    header: (
      <>
        <Button variant="ghost" size="sm">Zurück zur Startseite</Button>
        <Badge tone="primary">Rolle: Assistent für Prüfungsordnungen und Studienverlaufspläne</Badge>
      </>
    ),
    children: transcript,
  },
};
