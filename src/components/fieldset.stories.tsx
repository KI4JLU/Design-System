import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import { FormControl, FormItem, FormLabel } from "./form";
import {
  Fieldset,
  FieldsetDescription,
  FieldsetLegend,
  FieldsetMessage,
} from "./fieldset";

const meta = {
  title: "Components/Fieldset",
  component: Fieldset,
  args: { error: false, disabled: false },
  // Fail the story test on any axe violation, not just report it.
  parameters: { a11y: { test: "error" } },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

const FORMATS = [
  { id: "txt", label: "Text (.txt)" },
  { id: "srt", label: "Untertitel (.srt)" },
  { id: "vtt", label: "WebVTT (.vtt)" },
  { id: "docx", label: "Word (.docx)" },
];

/**
 * Eine Gruppe von Checkboxen unter einer Legende: die Legende benennt die
 * Gruppe (`role="group"`), jede Checkbox behält ihr eigenes Label.
 */
export const CheckboxGroup: Story = {
  render: (args) => (
    <Fieldset {...args}>
      <FieldsetLegend>Exportformate</FieldsetLegend>
      <FieldsetDescription>Jedes gewählte Format wird als eigene Datei exportiert.</FieldsetDescription>
      {FORMATS.map((format, index) => (
        <div key={format.id} className="flex items-center gap-2">
          <Checkbox id={`format-${format.id}`} defaultChecked={index < 2} />
          <Label htmlFor={`format-${format.id}`}>{format.label}</Label>
        </div>
      ))}
    </Fieldset>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: "Exportformate" });
    await expect(group).toHaveAccessibleDescription(
      "Jedes gewählte Format wird als eigene Datei exportiert.",
    );
  },
};

const ModelsExample = () => {
  const [models, setModels] = useState(["", ""]);
  const error = models.every((m) => !m.trim());
  return (
    <Fieldset error={error}>
      <FieldsetLegend>Sprachmodelle</FieldsetLegend>
      <FieldsetDescription>Die Modell-IDs, die der Übersetzer anbietet.</FieldsetDescription>
      <FieldsetMessage>{error ? "Mindestens ein Modell angeben." : null}</FieldsetMessage>
      {models.map((model, index) => (
        <FormItem key={index}>
          <FormLabel>Modell {index + 1}</FormLabel>
          <FormControl>
            <Input
              value={model}
              placeholder="z. B. gpt-4.1-mini"
              onChange={(event) =>
                setModels(models.map((m, i) => (i === index ? event.target.value : m)))
              }
            />
          </FormControl>
        </FormItem>
      ))}
    </Fieldset>
  );
};

/**
 * Gruppenfehler: `error` färbt die Legende, setzt `aria-invalid` auf die
 * Gruppe und `FieldsetMessage` hängt sich an deren `aria-describedby`.
 * Ein Wert in einem Feld behebt den Fehler.
 */
export const WithError: Story = {
  render: () => <ModelsExample />,
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: "Sprachmodelle" });
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(group).toHaveAccessibleDescription(
      "Die Modell-IDs, die der Übersetzer anbietet. Mindestens ein Modell angeben.",
    );
  },
};

/** `disabled` sperrt alle nativen Steuerelemente der Gruppe auf einmal. */
export const Disabled: Story = {
  render: () => (
    <Fieldset disabled>
      <FieldsetLegend>Echtzeit-Modi</FieldsetLegend>
      <FieldsetDescription>Erst verfügbar, wenn ein Echtzeit-Modell eingetragen ist.</FieldsetDescription>
      <div className="flex items-center gap-2">
        <Checkbox id="mode-live" defaultChecked />
        <Label htmlFor="mode-live">Live-Mitschrift</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="mode-dictation" />
        <Label htmlFor="mode-dictation">Diktat</Label>
      </div>
    </Fieldset>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox", { name: "Live-Mitschrift" })).toBeDisabled();
  },
};
