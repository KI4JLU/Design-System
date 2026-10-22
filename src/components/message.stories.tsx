import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  PencilIcon,
  CopyIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { expect, screen, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { Source, Sources, SourcesContent, SourcesTrigger } from "./sources";
import { keyboardFocusRings } from "../test/fixtures/focus-ring";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "./message";

/**
 * AI Elements `Message` (https://elements.ai-sdk.dev/api/registry/message.json),
 * imported with the shadcn CLI. `MessageResponse` renders its children as given
 * (streamdown is not shipped; the app brings its own markdown rendering).
 */
const meta = {
  title: "Components/Message",
  component: Message,
  args: { from: "assistant" },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

const answer = (
  <MessageResponse>
    <p>
      Die Anmeldefrist für Prüfungen im Wintersemester endet am 15. November.
      Eine Abmeldung ist bis eine Woche vor dem Termin möglich.
    </p>
  </MessageResponse>
);

function Actions() {
  return (
    <MessageActions>
      <MessageAction tooltip="Kopieren">
        <CopyIcon className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Gute Antwort">
        <ThumbsUpIcon className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Schlechte Antwort">
        <ThumbsDownIcon className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Neu generieren">
        <RefreshCcwIcon className="size-4" />
      </MessageAction>
    </MessageActions>
  );
}

/** A question, the answer, and the answer's action row with tooltips. */
export const ActionsRow: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Message from="user">
        <MessageContent>Wann endet die Prüfungsanmeldung?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>{answer}</MessageContent>
        <Actions />
      </Message>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const copy = canvas.getByRole("button", { name: "Kopieren" });
    await userEvent.hover(copy);
    await expect(await screen.findByRole("tooltip")).toHaveTextContent("Kopieren");
    await expect(canvas.getAllByRole("button")).toHaveLength(4);
  },
};

/** The same in the dark theme. */
export const ActionsRowDark: Story = {
  ...ActionsRow,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await ActionsRow.play!(context);
  },
};

/** Three versions of one answer, a toolbar with the branch selector and the actions. */
export const ToolbarWithBranches: Story = {
  render: () => (
    <MessageBranch>
      <MessageBranchContent>
        {[
          <Message from="assistant" key="v1">
            <MessageContent>
              <MessageResponse>
                <p>Version 1: Die Frist endet am 15. November.</p>
              </MessageResponse>
            </MessageContent>
          </Message>,
          <Message from="assistant" key="v2">
            <MessageContent>
              <MessageResponse>
                <p>Version 2: Anmeldeschluss ist der 15. November.</p>
              </MessageResponse>
            </MessageContent>
          </Message>,
          <Message from="assistant" key="v3">
            <MessageContent>
              <MessageResponse>
                <p>Version 3: Bis zum 15. November.</p>
              </MessageResponse>
            </MessageContent>
          </Message>,
        ]}
      </MessageBranchContent>
      <MessageToolbar>
        <MessageBranchSelector>
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
        <Actions />
      </MessageToolbar>
    </MessageBranch>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText("1 von 3")).toBeVisible();
    await expect(canvas.getByText(/^Version 1/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /^Nächste Version/ }));
    await expect(canvas.getByText("2 von 3")).toBeVisible();
    await expect(canvas.getByText(/^Version 2/)).toBeVisible();
    await expect(canvas.getByText(/^Version 1/)).not.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /^Vorherige Version/ }));
    await expect(canvas.getByText("1 von 3")).toBeVisible();
  },
};

/** The same in the dark theme. */
export const ToolbarWithBranchesDark: Story = {
  ...ToolbarWithBranches,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await ToolbarWithBranches.play!(context);
  },
};

const corners = (el: Element) => {
  const s = getComputedStyle(el);
  return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius];
};

/** Distinct line boxes of an element's text: 1 means it did not wrap. */
const lineCount = (el: Element) => {
  const tops = new Set<number>();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) tops.add(Math.round(r.top));
  }
  return tops.size;
};

/**
 * The branch selector's Previous/Next keep the DS icon Button's shape and
 * focus ring (a reference icon Button sits right before the selector).
 */
export const BranchSelectorShape: Story = {
  render: () => (
    <MessageBranch>
      <MessageBranchContent>
        <p key="1">Version 1</p>
        <p key="2">Version 2</p>
      </MessageBranchContent>
      <div className="flex items-center gap-4">
        <Button aria-label="Referenz" size="icon" variant="ghost">
          <CopyIcon className="size-4" />
        </Button>
        <MessageBranchSelector>
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
      </div>
    </MessageBranch>
  ),
  play: async ({ canvas }) => {
    const reference = canvas.getByRole("button", { name: "Referenz" });
    const previous = await canvas.findByRole("button", { name: /^Vorherige Version/ });
    const next = canvas.getByRole("button", { name: /^Nächste Version/ });
    await expect(corners(previous)).toEqual(corners(reference));
    await expect(corners(next)).toEqual(corners(reference));
    const rings = await keyboardFocusRings(reference, previous);
    if (!rings) return; // outside Vitest: no real keyboard
    await expect(rings.reference.boxShadow).toMatch(/rgb\(\d+, \d+, \d+\) 0px 0px 0px 4px/);
    await expect(rings.target).toEqual(rings.reference);
  },
};

/**
 * A narrow answer toolbar (JustRAG's footer at ~360px): the sources trigger
 * and the page „N von M" stay on one line.
 */
export const NarrowToolbar: Story = {
  render: () => (
    <div className="w-[360px]">
      <MessageBranch>
        <MessageBranchContent>
          <p key="1">Version 1</p>
          <p key="2">Version 2</p>
        </MessageBranchContent>
        <MessageToolbar>
          <MessageBranchSelector>
            <MessageBranchPrevious />
            <MessageBranchPage />
            <MessageBranchNext />
          </MessageBranchSelector>
          <Actions />
          <Sources>
            <SourcesTrigger count={4} />
            <SourcesContent>
              <Source href="https://www.uni-giessen.de" title="Startseite" />
            </SourcesContent>
          </Sources>
        </MessageToolbar>
      </MessageBranch>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = await canvas.findByText("1 von 2");
    const trigger = canvas.getByRole("button", { name: "4 Quellen verwendet" });
    await expect(lineCount(page)).toBe(1);
    await expect(lineCount(trigger)).toBe(1);
  },
};

const rgb = (c: string) => c.match(/[\d.]+/g)!.slice(0, 3).map(Number);
const luminance = (c: string) => {
  const [r, g, b] = rgb(c).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const tooltipContent = (text: string) =>
  [...document.querySelectorAll('[data-slot="tooltip-content"]')].find((el) =>
    el.textContent?.includes(text),
  ) as HTMLElement | undefined;

/**
 * A user's message as a primary bubble with its action row; the action
 * tooltip opens over the bubble. Message actions use the inverse surface, so
 * the tooltip stays visible on primary (the DS Tooltip itself, open on the
 * right for comparison, stays primary).
 */
export const TooltipOnPrimaryBubble: Story = {
  render: () => (
    <div className="flex items-start justify-between gap-8 pt-16">
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline">Referenz</Button>
        </TooltipTrigger>
        <TooltipContent>Standard-Tooltip</TooltipContent>
      </Tooltip>
      <div className="flex flex-col items-end gap-1">
        <div
          className="rounded-lg bg-primary px-4 py-3 text-sm text-on-primary"
          data-testid="bubble"
        >
          Wann endet die Prüfungsanmeldung?
        </div>
        <MessageActions>
          <MessageAction tooltip="Bearbeiten">
            <PencilIcon className="size-4" />
          </MessageAction>
          <MessageAction tooltip="Kopieren">
            <CopyIcon className="size-4" />
          </MessageAction>
        </MessageActions>
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Bearbeiten" }));
    await waitFor(() => expect(tooltipContent("Bearbeiten")).toBeDefined());
    const action = getComputedStyle(tooltipContent("Bearbeiten")!);
    const reference = getComputedStyle(tooltipContent("Standard-Tooltip")!);
    const bubble = getComputedStyle(canvas.getByTestId("bubble"));
    await expect(action.backgroundColor).not.toBe(bubble.backgroundColor);
    await expect(action.backgroundColor).not.toBe(reference.backgroundColor);
    // Neither half of the DS Tooltip's primary pair: the text colour changes too.
    await expect(action.color).not.toBe(reference.color);
    await expect(reference.backgroundColor).toBe(bubble.backgroundColor);
    await expect(contrast(action.color, action.backgroundColor)).toBeGreaterThanOrEqual(4.5);
  },
};

/** The same in the dark theme. */
export const TooltipOnPrimaryBubbleDark: Story = {
  ...TooltipOnPrimaryBubble,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await TooltipOnPrimaryBubble.play!(context);
  },
};
