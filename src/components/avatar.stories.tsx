import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Avatar } from "./avatar";
import { CATEGORY_COLOR_COUNT } from "../lib/category-color";

/** A self-contained sample portrait (no network in story tests). */
const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
    '<rect width="80" height="80" fill="#9fb8d6"/>' +
    '<circle cx="40" cy="32" r="15" fill="#f1d3bd"/>' +
    '<path d="M40 10c-11 0-17 7-17 16 4-5 10-7 17-7s13 2 17 7c0-9-6-16-17-16z" fill="#5a3b2a"/>' +
    '<path d="M12 80c2-17 13-26 28-26s26 9 28 26z" fill="#2f4f75"/>' +
    "</svg>",
)}`;

const SPEAKERS = Array.from({ length: CATEGORY_COLOR_COUNT }, (_, i) => ({
  name: `Sprecher ${i + 1}`,
  initials: `S${i + 1}`,
  color: `var(--color-category-${i + 1})`,
}));

const meta = {
  title: "Components/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { initials: "JL", "aria-label": "Justus Liebig" },
};

export const Sizes: Story = {
  args: { initials: "JL" },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="JL" size="sm" aria-label="Justus Liebig" />
      <Avatar initials="JL" aria-label="Justus Liebig" />
      <Avatar initials="JL" size="lg" aria-label="Justus Liebig" />
    </div>
  ),
};

/** Präsenz-Punkt (`online`) — Status gehört mit ins Label. */
export const Online: Story = {
  args: { initials: "JL" },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="JL" size="sm" online aria-label="Justus Liebig, online" />
      <Avatar initials="JL" online aria-label="Justus Liebig, online" />
      <Avatar initials="JL" size="lg" online aria-label="Justus Liebig, online" />
    </div>
  ),
};

/** Typischer Einsatz: Avatar + Name/Meta in einer Zeile (Sidebar, Gesprächsliste). */
export const WithText: Story = {
  args: { initials: "JL" },
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar initials="JL" online />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-on-surface">Justus Liebig</span>
        <span className="text-xs text-on-surface-variant">justus.liebig@uni-giessen.de</span>
      </div>
    </div>
  ),
};

/**
 * `src` zeigt das Profilbild (Nutzerverwaltung). Bis es geladen ist, stehen die
 * Initialen im Kreis; der Name des Avatars ändert sich durch das Bild nicht.
 */
export const WithPicture: Story = {
  args: { initials: "JL" },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="JL" size="sm" src={PORTRAIT} aria-label="Justus Liebig" />
      <Avatar initials="JL" src={PORTRAIT} aria-label="Justus Liebig" data-testid="picture" />
      <Avatar initials="JL" size="lg" src={PORTRAIT} online aria-label="Justus Liebig, online" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const img = canvasElement.querySelector("[data-testid='picture'] img") as HTMLImageElement;
    await waitFor(() => expect(img).not.toHaveClass("opacity-0"));
    await expect(img.naturalWidth).toBeGreaterThan(0);
  },
};

/** Ein Bild, das nicht lädt (404), fällt auf die Initialen zurück. */
export const BrokenPicture: Story = {
  args: { initials: "JL" },
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar initials="JL" src="/nicht-vorhanden.png" data-testid="broken" />
      <span className="text-sm text-on-surface">Justus Liebig</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector("[data-testid='broken']") as HTMLElement;
    await waitFor(() => expect(avatar.querySelector("img")).toBeNull());
    await expect(avatar).toHaveTextContent("JL");
  },
};

/**
 * `color` mit der Kategorie-Palette — z. B. eine Farbe pro Sprecher in der
 * Transkription. Die Initialen stehen in `on-secondary-fixed`, einer dunklen
 * Schrift, die in hell und dunkel gleich bleibt wie die Palette selbst.
 */
export const CategoryColors: Story = {
  args: { initials: "S1" },
  render: () => (
    <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
      {SPEAKERS.map((speaker) => (
        <li key={speaker.name} className="flex items-center gap-2">
          <Avatar initials={speaker.initials} size="sm" color={speaker.color} />
          <span className="text-sm text-on-surface">{speaker.name}</span>
        </li>
      ))}
    </ul>
  ),
};

/** Dieselbe Reihe im dunklen Theme. */
export const CategoryColorsDark: Story = {
  ...CategoryColors,
  globals: { theme: "dark" },
};
