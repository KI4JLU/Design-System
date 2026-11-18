import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Card } from "./card";
import { FormItem, FormLabel, FormControl, FormMessage } from "./form";

const meta = {
  title: "Components/Forms/Textarea",
  component: Textarea,
  args: { placeholder: "System-Prompt eingeben…" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "inline"],
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
  args: { disabled: true, value: "Nicht editierbar" },
};

/** In den Form-Primitives: Label, aria-Verdrahtung und Fehlertext inklusive. */
export const InFormItem: Story = {
  render: () => (
    <FormItem className="max-w-sm" error="Der Prompt darf nicht leer sein.">
      <FormLabel>System-Prompt</FormLabel>
      <FormControl>
        <Textarea rows={4} defaultValue="" />
      </FormControl>
      <FormMessage />
    </FormItem>
  ),
};

/**
 * Randloses In-Flow-Feld für Composer in einer Card — die Card liefert den
 * Rahmen, das Feld selbst bleibt unsichtbar (Antwort-Composer-Muster).
 */
export const Inline: Story = {
  render: () => (
    <Card className="max-w-md">
      <Textarea
        variant="inline"
        rows={3}
        placeholder="Antwortnachricht eingeben…"
        aria-label="Antwortnachricht"
        className="resize-none px-4 py-3"
      />
      <div className="flex items-center justify-end px-3 py-2">
        <Button size="sm">Senden</Button>
      </div>
    </Card>
  ),
};
