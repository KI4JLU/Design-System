import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { ColorField } from "./color-field";
import { SettingsRow } from "./settings-dialog";

const meta = {
  title: "Components/ColorField",
  component: ColorField,
} satisfies Meta<typeof ColorField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Zwei Farben eines Verlaufs, als Zeilen mit `SettingsRow`. */
export const Rows: Story = {
  args: { label: "Startfarbe", value: "#0056B3", onChange: () => undefined },
  render: () => {
    const [from, setFrom] = React.useState("#0056B3");
    const [to, setTo] = React.useState("#B46EF7");
    return (
      <div className="max-w-md">
        <div className="mb-2 h-12 rounded-xl" style={{ backgroundImage: `linear-gradient(120deg, ${from}, ${to})` }} />
        <SettingsRow label="Startfarbe" control={<ColorField label="Startfarbe" value={from} onChange={setFrom} />} />
        <SettingsRow label="Endfarbe" control={<ColorField label="Endfarbe" value={to} onChange={setTo} />} />
      </div>
    );
  },
};
