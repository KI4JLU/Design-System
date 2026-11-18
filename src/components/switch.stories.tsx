import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Switch } from "./switch";
import { Label } from "./label";

const meta = {
  title: "Components/Forms/Switch",
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { "aria-label": "Aktivieren" },
};

const WithLabelExample = () => {
  const [checked, setChecked] = useState(true);
  return (
    <div className="flex items-center justify-between gap-4 max-w-sm">
      <div className="flex flex-col">
        <Label htmlFor="notify" className="text-sm font-semibold text-on-surface">
          Benachrichtigungen
        </Label>
        <span className="text-xs text-on-surface-variant">
          E-Mail bei neuen Konversationen
        </span>
      </div>
      <Switch id="notify" checked={checked} onCheckedChange={setChecked} />
    </div>
  );
};

/** Typischer Einsatz: Label + Beschreibung links, Switch rechts. */
export const WithLabel: Story = {
  render: () => <WithLabelExample />,
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Switch disabled aria-label="Aus, deaktiviert" />
      <Switch disabled defaultChecked aria-label="An, deaktiviert" />
    </div>
  ),
};
