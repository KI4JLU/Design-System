import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTextIcon, ImageIcon, SearchIcon } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { keyboardFocusRings } from "../test/fixtures/focus-ring";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./chain-of-thought";
import { contrastRatio } from "../test/fixtures/real-pointer";

/**
 * AI Elements `ChainOfThought` (https://elements.ai-sdk.dev/api/registry/chain-of-thought.json),
 * imported with the AI Elements CLI. Search results are the DS `Badge`
 * (tone `secondary`). Closed by default.
 */
const meta = {
  title: "Components/ChainOfThought",
  component: ChainOfThought,
} satisfies Meta<typeof ChainOfThought>;

export default meta;
type Story = StoryObj<typeof meta>;

function Steps() {
  return (
    <>
      <ChainOfThoughtHeader />
      <ChainOfThoughtContent>
        <ChainOfThoughtStep
          icon={SearchIcon}
          label="Prüfungsordnungen durchsucht"
          description="Zwei Treffer in der Wissensdatenbank"
          status="complete"
        >
          <ChainOfThoughtSearchResults>
            <ChainOfThoughtSearchResult>PO Informatik 2024</ChainOfThoughtSearchResult>
            <ChainOfThoughtSearchResult>PO Mathematik 2023</ChainOfThoughtSearchResult>
          </ChainOfThoughtSearchResults>
        </ChainOfThoughtStep>
        <ChainOfThoughtStep
          icon={ImageIcon}
          label="Fristenübersicht gelesen"
          status="complete"
        >
          <ChainOfThoughtImage caption="Anmeldefristen im Wintersemester">
            <svg viewBox="0 0 120 48" role="img" aria-label="Balkendiagramm der Fristen" className="h-24">
              <rect x="4" y="20" width="24" height="28" className="fill-chart-1" />
              <rect x="36" y="8" width="24" height="40" className="fill-chart-2" />
              <rect x="68" y="28" width="24" height="20" className="fill-chart-3" />
            </svg>
          </ChainOfThoughtImage>
        </ChainOfThoughtStep>
        <ChainOfThoughtStep icon={FileTextIcon} label="Antwort wird formuliert" status="active" />
        <ChainOfThoughtStep label="Quellen prüfen" status="pending" />
      </ChainOfThoughtContent>
    </>
  );
}

const STEP_LABELS = [
  "Prüfungsordnungen durchsucht",
  "Fristenübersicht gelesen",
  "Antwort wird formuliert",
  "Quellen prüfen",
];

/** The first opaque background behind `el`. */
function backgroundBehind(el: Element): string {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") return bg;
  }
  return getComputedStyle(document.body).backgroundColor;
}

/** `color` (any CSS colour, possibly translucent) painted over `background`, as opaque rgb(). */
function paintedOver(color: string, background: string): string {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

/** Open, with complete, active and pending steps, search results and an image. */
export const MixedSteps: Story = {
  render: () => (
    <ChainOfThought defaultOpen>
      <Steps />
    </ChainOfThought>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Gedankengang" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(canvas.getByText("PO Informatik 2024")).toBeVisible();
    await expect(canvas.getByText("Anmeldefristen im Wintersemester")).toBeVisible();
    // WCAG 1.4.3: every step label, the pending one included, is at least
    // 4.5:1 against the surface it sits on (alpha composited first).
    for (const label of STEP_LABELS) {
      const el = canvas.getByText(label);
      const bg = backgroundBehind(el);
      const ratio = contrastRatio(paintedOver(getComputedStyle(el).color, bg), bg);
      await expect(ratio, `${label}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/** The same in the dark theme. */
export const MixedStepsDark: Story = {
  ...MixedSteps,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await MixedSteps.play!(context);
  },
};

/** The default: closed, only the header shows; a click opens the steps. */
export const Collapsed: Story = {
  render: () => (
    <ChainOfThought>
      <Steps />
    </ChainOfThought>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("button", { name: "Gedankengang" });
    await expect(header).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText("Prüfungsordnungen durchsucht")).toBeNull();
    await userEvent.click(header);
    await expect(canvas.getByText("Prüfungsordnungen durchsucht")).toBeVisible();
  },
};

/**
 * Keyboard focus: the trigger shows the DS focus ring — the same computed
 * ring as the `Button` before it (DS fix on top of AI Elements).
 */
export const KeyboardFocus: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Button variant="outline">Referenz</Button>
      <ChainOfThought>
        <Steps />
      </ChainOfThought>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reference = canvas.getByRole("button", { name: "Referenz" });
    const target = canvas.getByRole("button", { name: "Gedankengang" });
    const rings = await keyboardFocusRings(reference, target);
    if (!rings) return; // outside Vitest: no real keyboard
    // The Button recipe: a 2px ring outside a 2px offset, i.e. a 4px spread shadow.
    await expect(rings.reference.boxShadow).toMatch(/rgb\(\d+, \d+, \d+\) 0px 0px 0px 4px/);
    await expect(rings.target).toEqual(rings.reference);
  },
};
