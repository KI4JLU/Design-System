import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Badge } from "./badge";
import { Button } from "./button";
import { ChatStage } from "./chat-stage";
import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport,
} from "./message-scroller";
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
 * A consumer that moves its column towards the start edge — to keep clear of
 * the shell's floating card — sets `--chat-axis-shift` on the stage. The
 * `header` row and the scroller's jump button follow; the consumer moves its
 * own boxes (here the composer) by the same length. Scroll up to see the
 * button: it sits on the composer's axis, not the stage's.
 */
export const ShiftedAxis: Story = {
  name: "Shifted axis",
  args: {
    style: { "--chat-axis-shift": "120px" } as React.CSSProperties,
    header: <Badge tone="primary">Rolle: Assistent</Badge>,
    composer: (
      <div className="relative left-[calc(-1_*_var(--chat-axis-shift,0px))] mx-auto w-full max-w-md px-6 pb-4">
        <Textarea aria-label="Nachricht" placeholder="Stelle eine Frage…" />
      </div>
    ),
    children: (
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="relative left-[calc(-1_*_var(--chat-axis-shift,0px))] mx-auto w-full max-w-md px-6 py-4 text-on-surface">
              {Array.from({ length: 30 }, (_, i) => (
                <MessageScrollerItem key={i} messageId={`m${i}`}>Nachricht {i + 1}</MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    ),
  },
};
