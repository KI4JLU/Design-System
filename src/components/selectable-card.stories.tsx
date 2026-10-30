import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MessageSquare, MessagesSquare, Pencil, Trash2, Upload } from "lucide-react";
import { expect, userEvent, waitFor } from "storybook/test";
import { SelectableCard, SelectableCardGroup } from "./selectable-card";
import { CardBand, CardContent, CardDescription, CardHairline, CardHeader, CardTitle } from "./card";
import { ActionMenu } from "./action-menu";
import { resolvedStyle } from "../test/fixtures/combobox-panel";

const meta = {
  title: "Components/SelectableCard",
  component: SelectableCard,
  parameters: { layout: "padded", a11y: { test: "error" } },
} satisfies Meta<typeof SelectableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const roles = [
  { value: "tutor", name: "Tutor", description: "Erklärt Schritt für Schritt und stellt Rückfragen." },
  { value: "pruefer", name: "Prüfer", description: "Fragt den Stoff ab und bewertet die Antworten." },
  { value: "recherche", name: "Recherche", description: "Sucht Belege in den Quellen und zitiert sie." },
];

const actions = (name: string) => [
  { label: `${name} bearbeiten`, icon: <Pencil aria-hidden="true" className="size-4" />, onSelect: () => {} },
  { label: `${name} löschen`, icon: <Trash2 aria-hidden="true" className="size-4" />, destructive: true, separatorBefore: true, onSelect: () => {} },
];

/**
 * One choice of several: a `SelectableCardGroup` makes the cards a radio
 * group — one tab stop, arrow keys move the choice. Each card's ⋯ menu sits
 * in the `action` slot, beside the pick target: opening it picks nothing.
 */
export const Group: Story = {
  render: function Render() {
    const [value, setValue] = useState("tutor");
    return (
      <SelectableCardGroup aria-label="Rolle" value={value} onValueChange={setValue} className="max-w-3xl grid-cols-3">
        {roles.map((role) => (
          <SelectableCard
            key={role.value}
            value={role.value}
            action={<ActionMenu label={`Aktionen: ${role.name}`} actions={actions(role.name)} variant="ghost" />}
          >
            <CardHeader className="pr-12">
              <CardTitle className="text-body-base">{role.name}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
          </SelectableCard>
        ))}
      </SelectableCardGroup>
    );
  },
  // Oracle: the WAI-ARIA radio group pattern (one checked radio, arrow keys
  // move the check) and the primary token as the browser resolves it.
  play: async ({ canvas, canvasElement }) => {
    const [tutor, pruefer] = canvas.getAllByRole("radio");
    await expect(tutor).toHaveAttribute("aria-checked", "true");
    await expect(getComputedStyle(tutor).borderTopColor).toBe(
      resolvedStyle(canvasElement, "backgroundColor", "var(--color-primary)"),
    );
    await expect(getComputedStyle(pruefer).borderTopColor).not.toBe(getComputedStyle(tutor).borderTopColor);

    await userEvent.click(tutor);
    // Held while Radix moves the focus: it checks the radio only while an
    // arrow key is down, and userEvent would release it at once.
    await userEvent.keyboard("{ArrowRight>}");
    await waitFor(() => expect(pruefer).toHaveFocus());
    await userEvent.keyboard("{/ArrowRight}");
    await expect(pruefer).toHaveAttribute("aria-checked", "true");

    // The menu is the card's sibling: opening it leaves the choice alone.
    await userEvent.click(canvas.getByRole("button", { name: "Aktionen: Recherche" }));
    await userEvent.keyboard("{Escape}");
    await expect(pruefer).toHaveAttribute("aria-checked", "true");
  },
};

/**
 * On its own the card is a toggle (`aria-pressed`): `selected` +
 * `onSelectedChange`.
 */
export const Toggle: Story = {
  render: function Render() {
    const [selected, setSelected] = useState(false);
    return (
      <SelectableCard selected={selected} onSelectedChange={setSelected} className="max-w-xs">
        <CardHeader>
          <CardTitle className="text-body-base">Als Standard verwenden</CardTitle>
          <CardDescription>Neue Chats starten in dieser Rolle.</CardDescription>
        </CardHeader>
      </SelectableCard>
    );
  },
  play: async ({ canvas }) => {
    const card = canvas.getByRole("button", { name: /Als Standard verwenden/ });
    await expect(card).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(card);
    await expect(card).toHaveAttribute("aria-pressed", "true");
  },
};

/**
 * A hairline role card (developer mockup „Rollen-Cards · Hairline"): an empty
 * `CardBand` tinted in the role's colour, the role's icon tile on the
 * `CardHairline`, then name and description. `accentColor` drives both.
 */
export const HairlineRoles: Story = {
  render: function Render() {
    const [value, setValue] = useState("test");
    return (
      <SelectableCardGroup aria-label="Rolle" value={value} onValueChange={setValue} className="max-w-3xl grid-cols-4">
        {[
          { value: "test", name: "Test", text: "Durchsucht die bereitgestellten Quellen.", color: "#2f5ea8", icon: <MessageSquare /> },
          { value: "verwaltung", name: "Verwaltungs\u00ADauskunft", text: "Beantwortet Fragen zu Ordnungen, Fristen und Abläufen.", color: "#8b5cf6", icon: <MessagesSquare /> },
          { value: "daten", name: "Datenanalyse", text: "Prüft hochgeladene Dokumente und fasst Zahlen zusammen.", color: "#3fa96b", icon: <Upload /> },
        ].map((role) => (
          <SelectableCard key={role.value} value={role.value} accentColor={role.color} className="aspect-[3/4]">
            <CardBand />
            <CardHairline>
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-lg bg-[var(--card-accent)] text-white ring-4 ring-surface-container-lowest [&_svg]:size-[18px]"
              >
                {role.icon}
              </span>
            </CardHairline>
            <CardContent className="flex flex-col gap-1">
              <CardTitle className="text-base leading-snug">{role.name}</CardTitle>
              <CardDescription className="line-clamp-3">{role.text}</CardDescription>
            </CardContent>
          </SelectableCard>
        ))}
      </SelectableCardGroup>
    );
  },
};

/** A disabled card keeps its place and cannot be picked. */
export const Disabled: Story = {
  render: () => (
    <SelectableCardGroup aria-label="Modus" defaultValue="a" className="max-w-xl grid-cols-2">
      <SelectableCard value="a">
        <CardHeader><CardTitle className="text-body-base">Eingabefeld</CardTitle></CardHeader>
      </SelectableCard>
      <SelectableCard value="b" disabled>
        <CardHeader><CardTitle className="text-body-base">Datei-Upload</CardTitle></CardHeader>
      </SelectableCard>
    </SelectableCardGroup>
  ),
};
