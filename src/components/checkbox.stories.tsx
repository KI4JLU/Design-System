import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { "aria-label": "Aktivieren" },
};

/** Typischer Einsatz: Checkbox + klickbares Label. */
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" defaultChecked />
      <Label htmlFor="terms">AGB akzeptieren</Label>
    </div>
  ),
};

const IndeterminateExample = () => {
  const [items, setItems] = useState([true, false, true]);
  const allChecked = items.every(Boolean);
  const someChecked = items.some(Boolean);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="all"
          checked={allChecked ? true : someChecked ? "indeterminate" : false}
          onCheckedChange={(next) => setItems(items.map(() => next === true))}
        />
        <Label htmlFor="all" className="font-semibold">
          Alle auswählen
        </Label>
      </div>
      {items.map((checked, i) => (
        <div key={i} className="ml-6 flex items-center gap-2">
          <Checkbox
            id={`item-${i}`}
            checked={checked}
            onCheckedChange={(next) =>
              setItems(items.map((c, j) => (j === i ? next === true : c)))
            }
          />
          <Label htmlFor={`item-${i}`}>Eintrag {i + 1}</Label>
        </div>
      ))}
    </div>
  );
};

/** `checked="indeterminate"` für Teilauswahl (Alle-auswählen-Muster). */
export const Indeterminate: Story = {
  render: () => <IndeterminateExample />,
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Checkbox disabled aria-label="Aus, deaktiviert" />
      <Checkbox disabled defaultChecked aria-label="An, deaktiviert" />
    </div>
  ),
};

/**
 * `locked`: ein fester Wert, den etwas anderes vorgibt (eine Rolle, eine
 * Richtlinie). Neutral grau statt verblasst wie `disabled`, nicht bedienbar,
 * als deaktiviert angesagt — der zugängliche Name sagt, warum er fest ist.
 * Daneben zum Vergleich `disabled`.
 */
export const Locked: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Checkbox locked checked aria-label="Gewährt (fest durch die Rolle)" />
        <Checkbox locked checked={false} aria-label="Nicht gewährt (fest durch die Rolle)" />
        <span className="text-sm text-on-surface-variant">locked</span>
      </div>
      <div className="flex items-center gap-4">
        <Checkbox disabled defaultChecked aria-label="An, deaktiviert" />
        <Checkbox disabled aria-label="Aus, deaktiviert" />
        <span className="text-sm text-on-surface-variant">disabled</span>
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const on = canvas.getByRole("checkbox", { name: "Gewährt (fest durch die Rolle)" });
    const off = canvas.getByRole("checkbox", { name: "Nicht gewährt (fest durch die Rolle)" });
    for (const box of [on, off]) {
      await expect(box).toBeDisabled();
      await expect(box).toHaveAttribute("data-locked");
      await expect(getComputedStyle(box).opacity).toBe("1");
    }
    await userEvent.click(on);
    await expect(on).toHaveAttribute("aria-checked", "true");
    await expect(off).toHaveAttribute("aria-checked", "false");
    await expect(getComputedStyle(canvas.getByRole("checkbox", { name: "Aus, deaktiviert" })).opacity).toBe("0.6");
  },
};
