import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
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
/**
 * Every box on the stage's axis shares one centre: header row, transcript,
 * composer, disclaimer and (once the user has scrolled up) the jump button.
 * Each box must also stay inside the stage.
 */
async function expectOneAxis(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-slot='chat-stage']")!;
  const viewport = stage.querySelector<HTMLElement>("[data-slot='message-scroller-viewport']")!;
  viewport.scrollTop = 0;
  const button = stage.querySelector<HTMLElement>("[data-slot='message-scroller-button']")!;
  await waitFor(() => expect(button).toHaveAttribute("data-active", "true"));
  // The button eases in: measure once it stands.
  await waitFor(() => expect(getComputedStyle(button).scale).toBe("1"));
  const slots = ["chat-stage-header", "chat-stage-column", "chat-stage-composer", "chat-stage-footer", "message-scroller-button"];
  const boxes = slots.map((slot) => stage.querySelector(`[data-slot='${slot}']`)!.getBoundingClientRect());
  const outer = stage.getBoundingClientRect();
  const centre = (r: DOMRect) => r.left + r.width / 2;
  for (const [i, box] of boxes.entries()) {
    await expect({ slot: slots[i], off: Math.round(Math.abs(centre(box) - centre(boxes[2]))) }).toEqual({ slot: slots[i], off: 0 });
    await expect(box.width).toBeGreaterThan(0);
    await expect(box.left).toBeGreaterThanOrEqual(outer.left - 1);
    await expect(box.right).toBeLessThanOrEqual(outer.right + 1);
  }
  return { stage: outer, composer: boxes[2] };
}

const header = (
  <>
    <Button variant="ghost" size="sm">Zurück zur Startseite</Button>
    <Badge tone="primary">Rolle: Assistent für Prüfungsordnungen und Studienverlaufspläne</Badge>
  </>
);

export const BesideTheCard: Story = {
  name: "Beside the card",
  decorators: [(Story) => <div style={{ "--app-shell-bubble-inset": "320px", width: 1200 } as React.CSSProperties} className="flex h-[560px] flex-col">{Story()}</div>],
  args: { header, children: transcript },
  play: async ({ canvasElement }) => {
    const { stage, composer } = await expectOneAxis(canvasElement);
    // Moved towards the start: the column's right edge clears the 320px card.
    await expect(composer.right).toBeLessThanOrEqual(stage.right - 320 + 1);
  },
};

/**
 * A stage narrower than the main area the shell measured the card against —
 * one pane of several, a preview. The card's inset would leave it no room; the
 * stage keeps half of itself as the column, moved to its start edge, and
 * every box inside it.
 */
export const NarrowBesideTheCard: Story = {
  name: "Narrow, beside the card",
  decorators: [(Story) => <div style={{ "--app-shell-bubble-inset": "336px", width: 280 } as React.CSSProperties} className="flex h-[560px] flex-col">{Story()}</div>],
  args: { header, children: transcript },
  play: async ({ canvasElement }) => {
    const { stage, composer } = await expectOneAxis(canvasElement);
    await expect(Math.round(composer.width)).toBe(Math.round(stage.width / 2));
    await expect(Math.round(composer.left)).toBe(Math.round(stage.left));
  },
};

/**
 * The tightest room the shell leaves beside a small card: a 400px main area,
 * a 128px card (inset 144px), 256px beside it — exactly twice the card. The
 * floor stays out of the way and the column clears the card.
 */
export const AtTheShellsLimit: Story = {
  name: "At the shell's limit",
  decorators: [(Story) => <div style={{ "--app-shell-bubble-inset": "144px", width: 400 } as React.CSSProperties} className="flex h-[560px] flex-col">{Story()}</div>],
  args: { header, children: transcript },
  play: async ({ canvasElement }) => {
    const { stage, composer } = await expectOneAxis(canvasElement);
    await expect(composer.right).toBeLessThanOrEqual(stage.right - 144 + 1);
  },
};
