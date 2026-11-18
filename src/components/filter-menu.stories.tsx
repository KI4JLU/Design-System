import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { FilterMenu } from "./filter-menu";

const OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "conversations", label: "Gespräche" },
  { value: "rating", label: "Bewertung" },
];

const meta = {
  title: "Components/Lists & Filters/FilterMenu",
  component: FilterMenu,
  args: {
    icon: ArrowUpDown,
    label: "Sortieren",
    options: OPTIONS,
    value: "name",
    defaultValue: "name",
    onChange: () => {},
  },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
  },
} satisfies Meta<typeof FilterMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveExample = () => {
  const [value, setValue] = useState("name");
  return (
    <FilterMenu icon={ArrowUpDown} label="Sortieren" options={OPTIONS} value={value} defaultValue="name" onChange={setValue} />
  );
};

/** Default-Zustand: Label ohne Zusatz, solange der Wert dem `defaultValue` entspricht. */
export const Playground: Story = {
  render: () => <InteractiveExample />,
};

/** Vom Default abweichender Wert: das Label zeigt die aktive Auswahl in Klammern. */
export const ActiveSelection: Story = {
  args: { value: "conversations" },
};
