import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookOpen, CircleCheck, ImageIcon, Search } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./chain-of-thought";
import { contrastRatio, effectiveBackground } from "../test/fixtures/ai-display";

const meta = {
  title: "Components/ChainOfThought",
  component: ChainOfThought,
} satisfies Meta<typeof ChainOfThought>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A small bar chart drawn with the chart tokens, as an agent might render one. */
const Chart = () => (
  <svg role="img" aria-label="Anmeldungen je Semester: WS 120, SS 80, WS 150" viewBox="0 0 120 64" className="h-32 w-auto">
    <rect x="10" y="24" width="24" height="40" className="fill-chart-1" />
    <rect x="48" y="37" width="24" height="27" className="fill-chart-2" />
    <rect x="86" y="14" width="24" height="50" className="fill-chart-1" />
  </svg>
);

const Steps = () => (
  <>
    <ChainOfThoughtStep icon={CircleCheck} label="Frage verstanden" description="Gesucht: Anmeldefristen für zwei Studiengänge" />
    <ChainOfThoughtStep icon={Search} label="Suche „Prüfungsordnung Anmeldefrist“">
      <ChainOfThoughtSearchResults>
        <ChainOfThoughtSearchResult>PO Informatik 2024</ChainOfThoughtSearchResult>
        <ChainOfThoughtSearchResult>PO Mathematik 2023</ChainOfThoughtSearchResult>
        <ChainOfThoughtSearchResult>uni-giessen.de/pruefungsamt</ChainOfThoughtSearchResult>
      </ChainOfThoughtSearchResults>
    </ChainOfThoughtStep>
    <ChainOfThoughtStep icon={ImageIcon} label="Statistik des Prüfungsamts gelesen">
      <ChainOfThoughtImage caption="Anmeldungen je Semester (Prüfungsamt, 2025)">
        <Chart />
      </ChainOfThoughtImage>
    </ChainOfThoughtStep>
    <ChainOfThoughtStep
      icon={BookOpen}
      status="active"
      label="Lese § 12 und § 9"
      description="2 von 3 Abschnitten"
    />
    <ChainOfThoughtStep status="pending" label="Antwort formulieren" />
  </>
);

/**
 * Mixed statuses: three steps done, one active (strong text,
 * `aria-current="step"`), one pending (dimmed icon) — with search results
 * and an image.
 */
export const MixedSteps: Story = {
  render: () => (
    <ChainOfThought defaultOpen>
      <ChainOfThoughtHeader />
      <ChainOfThoughtContent>
        <Steps />
      </ChainOfThoughtContent>
    </ChainOfThought>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("button", { name: "Gedankengang" });
    await expect(header).toHaveAttribute("aria-expanded", "true");
    const controlled = canvasElement.ownerDocument.getElementById(header.getAttribute("aria-controls") ?? "");
    await expect(controlled).toContainElement(canvas.getByText("Frage verstanden"));

    const current = canvasElement.querySelectorAll('[aria-current="step"]');
    await expect(current).toHaveLength(1);
    await expect(current[0]).toHaveTextContent("Lese § 12 und § 9");

    // Every step label stays readable (WCAG AA, 4.5:1 for 14px text) — the
    // pending one included, which AI Elements dims below that.
    for (const label of ["Frage verstanden", "Lese § 12 und § 9", "Antwort formulieren"]) {
      const el = canvas.getByText(label);
      const ratio = contrastRatio(getComputedStyle(el).color, effectiveBackground(el));
      await expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    await expect(canvas.getByRole("img", { name: /Anmeldungen je Semester/ })).toBeVisible();
  },
};

/** The same in the dark theme; the play function repeats the contrast check there. */
export const MixedStepsDark: Story = {
  ...MixedSteps,
  globals: { theme: "dark" },
  play: async (context) => {
    await expect(context.canvasElement.ownerDocument.documentElement).toHaveAttribute("data-theme", "dark");
    await MixedSteps.play?.(context);
  },
};

/** Closed (the default): the header alone; it opens on click, Enter or Space. */
export const Collapsed: Story = {
  render: () => (
    <ChainOfThought>
      <ChainOfThoughtHeader>Recherche · 5 Schritte</ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <Steps />
      </ChainOfThoughtContent>
    </ChainOfThought>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("button", { name: "Recherche · 5 Schritte" });
    await expect(header).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText("Frage verstanden")).not.toBeInTheDocument();
    await userEvent.click(header);
    await expect(canvas.getByText("Frage verstanden")).toBeVisible();
  },
};
