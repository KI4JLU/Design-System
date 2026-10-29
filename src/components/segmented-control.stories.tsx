import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { LayoutGrid, List, MessageSquare, Upload, User, Users } from "lucide-react";
import { expect } from "storybook/test";
import { SegmentedControl } from "./segmented-control";

const OPTIONS = [
  { value: "tag", label: "Tag" },
  { value: "woche", label: "Woche" },
  { value: "monat", label: "Monat" },
];

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  args: {
    options: OPTIONS,
    value: "woche",
    onValueChange: () => {},
    "aria-label": "Zeitraum",
  },
  argTypes: {
    value: { control: false },
    onValueChange: { control: false },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveExample = () => {
  const [value, setValue] = useState("woche");
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onValueChange={setValue}
      aria-label="Zeitraum"
    />
  );
};

/** Typischer Einsatz: der Diagramm-Zeitraum-Umschalter (Tag/Woche/Monat). */
export const Playground: Story = {
  render: () => <InteractiveExample />,
};

/**
 * Icon-only segments: pass an `icon` and the `label` becomes the accessible
 * name instead of the visible text. The card/list view toggle above a list.
 */
export const IconOnly: Story = {
  args: {
    "aria-label": "Ansicht",
    value: "card",
    options: [
      { value: "card", label: "Karten", icon: <LayoutGrid className="h-4 w-4" aria-hidden /> },
      { value: "list", label: "Liste", icon: <List className="h-4 w-4" aria-hidden /> },
    ],
  },
};

/**
 * Icon + label: `showLabel` keeps the label visible next to the icon (e.g. the
 * single/multiple invite switch). The label stays the accessible name; the
 * segment is as tall as a text segment.
 */
export const IconWithLabel: Story = {
  args: {
    "aria-label": "Einladen",
    value: "single",
    options: [
      { value: "single", label: "Einzeln", icon: <User className="h-4 w-4" aria-hidden />, showLabel: true },
      { value: "many", label: "Mehrere", icon: <Users className="h-4 w-4" aria-hidden />, showLabel: true },
    ],
  },
  play: async ({ canvas }) => {
    const single = canvas.getByRole("button", { name: "Einzeln" });
    await expect(single).toHaveAttribute("aria-pressed", "true");
    // Visible: the label has a real box, not the 1px sr-only clip.
    const label = Array.from(single.querySelectorAll("span")).find((el) => el.textContent === "Einzeln") as HTMLElement;
    await expect(label.getBoundingClientRect().width).toBeGreaterThan(20);
    await expect(single.getBoundingClientRect().height).toBe(32);
  },
};

/**
 * `variant="nav"`: keine Spur, die Segmente wie `NavItem`-Zeilen — die
 * gewählte primär getönt mit Primärtext, die anderen werden beim Hover primär.
 * Für eine Moduswahl, die wie Navigation zwischen Bereichen wirkt.
 */
export const Nav: Story = {
  args: {
    "aria-label": "Chat-Start",
    variant: "nav",
    value: "input",
    options: [
      { value: "input", label: "Eingabefeld", icon: <User className="h-4 w-4" aria-hidden />, showLabel: true },
      { value: "roles", label: "Nur über Rolle", icon: <Users className="h-4 w-4" aria-hidden />, showLabel: true },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Eingabefeld" })).toHaveAttribute("aria-pressed", "true");
  },
};

export const Tile: Story = {
  args: {
    "aria-label": "Startet mit",
    variant: "tile",
    value: "input",
    options: [
      { value: "input", label: "Eingabefeld", icon: <MessageSquare aria-hidden /> },
      { value: "task", label: "Anweisung", icon: <List aria-hidden /> },
      { value: "file", label: "Datei", icon: <Upload aria-hidden /> },
    ],
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <div className="w-96">
        <SegmentedControl {...args} value={value} onValueChange={setValue} />
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "Eingabefeld" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Datei" }));
    await expect(canvas.getByRole("button", { name: "Datei" })).toHaveAttribute("aria-pressed", "true");
  },
};
