import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardCover,
  CardMeta,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";

const meta = {
  title: "Components/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Element-Statistik</CardTitle>
        <CardDescription>Letzte 30 Tage</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-on-surface-variant">1 284 Vorgänge, 92 % abgeschlossen.</p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" size="sm">
          Details
        </Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Klickbare Karte im Grid: `interactive` hebt die Karte beim Hover an
 * (Schatten + Translate). Für Tastatur-Nutzer gehört ein fokussierbares
 * Element (Link/Button) in die Karte.
 */
export const Interactive: Story = {
  render: () => (
    <div className="grid max-w-2xl grid-cols-2 gap-4">
      {["Element A", "Element B"].map((name) => (
        <Card key={name} interactive>
          <CardHeader>
            <CardTitle className="text-body-base">{name}</CardTitle>
            <CardDescription>Zuletzt aktiv vor 2 Std.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" size="sm">
              Öffnen
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
};

/** Schritt-/Callout-Karte mit linkem Akzentrand (`accent`). */
export const Accent: Story = {
  render: () => (
    <Card accent className="max-w-sm">
      <CardHeader>
        <CardTitle className="text-body-base">Schritt 1: Skript einbinden</CardTitle>
        <CardDescription>
          Fügen Sie das Snippet vor dem schließenden <code>&lt;/body&gt;</code> ein.
        </CardDescription>
      </CardHeader>
    </Card>
  ),
};

/** Card hat kein Default-Padding — ohne Sub-Parts Padding selbst setzen. */
export const PaddedContainer: Story = {
  render: () => (
    <Card className="max-w-sm p-6">
      <p>
        Card ohne Sub-Parts — Padding per <code>className=&quot;p-6&quot;</code>.
      </p>
    </Card>
  ),
};

/**
 * `variant="discover"`: die Katalogkarte eines Themas („Entdecken").
 * Farbband oben (Farbe vom Aufrufer, hier ein Verlauf aus Kategorie-Tokens),
 * darunter Meta-Zeile, großer Titel und Beschreibung.
 */
export const Discover: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-4">
      {[
        { name: "Personalrecht kompakt", from: "var(--color-category-3)", to: "var(--color-category-2)" },
        { name: "IT-Handbuch", from: "var(--color-brand)", to: "var(--color-category-6)" },
      ].map((kb) => (
        <Card key={kb.name} variant="discover" interactive>
          <CardCover style={{ backgroundImage: `linear-gradient(120deg, ${kb.from}, ${kb.to})` }} />
          <CardHeader>
            <CardMeta>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-2.5 py-0.5 font-medium text-on-surface">
                <span aria-hidden="true" className="size-2 rounded-full bg-category-1" /> Personal
              </span>
              <span>309 Dokumente</span>
              <span aria-hidden="true">·</span>
              <span>Stand 27.10.2026</span>
            </CardMeta>
            <CardTitle>{kb.name}</CardTitle>
            <CardDescription>
              Beantwortet Fragen zu Arbeitsverträgen, Urlaub, Elternzeit und Nebentätigkeiten – auf Grundlage der
              Dokumente der Personalabteilung.
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  ),
};
