import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { CheckCheck, ExternalLink, ListFilter, Trash2 } from "lucide-react";
import { expect, fn } from "storybook/test";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
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
      options: ["default", "sm", "lg", "icon", "icon-sm"],
    },
    asChild: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Spielwiese: Variante/Größe über die Controls unten umschalten. */
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
 * Toggle/aktiver Trigger: `outline` und `ghost` stylen sich selbst, sobald die
 * Aufrufstelle `aria-pressed` setzt (Filter-Toggles) oder ein Radix-Trigger
 * `data-state="open"` trägt (Dropdown offen). Das ARIA-Attribut ist die API —
 * kein zusätzliches Prop.
 */
export const ActiveTrigger: Story = {
  render: () => <ActiveTriggerExample />,
};

/**
 * Semantische Outline-Toggles: Aktivieren (`primary-outline`) /
 * Deaktivieren (`destructive-outline`) — plus `ghost-destructive` für
 * destruktive Icon-Aktionen in Zeilen (z. B. Vorlage löschen).
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
 * Größen. `icon-sm` ist ein quadratischer Icon-Button in der Höhe von `sm`
 * (32 px) — etwa für die Aktionen im Kopf einer Dashboard-Kachel
 * („Als gelesen markieren", Website öffnen).
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Icon">
          <span aria-hidden>★</span>
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Icon klein">
          <span aria-hidden>★</span>
        </Button>
      </div>
      <div className="flex max-w-xs items-center gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2">
        <p className="m-0 min-w-0 flex-1 text-sm font-semibold text-on-surface">Uni-News</p>
        <Button size="icon-sm" variant="ghost" aria-label="Uni-News als gelesen markieren">
          <CheckCheck aria-hidden />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Website von Uni-News öffnen" asChild>
          <a href="https://www.uni-giessen.de" target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden />
          </a>
        </Button>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const iconSm = canvas.getByRole("button", { name: "Icon klein" });
    const sm = canvas.getByRole("button", { name: "Small" });
    const box = iconSm.getBoundingClientRect();
    await expect(box.height).toBe(sm.getBoundingClientRect().height);
    await expect(box.width).toBe(box.height);
  },
};

/** Interaktionstest: Klick löst onClick aus, Tastatur (Enter) ebenso. */
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
