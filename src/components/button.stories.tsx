import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ListFilter, Trash2 } from "lucide-react";
import { expect, fn } from "storybook/test";
import { Button } from "./button";
import { resolvedColor } from "../test/fixtures/combobox-panel";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta = {
  title: "Components/Actions/Button",
  component: Button,
  args: { children: "Speichern" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "outline",
        "ghost",
        "destructive",
        "destructive-outline",
        "primary-outline",
        "ghost-destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "field", "icon"],
    },
    asChild: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Playground: switch variant/size with the controls below. */
export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="destructive-outline">Destructive Outline</Button>
      <Button variant="primary-outline">Primary Outline</Button>
      <Button variant="ghost-destructive">Ghost Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

const ActiveTriggerExample = () => {
  const [pressed, setPressed] = useState(true);
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        aria-pressed={pressed}
        onClick={() => setPressed(!pressed)}
      >
        <ListFilter aria-hidden />
        Filter
      </Button>
      <Button variant="ghost" size="sm" aria-pressed={pressed} onClick={() => setPressed(!pressed)}>
        Nur offene
      </Button>
    </div>
  );
};

/**
 * Toggle/active trigger: `outline` and `ghost` style themselves as soon as the
 * call site sets `aria-pressed` (filter toggles) or a Radix trigger carries
 * `data-state="open"` (dropdown open). The ARIA attribute is the API — no
 * extra prop.
 */
export const ActiveTrigger: Story = {
  render: () => <ActiveTriggerExample />,
};

/**
 * Semantic outline toggles: activate (`primary-outline`) / deactivate
 * (`destructive-outline`) — plus `ghost-destructive` for destructive icon
 * actions in rows (e.g. deleting a template).
 */
export const SemanticOutlines: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="primary-outline" size="sm">
        Aktivieren
      </Button>
      <Button variant="destructive-outline" size="sm">
        Deaktivieren
      </Button>
      <Button variant="ghost-destructive" size="icon" aria-label="Vorlage löschen">
        <Trash2 aria-hidden className="h-4 w-4" />
      </Button>
    </div>
  ),
};

/**
 * Delete and remove are always destructive — never `ghost` or `outline` with
 * a trash can. Which variant goes where:
 *
 * - `ghost-destructive` in dialog footers, toolbars and rows
 *   (red text, the error container on hover),
 * - `destructive-outline` for a secondary danger next to other actions,
 * - `destructive` for the confirmation step ("Wirklich löschen?").
 */
export const DeleteActions: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="ghost-destructive">
        <Trash2 aria-hidden className="h-4 w-4" />
        Löschen
      </Button>
      <Button variant="ghost-destructive" size="icon" aria-label="Quelle entfernen">
        <Trash2 aria-hidden className="h-4 w-4" />
      </Button>
      <Button variant="destructive-outline">Zugriff widerrufen</Button>
      <Button variant="destructive">Endgültig löschen</Button>
    </div>
  ),
  // ORACLE: the browser — each button's computed colours against the
  // `--color-error` / `--color-on-error` tokens resolved on a probe element,
  // never the variants' class strings. Both themes resolve their own value.
  play: async ({ canvas, canvasElement }) => {
    const error = resolvedColor(canvasElement, "var(--color-error)");
    const onError = resolvedColor(canvasElement, "var(--color-on-error)");
    for (const name of ["Löschen", "Quelle entfernen", "Zugriff widerrufen"]) {
      await expect(getComputedStyle(canvas.getByRole("button", { name })).color).toBe(error);
    }
    const confirm = getComputedStyle(canvas.getByRole("button", { name: "Endgültig löschen" }));
    await expect(confirm.backgroundColor).toBe(error);
    await expect(confirm.color).toBe(onError);
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon">
        <span aria-hidden>★</span>
      </Button>
    </div>
  ),
};

/** Interaction test: a click fires onClick, and so does the keyboard (Enter). */
export const ClickInteraction: Story = {
  args: { children: "Absenden", onClick: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Absenden" });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button disabled>Default</Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
    </div>
  ),
};

/**
 * `size="field"`: a button in the same row as framed fields (e.g. "Titel",
 * "Rolle", "Erstellen") takes their height and body text, so the row reads
 * as one control group. Pair it with `items-end` when the fields have labels.
 */
export const FieldRow: Story = {
  render: () => (
    <div className="flex max-w-xl items-end gap-2">
      <Input aria-label="Titel" placeholder="z. B. Kurs oder Gruppe" />
      <Select defaultValue="read">
        <SelectTrigger aria-label="Rolle" className="w-36 shrink-0"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="read">Lesen</SelectItem></SelectContent>
      </Select>
      <Button size="field">Erstellen</Button>
      <Button size="field" variant="outline">Abbrechen</Button>
    </div>
  ),
  // ORACLE: the browser's layout — the framed Input's rendered height and
  // font size, measured, not the class string.
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Titel" }).getBoundingClientRect().height;
    const inputFont = getComputedStyle(canvas.getByRole("textbox", { name: "Titel" })).fontSize;
    for (const name of ["Erstellen", "Abbrechen"]) {
      const button = canvas.getByRole("button", { name });
      await expect(Math.round(button.getBoundingClientRect().height)).toBe(Math.round(input));
      await expect(getComputedStyle(button).fontSize).toBe(inputFont);
    }
    await expect(Math.round(canvas.getByRole("combobox", { name: "Rolle" }).getBoundingClientRect().height)).toBe(Math.round(input));
  },
};
