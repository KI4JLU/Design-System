import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";

/**
 * AI Elements `Reasoning` (https://elements.ai-sdk.dev/api/registry/reasoning.json),
 * imported with the AI Elements CLI. The label is the DS `Shimmer` while
 * streaming; `ReasoningContent` renders its string as given (no streamdown).
 */
const meta = {
  title: "Components/Reasoning",
  component: Reasoning,
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Reasoning>;

export default meta;
type Story = StoryObj<typeof meta>;

const REASONING =
  "Die Frage nennt zwei Studiengänge, also suche ich beide Prüfungsordnungen. " +
  "In der Ordnung für Informatik steht die Anmeldefrist in § 12, für Mathematik in § 9. " +
  "Beide Fristen enden vier Wochen vor der Prüfung; das fasse ich zusammen.";

/** While the model reasons: open, the label shimmers „Denke nach …". */
export const Streaming: Story = {
  render: () => (
    <Reasoning isStreaming>
      <ReasoningTrigger />
      <ReasoningContent>{REASONING}</ReasoningContent>
    </Reasoning>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Denke nach …" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(/Prüfungsordnungen/)).toBeVisible();
  },
};

/** Done, opened from history (`defaultOpen`) with the stored duration. */
export const Done: Story = {
  render: () => (
    <Reasoning defaultOpen duration={4}>
      <ReasoningTrigger />
      <ReasoningContent>{REASONING}</ReasoningContent>
    </Reasoning>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Nachgedacht für 4 Sekunden" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};

/** The same in the dark theme. */
export const DoneDark: Story = {
  ...Done,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await Done.play!(context);
  },
};

/** History without `defaultOpen`: closed, only the trigger line shows; a click opens it. */
export const Collapsed: Story = {
  render: () => (
    <Reasoning duration={12}>
      <ReasoningTrigger />
      <ReasoningContent>{REASONING}</ReasoningContent>
    </Reasoning>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Nachgedacht für 12 Sekunden" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText(/Prüfungsordnungen/)).toBeNull();
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};

function LiveCycleDemo() {
  const [isStreaming, setIsStreaming] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsStreaming(false), 1200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Reasoning isStreaming={isStreaming}>
      <ReasoningTrigger />
      <ReasoningContent>{REASONING}</ReasoningContent>
    </Reasoning>
  );
}

/**
 * A simulated 1.2 s stream: open while streaming, then the measured time
 * rounded up („Nachgedacht für 2 Sekunden"), then it folds one second later.
 */
export const LiveCycle: Story = {
  render: () => <LiveCycleDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Denke nach …" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const done = await canvas.findByRole(
      "button",
      { name: "Nachgedacht für 2 Sekunden" },
      { timeout: 3000 },
    );
    await waitFor(() => expect(done).toHaveAttribute("aria-expanded", "false"), {
      timeout: 3000,
    });
  },
};
