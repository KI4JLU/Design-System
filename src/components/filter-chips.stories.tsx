import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, within } from "storybook/test";
import { Star } from "lucide-react";
import { FilterChips } from "./filter-chips";

const OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "favourites", label: "Favoriten", icon: <Star className="h-4 w-4" aria-hidden /> },
];

const meta = {
  title: "Components/Lists & Filters/FilterChips",
  component: FilterChips,
  args: {
    options: OPTIONS,
    value: "all",
    onValueChange: () => {},
    "aria-label": "Themen filtern",
  },
  argTypes: {
    value: { control: false },
    onValueChange: { control: false },
    onAdd: { control: false },
  },
} satisfies Meta<typeof FilterChips>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The starting set: „Alle", „Favoriten" and the action chip. */
export const Default: Story = {
  args: { onAdd: () => {}, addLabel: "Kategorie hinzufügen" },
};

/** Without `onAdd` there is no action chip — nothing to press, nothing shown. */
export const WithoutAddAction: Story = {};

const InteractiveExample = () => {
  const [value, setValue] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  return (
    <FilterChips
      aria-label="Themen filtern"
      options={[
        ...OPTIONS,
        ...categories.map((name) => ({ value: name, label: name })),
      ]}
      value={value}
      onValueChange={setValue}
      onAdd={() => setCategories((prev) => [...prev, `Kategorie ${prev.length + 1}`])}
      addLabel="Kategorie hinzufügen"
    />
  );
};

/**
 * The real loop: selecting moves the active chip, and „+" appends a category
 * the strip did not have. Both are the CONSUMER's state — the component holds
 * none — which is what this story demonstrates by owning both.
 */
export const Interactive: Story = {
  render: () => <InteractiveExample />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "Alle" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(canvas.getByRole("button", { name: "Favoriten" }));
    await expect(canvas.getByRole("button", { name: "Favoriten" })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("button", { name: "Alle" })).toHaveAttribute("aria-pressed", "false");

    // The action chip adds an option rather than selecting one: the new chip
    // appears and the selection is untouched.
    await userEvent.click(canvas.getByRole("button", { name: "Kategorie hinzufügen" }));
    await expect(canvas.getByRole("button", { name: "Kategorie 1" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Favoriten" })).toHaveAttribute("aria-pressed", "true");
  },
};

/**
 * Enough categories to overflow a narrow viewport.
 *
 * WHAT IT PINS, and it is a layout claim a unit test cannot make: the strip
 * stays ONE ROW and scrolls. Wrapping would grow the chrome above a list as
 * categories are added, moving the list under the reader's cursor — so the
 * chips are `shrink-0` inside an `overflow-x-auto` row, and this measures both
 * halves in Chromium: the row is no taller than a single chip, and its scroll
 * width genuinely exceeds its client width.
 */
export const OverflowsIntoOneScrollingRow: Story = {
  args: {
    onAdd: fn(),
    addLabel: "Kategorie hinzufügen",
    options: [
      ...OPTIONS,
      ...Array.from({ length: 12 }, (_, i) => ({
        value: `c${i}`,
        label: `Sehr lange Kategorie ${i + 1}`,
      })),
    ],
  },
  globals: { viewport: { value: "mobile1" } },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole("group", { name: "Themen filtern" });
    const chip = within(canvasElement).getByRole("button", { name: "Alle" });

    // ORACLE: Chromium's layout. One row = the group is no taller than a chip
    // plus its own border box; two rows would be ~double.
    await expect(group.getBoundingClientRect().height).toBeLessThanOrEqual(
      chip.getBoundingClientRect().height + 2,
    );
    // ...and it really is scrollable rather than clipped.
    await expect(group.scrollWidth).toBeGreaterThan(group.clientWidth);
  },
};
