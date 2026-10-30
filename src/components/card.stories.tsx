import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, MessageSquare, RefreshCw, Clock, Star, User } from "lucide-react";
import {
  Card,
  CardBand,
  CardHairline,
  CardMeta,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";
import { cardNeutralAccent } from "./card-variants";
import { Badge } from "./badge";
import { ActionMenu } from "./action-menu";

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

/** A category pill on the hairline: opaque, outlined in the card's colour. */
function CategoryPill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--card-accent,var(--color-outline-variant))] bg-surface-container-lowest px-2 py-0.5 text-xs font-semibold text-on-surface">
      <span aria-hidden="true" className="size-2 rounded-full bg-[var(--card-accent)]" /> {name}
    </span>
  );
}

const topics = [
  { name: "Test", category: "Verwaltung", color: "var(--color-category-3)", files: 311, chats: 56 },
  { name: "FAQ Test 3", category: "KI", color: "var(--color-category-1)", files: 36, chats: 56 },
  { name: "Startseite E2E", category: null, color: undefined, files: 1, chats: 3 },
];

/**
 * The hairline card (developer mockup „Hairline", 30.10.2026) as a topic tile:
 * `CardBand` (title, star, ⋯ on a faint tint of `accentColor`), `CardHairline`
 * with the category on the rule, the meta block, and a `CardFooter` at the
 * bottom. Without a category the card has no `accentColor`: no tint, a grey rule.
 */
export const Hairline: Story = {
  render: () => (
    <div className="grid max-w-5xl auto-rows-fr grid-cols-3 gap-6">
      {topics.map((topic) => (
        <Card key={topic.name} accentColor={topic.color ?? undefined} interactive>
          <CardBand>
            <CardTitle>{topic.name}</CardTitle>
            <Button variant="ghost" size="icon" aria-label="Zu Favoriten hinzufügen">
              <Star aria-hidden="true" className="size-4" />
            </Button>
            <ActionMenu label={`Aktionen: ${topic.name}`} actions={[{ label: "Umbenennen…", onSelect: () => {} }]} variant="ghost" />
          </CardBand>
          <CardHairline>{topic.category && <CategoryPill name={topic.category} />}</CardHairline>
          <CardContent className="flex flex-col gap-1 text-sm text-on-surface-variant">
            <span className="flex items-center gap-2"><Clock aria-hidden="true" className="size-4" /> Genutzt <b className="text-on-surface">vorgestern</b></span>
            <span className="flex items-center gap-2"><RefreshCw aria-hidden="true" className="size-4" /> Aktualisiert <b className="text-on-surface">vor 19 Stunden</b></span>
          </CardContent>
          <CardFooter>
            <Badge><FileText aria-hidden="true" className="size-3" /> {topic.files}</Badge>
            <Badge><MessageSquare aria-hidden="true" className="size-3" /> {topic.chats}</Badge>
            <Badge tone="neutral" className="ml-auto"><User aria-hidden="true" className="size-3" /> Privat</Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
};

/** The catalog card („Entdecken"): the same parts, a description and the facts line. */
export const HairlineCatalog: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 gap-6">
      <Card accentColor="var(--color-category-1)" interactive>
        <CardBand>
          <CardTitle>Discovery Test</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Abonnieren"><Star aria-hidden="true" className="size-4" /></Button>
        </CardBand>
        <CardHairline><CategoryPill name="KI" /></CardHairline>
        <CardContent>
          <CardDescription className="line-clamp-3">
            Frage mich alles, was du über deine Quellen wissen möchtest. Ich kann dir helfen, Zusammenfassungen zu
            erstellen, Informationen zu finden und Ideen zu synthetisieren.
          </CardDescription>
        </CardContent>
        <CardFooter>
          <CardMeta>
            <Badge><FileText aria-hidden="true" className="size-3" /> 2 Dokumente</Badge>
            <span>Stand 27.10.2026</span>
          </CardMeta>
        </CardFooter>
      </Card>
      <Card interactive>
        <CardBand>
          <CardTitle>Bibliothek FAQ</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Abonnieren"><Star aria-hidden="true" className="size-4" /></Button>
        </CardBand>
        <CardHairline />
        <CardContent>
          <CardDescription>Öffnungszeiten, Ausleihe und Fernleihe – kurz erklärt.</CardDescription>
        </CardContent>
        <CardFooter>
          <CardMeta>
            <Badge><FileText aria-hidden="true" className="size-3" /> 9 Dokumente</Badge>
            <span>Stand 02.10.2026</span>
          </CardMeta>
        </CardFooter>
      </Card>
    </div>
  ),
};

/**
 * A list row: `accent` draws the left bar in `accentColor`, `tint` fades the
 * colour in from that edge. Without a category the bar is grey and there is no
 * tint (`cardNeutralAccent` as `accentColor`, `tint` off).
 */
export const Row: Story = {
  render: () => (
    <div className="flex max-w-4xl flex-col gap-2">
      {topics.map((topic) => (
        <Card
          key={topic.name}
          accent
          tint={!!topic.color}
          accentColor={topic.color ?? cardNeutralAccent}
          className="flex items-center gap-4 px-5 py-3"
        >
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="font-semibold">{topic.name}</span>
            {topic.category && <CategoryPill name={topic.category} />}
          </div>
          <Badge><FileText aria-hidden="true" className="size-3" /> {topic.files}</Badge>
          <Badge><MessageSquare aria-hidden="true" className="size-3" /> {topic.chats}</Badge>
        </Card>
      ))}
    </div>
  ),
};
