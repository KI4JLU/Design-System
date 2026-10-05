import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorSwatch } from "./color-swatch";
import { CATEGORY_COLOR_COUNT, categoryColor } from "../lib/category-color";

const meta = {
  title: "Components/ColorSwatch",
  component: ColorSwatch,
  argTypes: {
    size: { control: "select", options: ["sm", "default"] },
    color: { control: "text" },
  },
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { color: "var(--color-category-6)", label: "Sprecher 1" },
};

/**
 * Sprecher-Legende der Transkription: der Punkt ist Dekoration, der Name
 * daneben trägt die Bedeutung.
 */
export const SpeakerLegend: Story = {
  args: { color: "var(--color-category-1)" },
  render: () => (
    <ul aria-label="Sprecher" className="m-0 flex list-none flex-col gap-2 p-0">
      {Array.from({ length: CATEGORY_COLOR_COUNT }, (_, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
          <ColorSwatch color={`var(--color-category-${i + 1})`} />
          Sprecher {i + 1}
        </li>
      ))}
    </ul>
  ),
};

/** `sm` neben einer Kategorienliste, Farbe stabil per `categoryColor(key)`. */
export const CategoryList: Story = {
  args: { color: "var(--color-category-1)" },
  render: () => (
    <ul aria-label="Kategorien" className="m-0 flex list-none flex-col gap-1.5 p-0">
      {["Vorlesung", "Seminar", "Sprechstunde", "Prüfung"].map((name) => (
        <li key={name} className="flex items-center gap-2 text-sm text-on-surface">
          <ColorSwatch size="sm" color={categoryColor(name)} />
          {name}
        </li>
      ))}
    </ul>
  ),
};

/** Dieselbe Legende im dunklen Theme — die Palette bleibt gleich. */
export const SpeakerLegendDark: Story = {
  ...SpeakerLegend,
  globals: { theme: "dark" },
};
