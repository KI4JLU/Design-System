import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
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
 * `CardBand` (title, star, ⋯ lit by a glow of `accentColor`), `CardHairline`
 * with the category on the rule, the meta block, and a `CardFooter` at the
 * bottom. Without a category the card has no `accentColor`: a faint primary
 * glow and a 1px rule in the border colour.
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
  play: async ({ canvasElement }) => {
    // Without an accentColor the band still glows (in the primary colour), not
    // bare: an unresolved colour would make the gradient invalid (`none`).
    const neutral = within(canvasElement).getByText("Startseite E2E").closest("[data-slot=card]")!;
    await expect(getComputedStyle(neutral.querySelector("[data-slot=card-band]")!).backgroundImage).toContain("radial-gradient");
    // Its rule is 1px in the border colour: the fill under the top border stays empty.
    await expect(getComputedStyle(neutral.querySelector("[data-slot=card-hairline]")!, "::before").backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

const GLOW_TOPICS = [
  { name: "Rollen-Test", category: "Verwaltung", color: "#1E3A8A" },
  { name: "Neuer Test", category: "HRZ", color: "#4A8FE7" },
  { name: "FAQ Test 3", category: "KI", color: "#E5B000" },
  { name: "Startseite E2E", category: null, color: undefined },
];

/**
 * The glow (developer mockup, 05.11.2026), light and dark side by side: the
 * band is the card's own surface, lit from the rule's lower left in the
 * card's colour, and the rule glows softly. A dark colour (navy) glows in its
 * lighter self (`cardGlowColor`); a card without a colour glows faintly in the
 * primary colour over a 1px rule.
 */
export const HairlineGlow: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} data-theme={theme} className="grid grid-cols-4 gap-6 rounded-xl bg-background p-6">
          {GLOW_TOPICS.map((topic) => (
            <Card key={topic.name} accentColor={topic.color} interactive data-testid={`${theme}-${topic.name}`}>
              <CardBand>
                <CardTitle>{topic.name}</CardTitle>
                <Button variant="ghost" size="icon" aria-label="Zu Favoriten hinzufügen">
                  <Star aria-hidden="true" className="size-4" />
                </Button>
              </CardBand>
              <CardHairline>{topic.category && <CategoryPill name={topic.category} />}</CardHairline>
              <CardContent className="flex flex-col gap-1 text-sm text-on-surface-variant">
                <span className="flex items-center gap-2"><Clock aria-hidden="true" className="size-4" /> Genutzt <b className="text-on-surface">vor 7 Tagen</b></span>
              </CardContent>
              <CardFooter>
                <Badge tone="neutral" className="ml-auto"><User aria-hidden="true" className="size-3" /> Privat</Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const band = (id: string) => getComputedStyle(c.getByTestId(id).querySelector("[data-slot=card-band]")!);
    const rule = (id: string) => getComputedStyle(c.getByTestId(id).querySelector("[data-slot=card-hairline]")!, "::before");
    for (const theme of ["light", "dark"]) {
      for (const topic of GLOW_TOPICS) {
        // Never a grey bar: the band's own colour is transparent, the glow is an image.
        await expect(band(`${theme}-${topic.name}`).backgroundColor).toBe("rgba(0, 0, 0, 0)");
        await expect(band(`${theme}-${topic.name}`).backgroundImage).toContain("radial-gradient");
      }
      // A coloured rule glows; the neutral one does not.
      await expect(rule(`${theme}-Neuer Test`).boxShadow).not.toBe("none");
      // (a transparent shadow serialises as `rgba(0, 0, 0, 0) …` or `oklch(… / 0) …`).
      await expect(rule(`${theme}-Startseite E2E`).boxShadow).toMatch(/^(none|rgba\(0, 0, 0, 0\)|oklch\([^)]*\/ 0\))/);
    }
  },
};

const LEGIBLE_SAMPLES = [
  { name: "Weiß", color: "#FFFFFF" },
  { name: "Schwarz", color: "#000000" },
  { name: "Gelb", color: "#FACF37" },
  { name: "Blau", color: "#0056B3" },
];

/** OKLCH lightness of a computed colour (browsers report `oklch(...)` for these). */
const lightness = (css: string) => Number(/oklch\(([\d.e-]+)/.exec(css)?.[1] ?? NaN);

/**
 * A free colour that would vanish on the card is inverted (`legibleColor`):
 * white turns black on the light card, black turns white on the dark one; the
 * icon tile's glyph is black or white, whichever reads (`--card-on-accent`).
 */
export const LegibleAccent: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} data-theme={theme} data-testid={theme} className="grid grid-cols-4 gap-4 rounded-xl bg-surface p-4">
          {LEGIBLE_SAMPLES.map((s) => (
            <Card key={s.name} accentColor={s.color} data-testid={`${theme}-${s.name}`}>
              <CardBand><CardTitle>{s.name}</CardTitle></CardBand>
              <CardHairline>
                <span
                  data-testid={`${theme}-${s.name}-tile`}
                  className="flex size-9 items-center justify-center rounded-[var(--ui-radius-tile)] bg-[var(--card-accent)] text-[var(--card-on-accent)] ring-4 ring-surface-container-lowest"
                >
                  <User aria-hidden="true" className="size-[18px]" />
                </span>
              </CardHairline>
              <CardContent className="text-sm text-on-surface-variant">{s.color}</CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const rule = (id: string) =>
      lightness(getComputedStyle(c.getByTestId(id).querySelector("[data-slot=card-hairline]")!, "::before").backgroundColor);
    // onColor resolves to `color(srgb-linear 1 1 1)` (white) or `… 0 0 0` (black).
    const glyph = (id: string) => Number(getComputedStyle(c.getByTestId(`${id}-tile`)).color.match(/srgb-linear ([\d.]+)/)?.[1]);
    // White on the light card: inverted to black, with a white glyph.
    await expect(rule("light-Weiß")).toBeLessThan(0.1);
    await expect(glyph("light-Weiß")).toBe(1);
    // Black on the dark card: inverted to white, with a black glyph.
    await expect(rule("dark-Schwarz")).toBeGreaterThan(0.9);
    await expect(glyph("dark-Schwarz")).toBe(0);
    // Colours that read stay as they are; yellow takes a black glyph.
    await expect(rule("light-Schwarz")).toBeLessThan(0.01);
    await expect(rule("dark-Weiß")).toBeGreaterThan(0.99);
    await expect(rule("light-Blau")).toBeCloseTo(0.47, 1);
    await expect(rule("light-Gelb")).toBeCloseTo(0.87, 1);
    await expect(glyph("light-Gelb")).toBe(0);
    await expect(glyph("light-Blau")).toBe(1);
  },
};

/**
 * Raised contrast (`data-contrast` `medium` or `more`, AppearanceProvider):
 * the band's tint is solid instead of a glow.
 */
export const HairlineContrast: Story = {
  render: () => (
    <div className="grid max-w-4xl grid-cols-3 gap-6">
      {(["normal", "medium", "more"] as const).map((contrast) => (
        <div key={contrast} data-contrast={contrast} className="flex flex-col gap-2">
          <span className="text-sm text-on-surface-variant">{contrast}</span>
          <Card accentColor="#EE4589" data-testid={`card-${contrast}`}>
            <CardBand><CardTitle>Einführung in die Statistik</CardTitle></CardBand>
            <CardHairline />
            <CardContent className="text-sm text-on-surface-variant">Kontrast: {contrast}</CardContent>
          </Card>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const band = (contrast: string) =>
      getComputedStyle(c.getByTestId(`card-${contrast}`).querySelector("[data-slot=card-band]")!);
    await expect(band("normal").backgroundImage).toContain("radial-gradient");
    await expect(band("normal").backgroundColor).toBe("rgba(0, 0, 0, 0)");
    for (const contrast of ["medium", "more"]) {
      await expect(band(contrast).backgroundImage).toBe("none");
      // The card's colour, solid: not transparent.
      await expect(band(contrast).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    }
  },
};

/**
 * Reduced colours (`data-colors="reduced"`, AppearanceProvider): the band has
 * no tint at any contrast; the rule keeps the card's colour.
 */
export const HairlineReducedColors: Story = {
  render: () => (
    <div data-colors="reduced" className="grid max-w-4xl grid-cols-2 gap-6">
      {(["normal", "medium"] as const).map((contrast) => (
        <div key={contrast} data-contrast={contrast} className="flex flex-col gap-2">
          <span className="text-sm text-on-surface-variant">{contrast}</span>
          <Card accentColor="#EE4589" data-testid={`card-${contrast}`}>
            <CardBand><CardTitle>Einführung in die Statistik</CardTitle></CardBand>
            <CardHairline />
            <CardContent className="text-sm text-on-surface-variant">Farben: reduziert</CardContent>
          </Card>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    for (const contrast of ["normal", "medium"]) {
      const card = c.getByTestId(`card-${contrast}`);
      const band = getComputedStyle(card.querySelector("[data-slot=card-band]")!);
      await expect(band.backgroundImage).toBe("none");
      await expect(band.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      // The rule keeps the colour.
      await expect(getComputedStyle(card.querySelector("[data-slot=card-hairline]")!, "::before").backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    }
  },
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
