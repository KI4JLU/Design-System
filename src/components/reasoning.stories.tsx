import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";
import { reducedMotionSets } from "../test/fixtures/ai-display";

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

const REASONING = [
  "Die Frage nennt zwei Studiengänge, also suche ich beide Prüfungsordnungen.",
  "In der Ordnung für Informatik steht die Anmeldefrist in § 12, für Mathematik in § 9.",
  "Beide Fristen enden vier Wochen vor der Prüfung; das fasse ich zusammen.",
];

const Text = () => (
  <div className="space-y-2">
    {REASONING.map((line) => (
      <p key={line} className="m-0">
        {line}
      </p>
    ))}
  </div>
);

/**
 * While the model reasons: the label shimmers „Denke nach …" and the text
 * is open. With reduced motion the label reads as plain muted text.
 */
export const Streaming: Story = {
  render: () => (
    <Reasoning isStreaming>
      <ReasoningTrigger />
      <ReasoningContent>
        <Text />
      </ReasoningContent>
    </Reasoning>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Denke nach …" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const shimmer = canvas.getByText("Denke nach …");
    // The keyframe runs in normal mode …
    await expect(getComputedStyle(shimmer).animationName).toBe("shimmer");
    // … and the loaded CSS switches it off under prefers-reduced-motion.
    await expect(reducedMotionSets("motion-reduce:animate-none", "animation-name", "none")).toBe(true);
  },
};

/** Done, as loaded from history: the stored duration, still open (`defaultOpen`). */
export const Done: Story = {
  render: () => (
    <Reasoning duration={4}>
      <ReasoningTrigger />
      <ReasoningContent>
        <Text />
      </ReasoningContent>
    </Reasoning>
  ),
};

/** Done and folded: only the trigger line shows; a click or Enter opens it. */
export const Collapsed: Story = {
  render: () => (
    <Reasoning defaultOpen={false} duration={12}>
      <ReasoningTrigger />
      <ReasoningContent>
        <Text />
      </ReasoningContent>
    </Reasoning>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Nachgedacht für 12 Sekunden" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText(REASONING[0])).not.toBeInTheDocument();
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(REASONING[0])).toBeVisible();
  },
};

const STREAM_MS = 1200;

function LiveStream() {
  const [streaming, setStreaming] = useState(false);
  const [shown, setShown] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    setShown(0);
    setStreaming(true);
    REASONING.forEach((_, i) => {
      timers.current.push(setTimeout(() => setShown(i + 1), ((i + 1) * STREAM_MS) / (REASONING.length + 1)));
    });
    timers.current.push(setTimeout(() => setStreaming(false), STREAM_MS));
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={start} disabled={streaming}>
        Antwort simulieren
      </Button>
      <Reasoning isStreaming={streaming} defaultOpen={false}>
        <ReasoningTrigger />
        <ReasoningContent>
          <div className="space-y-2">
            {REASONING.slice(0, shown).map((line) => (
              <p key={line} className="m-0">
                {line}
              </p>
            ))}
          </div>
        </ReasoningContent>
      </Reasoning>
    </div>
  );
}

/**
 * The whole cycle: „Antwort simulieren" streams for 1.2 s. The text opens
 * when the stream starts, the label then shows the time (rounded up to
 * whole seconds) and the text folds one second later.
 */
export const LiveCycle: Story = {
  render: () => <LiveStream />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Antwort simulieren" }));
    const trigger = await canvas.findByRole("button", { name: "Denke nach …" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(trigger).toHaveAccessibleName(/^Nachgedacht für \d+ Sekunden?$/), {
      timeout: 3000,
    });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"), { timeout: 3000 });
  },
};

/**
 * The app's UI is German but the model reasons in English: `lang` on
 * `ReasoningContent` lets screen readers switch voice, and
 * `getThinkingMessage` replaces the label (here with the app's own words).
 */
export const OtherLanguage: Story = {
  render: () => (
    <Reasoning duration={3}>
      <ReasoningTrigger
        getThinkingMessage={(streaming, duration) =>
          streaming ? "Denkt nach …" : `Gedankengang (${duration ?? "?"} s)`
        }
      />
      <ReasoningContent lang="en">
        <p className="m-0">
          The user asks about two degree programmes, so I look up both examination regulations.
        </p>
      </ReasoningContent>
    </Reasoning>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Gedankengang (3 s)" })).toBeInTheDocument();
    await expect(canvas.getByText(/The user asks/).closest("[lang]")).toHaveAttribute("lang", "en");
  },
};
