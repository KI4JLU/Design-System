import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Button } from "./button";
import { Source, Sources, SourcesContent, SourcesTrigger } from "./sources";
import { keyboardFocusRings } from "../test/fixtures/focus-ring";
import { realHover } from "../test/fixtures/real-pointer";

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
    await expect(canvas.getByRole("link", { name: /^Modulhandbuch 2024/ })).toBeVisible();
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

/**
 * Keyboard focus: the trigger and the source links take the DS Button's
 * focus ring (a reference Button sits right before the trigger).
 */
export const KeyboardFocus: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Button variant="outline">Referenz</Button>
      <Sources defaultOpen>
        <SourcesTrigger count={sources.length} />
        <SourcesContent>
          {sources.map((s) => (
            <Source href={s.href} key={s.href} title={s.title} />
          ))}
        </SourcesContent>
      </Sources>
    </div>
  ),
  play: async ({ canvas }) => {
    const reference = canvas.getByRole("button", { name: "Referenz" });
    const trigger = canvas.getByRole("button", { name: "3 Quellen verwendet" });
    const triggerRings = await keyboardFocusRings(reference, trigger);
    if (!triggerRings) return; // outside Vitest: no real keyboard
    await expect(triggerRings.reference.boxShadow).toMatch(/rgb\(\d+, \d+, \d+\) 0px 0px 0px 4px/);
    await expect(triggerRings.target).toEqual(triggerRings.reference);
    const link = canvas.getByRole("link", { name: /^Prüfungsordnung Informatik/ });
    const linkRings = await keyboardFocusRings(trigger, link);
    await expect(linkRings!.target).toEqual(triggerRings.reference);
  },
};

/** Hover recolours the trigger; the chevron turns when the list is open. */
export const HoverAndChevron: Story = {
  ...Closed,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "3 Quellen verwendet" });
    const chevron = trigger.querySelector("svg")!;
    // Tailwind 4's rotate-* sets the CSS `rotate` property, not `transform`.
    await expect(getComputedStyle(chevron).rotate).toBe("none");
    await userEvent.click(trigger);
    await waitFor(async () => {
      await Promise.all(chevron.getAnimations().map((a) => a.finished));
      await expect(getComputedStyle(chevron).rotate).toBe("180deg");
    });
    const rest = getComputedStyle(trigger).color;
    (document.activeElement as HTMLElement | null)?.blur();
    if (!(await realHover(trigger))) return; // outside Vitest: no real pointer
    await waitFor(() => expect(getComputedStyle(trigger).color).not.toBe(rest));
  },
};
