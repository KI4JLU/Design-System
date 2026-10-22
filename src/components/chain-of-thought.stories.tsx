import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTextIcon, ImageIcon, SearchIcon } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./chain-of-thought";

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
