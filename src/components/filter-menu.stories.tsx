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

/** Default state: the label without an addition, as long as the value equals `defaultValue`. */
export const Playground: Story = {
  render: () => <InteractiveExample />,
};

/** A value that differs from the default: the label shows the active choice in parentheses. */
export const ActiveSelection: Story = {
  args: { value: "conversations" },
};
