import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Source, Sources, SourcesContent, SourcesTrigger } from "./sources";

/**
 * AI Elements `Sources` (https://elements.ai-sdk.dev/api/registry/sources.json),
 * imported with the shadcn CLI. Closed by default; the trigger opens the list.
 */
const meta = {
  title: "Components/Sources",
  component: Sources,
} satisfies Meta<typeof Sources>;

export default meta;
type Story = StoryObj<typeof meta>;

const sources = [
  { href: "https://www.uni-giessen.de/de/studium/pruefungen", title: "Prüfungsordnung Informatik" },
  { href: "https://www.uni-giessen.de/de/studium/module", title: "Modulhandbuch 2024" },
  { href: "https://www.uni-giessen.de/de/studium/fristen", title: "Fristen und Termine" },
];

/** The collapsed state: the trigger with the source count. */
export const Closed: Story = {
  render: () => (
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((s) => (
          <Source href={s.href} key={s.href} title={s.title} />
        ))}
      </SourcesContent>
    </Sources>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "3 Quellen verwendet" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryAllByRole("link")).toHaveLength(0);
  },
};

/** Opened through the trigger: the sources as links. */
export const Open: Story = {
  ...Closed,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "3 Quellen verwendet" });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: "Modulhandbuch 2024" })).toBeVisible();
    await expect(canvas.getAllByRole("link")).toHaveLength(3);
  },
};

/** The collapsed state in the dark theme. */
export const ClosedDark: Story = {
  ...Closed,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await Closed.play!(context);
  },
};

/** Opened, in the dark theme. */
export const OpenDark: Story = {
  ...Closed,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await Open.play!(context);
  },
};
