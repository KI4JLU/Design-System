import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";
import { FormControl, FormDescription, FormItem, FormLabel } from "./form";
import { Button } from "./button";
import { Label } from "./label";

const meta = {
  title: "Components/Select",
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Grundform: Trigger im Formularfeld-Look, Optionen im MenuItem-Vokabular. */
export const Basic: Story = {
  render: () => (
    <div className="max-w-xs">
      <Select defaultValue="sonnet">
        <SelectTrigger aria-label="Modell">
          <SelectValue placeholder="Modell wählen…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="haiku">Claude Haiku</SelectItem>
          <SelectItem value="sonnet">Claude Sonnet</SelectItem>
          <SelectItem value="opus">Claude Opus</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

/** Gruppierte Optionen mit Label. */
export const Grouped: Story = {
  render: () => (
    <div className="max-w-xs">
      <Select>
        <SelectTrigger aria-label="Sprache">
          <SelectValue placeholder="Sprache wählen…" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Häufig verwendet</SelectLabel>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="en">Englisch</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Weitere</SelectLabel>
            <SelectItem value="fr">Französisch</SelectItem>
            <SelectItem value="uk">Ukrainisch</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

/** Im Formularkontext: FormItem verdrahtet Label und Beschreibung. */
export const InForm: Story = {
  render: () => (
    <div className="max-w-xs">
      <FormItem>
        <FormLabel>Standard-Modell</FormLabel>
        <Select defaultValue="haiku">
          {/* FormControl um den Trigger, nicht um Select: das Radix-Root
              rendert kein DOM-Element — id/aria-describedby kämen nie am
              Button an und das Label zeigte ins Leere. */}
          <FormControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="haiku">Claude Haiku</SelectItem>
            <SelectItem value="sonnet">Claude Sonnet</SelectItem>
          </SelectContent>
        </Select>
        <FormDescription>Gilt für neue Elemente.</FormDescription>
      </FormItem>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-xs">
      <Select disabled defaultValue="haiku">
        <SelectTrigger aria-label="Modell">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="haiku">Claude Haiku</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

/**
 * `size="sm"`: kompakter Trigger mit Höhe und Schrift von `Button size="sm"`,
 * damit beide in einer Kachel (Übersetzer: Zielsprache + „Übersetzen")
 * auf einer Linie stehen.
 */
export const Small: Story = {
  parameters: { a11y: { test: "error" } },
  render: () => (
    <div className="flex max-w-sm items-center gap-2">
      <Label htmlFor="target-language" className="sr-only">
        Zielsprache
      </Label>
      <Select defaultValue="en">
        <SelectTrigger id="target-language" size="sm" className="min-w-0 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="de">Deutsch</SelectItem>
          <SelectItem value="en">Englisch</SelectItem>
          <SelectItem value="fr">Französisch</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm">Übersetzen</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("combobox", { name: "Zielsprache" });
    const button = canvas.getByRole("button", { name: "Übersetzen" });
    const t = getComputedStyle(trigger);
    const b = getComputedStyle(button);
    await expect(trigger.getBoundingClientRect().height).toBe(
      button.getBoundingClientRect().height,
    );
    await expect(t.fontSize).toBe(b.fontSize);
    await expect(t.lineHeight).toBe(b.lineHeight);
    await expect(t.fontFamily).toBe(b.fontFamily);
    await expect(t.fontWeight).toBe(b.fontWeight);
  },
};
