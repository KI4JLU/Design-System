import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

/**
 * Edit in place: `Input`, `Textarea` and `SelectTrigger` with
 * `variant="editable"`. The field keeps the look of the text it replaces —
 * font, size, line height, alignment and colour are inherited, so the call
 * site sets them on the element around the field, as it would around that
 * text (className on the field stays layout-only) — and a
 * dashed outline in `currentColor` marks it as editable, so it reads on a
 * gradient and on a plain surface alike. Focus makes the outline solid.
 */
const meta = {
  title: "Components/Edit in place",
  parameters: { layout: "padded", a11y: { test: "error" } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function TitleBlock({ className }: { className?: string }) {
  const [title, setTitle] = useState("Einführung in die Biochemie");
  const [description, setDescription] = useState(
    "Skripte, Übungsblätter und Altklausuren zur Vorlesung im Wintersemester. Fragen werden mit Quellen beantwortet.",
  );
  return (
    <div className={className}>
      <div className="text-center text-3xl leading-tight font-semibold text-balance">
        <Textarea
          variant="editable"
          aria-label="Titel"
          value={title}
          placeholder="Titel des Assistenten"
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
        />
      </div>
      <div className="mt-3 flex justify-center text-xs">
        <Select defaultValue="bio">
          <SelectTrigger variant="editable" aria-label="Kategorie">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bio">Naturwissenschaften</SelectItem>
            <SelectItem value="law">Rechtswissenschaften</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 text-center text-sm leading-6 opacity-90">
        <Textarea
          variant="editable"
          aria-label="Beschreibung"
          value={description}
          placeholder="Beschreibung"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
}

/** On a gradient: everything is drawn in the text colour, white here. */
export const OnGradient: Story = {
  render: () => (
    <TitleBlock className="max-w-xl rounded-xl bg-[linear-gradient(135deg,#1e4d8c,#7b1fa2)] p-10 text-white" />
  ),
  // Oracle: the text colour the block sets — the outline is currentColor.
  play: async ({ canvas }) => {
    const title = canvas.getByRole("textbox", { name: "Titel" });
    const { color, outlineStyle } = getComputedStyle(title);
    await expect(color).toBe("rgb(255, 255, 255)");
    // Alignment comes from the wrapper too (a field's UA style would reset it).
    await expect(getComputedStyle(title).textAlign).toBe("center");
    await expect(outlineStyle).toBe("dashed");
    await userEvent.click(title);
    await expect(getComputedStyle(title).outlineStyle).toBe("solid");
    // The colour transitions; wait for it to settle.
    await waitFor(() => expect(getComputedStyle(title).outlineColor).toBe(color));
  },
};

/** On a plain surface the same fields take the surface's text colours. */
export const OnSurface: Story = {
  render: () => (
    <TitleBlock className="max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-on-surface" />
  ),
};

/**
 * A one-line label edited in place (`Input`, `w-auto` to hug its text), a
 * paragraph growing with its content, and a read-only field — text at rest,
 * an outline only on focus.
 */
export const Fields: Story = {
  render: function Render() {
    const [label, setLabel] = useState("");
    return (
      <div className="flex max-w-md flex-col items-start gap-6 text-on-surface">
        <Input
          variant="editable"
          aria-label="Beschriftung"
          value={label}
          placeholder="Dateien hierher ziehen"
          onChange={(e) => setLabel(e.target.value)}
          className="w-auto min-w-48 font-medium"
        />
        <div className="w-full text-sm leading-6">
          <Textarea variant="editable" aria-label="Anweisung" placeholder="Was sollen Mitglieder hochladen?" />
        </div>
        <Input variant="editable" aria-label="Schreibgeschützt" readOnly value="Nur lesbar" className="w-auto" />
      </div>
    );
  },
  play: async ({ canvas }) => {
    const readOnly = canvas.getByRole("textbox", { name: "Schreibgeschützt" });
    await expect(getComputedStyle(readOnly).outlineColor).toBe("rgba(0, 0, 0, 0)");
    const label = canvas.getByRole("textbox", { name: "Beschriftung" });
    await expect(getComputedStyle(label).outlineStyle).toBe("dashed");
  },
};
