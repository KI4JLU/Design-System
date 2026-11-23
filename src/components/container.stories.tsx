import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Container } from "./container";
import { Card } from "./card";
import { Grid } from "./grid";
import { Stack } from "./stack";

const meta = {
  title: "Primitives/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
  argTypes: {
    size: { control: "select", options: ["page", "content", "reading"] },
    asChild: { control: false },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Zentrierte Seitenspalte: Seitenränder `gutter` (mobil) / `margin-page` (ab md).
 * `size` benennt die Rolle der Seite — `page` (Seitenmaximum, Standard),
 * `content` (Inhaltsspalte), `reading` (Lesespalte).
 */
export const Playground: Story = {
  args: { size: "page" },
  render: (args) => (
    <Container {...args} className="py-gutter">
      <Card className="p-6">Inhalt — die Ränder kommen vom Container.</Card>
    </Container>
  ),
};

/**
 * Derselbe Absatz in allen drei Breiten — bewusst identischer Text, weil sich
 * eine Breite nur an Inhalt beurteilen lässt: dieselben Sätze laufen bei `page`
 * über 180 Zeichen pro Zeile und bei `reading` über 74.
 */
const prose = (
  <>
    <p className="m-0 text-on-surface">
      Diese Nutzungsbedingungen regeln die Verwendung der Plattform durch
      Angehörige der Justus-Liebig-Universität Gießen. Mit der Anmeldung über den
      JLU-Account erkennen Sie die nachstehenden Bedingungen an. Sie gelten für
      alle Dienste, die über diese Oberfläche erreichbar sind, unabhängig davon,
      ob der Zugriff über die Weboberfläche, eine Programmierschnittstelle oder
      ein eingebettetes Widget erfolgt.
    </p>
    <p className="m-0 text-on-surface">
      Die Nutzung ist ausschließlich für Zwecke der Forschung, der Lehre und der
      Verwaltung zulässig. Eine Weitergabe der Zugangsdaten an Dritte ist
      untersagt; dies gilt auch für Angehörige derselben Einrichtung. Für
      Inhalte, die Sie in die Plattform einstellen, bleiben Sie verantwortlich.
    </p>
  </>
);

/** Kennzahlenkarte — der Inhalt, für den `page` die richtige Breite ist. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <Stack gap="sm">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {label}
        </span>
        <span className="font-stat-lg text-stat-lg text-on-surface">{value}</span>
      </Stack>
    </Card>
  );
}

/** Sammlungskarte — der Inhalt, für den `content` die richtige Breite ist. */
function CollectionCard({ title, meta }: { title: string; meta: string }) {
  return (
    <Card className="p-4">
      <Stack gap="sm">
        <span className="text-on-surface">{title}</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {meta}
        </span>
      </Stack>
    </Card>
  );
}

function SizeLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-label-sm text-label-sm text-on-surface-variant">
      {children}
    </div>
  );
}

/**
 * Die drei Breiten übereinander, jede mit echtem Inhalt: Kennzahlenraster bei
 * `page`, Sammlungsraster bei `content`, laufender Text bei `reading` — und in
 * allen drei derselbe Absatz, damit die Zeilenlänge vergleichbar ist. Die
 * gestrichelte Kante zeigt das **Textmaß**, also die Spaltenbreite minus der
 * Seitenränder (`px-gutter` / ab md `px-margin-page`) — die gehören zur Breite,
 * weil `box-sizing: border-box` gilt.
 */
function AllSizesBody() {
  return (
    <Stack gap="lg" className="py-gutter">
      <Container size="page" data-testid="size-page">
        <Stack gap="md" className="border border-dashed border-outline-variant">
          <SizeLabel>
            size=&quot;page&quot; — 1440px (--max-width-container-max), Textmaß
            1360px, ~181 Zeichen/Zeile
          </SizeLabel>
          <Grid cols={4} gap="md">
            <Stat label="Wissensbasen" value="24" />
            <Stat label="Anfragen (30 T.)" value="18.402" />
            <Stat label="Dokumente" value="9.117" />
            <Stat label="Ø Antwortzeit" value="1,8 s" />
          </Grid>
          {prose}
        </Stack>
      </Container>

      <Container size="content" data-testid="size-content">
        <Stack gap="md" className="border border-dashed border-outline-variant">
          <SizeLabel>
            size=&quot;content&quot; — 1000px (--max-width-container-content),
            Textmaß 920px, ~121 Zeichen/Zeile
          </SizeLabel>
          <Grid cols={3} gap="md">
            <CollectionCard title="Prüfungsordnungen" meta="412 Dokumente" />
            <CollectionCard title="Studienberatung" meta="88 Dokumente" />
            <CollectionCard title="HRZ-Handbücher" meta="1.204 Dokumente" />
          </Grid>
          {prose}
        </Stack>
      </Container>

      <Container size="reading" data-testid="size-reading">
        <Stack gap="md" className="border border-dashed border-outline-variant">
          <SizeLabel>
            size=&quot;reading&quot; — 672px (--max-width-container-reading),
            Textmaß 592px, ~74 Zeichen/Zeile
          </SizeLabel>
          {prose}
        </Stack>
      </Container>
    </Stack>
  );
}

/**
 * Orakel für alle Breiten-Stories: die **berechnete** `max-width` aus der
 * CSSOM, nicht die Klassenzeichenkette. Eine Klassenprüfung wäre auch dann
 * grün, wenn das Utility zu nichts kompiliert — genau der Fehler, der bei
 * einem Token-Namen ohne Utility-Namespace auftreten würde.
 */
async function expectWidths(canvasElement: HTMLElement) {
  const read = (size: string) => {
    const el = canvasElement.querySelector(`[data-testid='size-${size}']`);
    if (!el) throw new Error(`Container ${size} nicht gefunden`);
    return getComputedStyle(el).maxWidth;
  };
  // 1440px: das veröffentlichte Seitenmaximum, unverändert seit v0.9 — zwei
  // Apps hängen daran (CampusAgents schreibt `max-w-container-max` selbst).
  await expect(read("page")).toBe("1440px");
  // 1000px: gemessen beim Konsumenten, nicht hier gewählt —
  // `.home-view__grid--main` in JustRAG (web/src/components/HomeView.css:247).
  await expect(read("content")).toBe("1000px");
  // 672px: 42rem bei 16px-Wurzelgröße. Derselbe Wert wie Tailwinds
  // `--container-2xl` (`max-w-2xl`), den diese Breite vorher direkt benutzte,
  // und den `AuthLayout width="prose"` unabhängig davon festnagelt.
  await expect(read("reading")).toBe("672px");
}

export const AllSizes: Story = {
  render: () => <AllSizesBody />,
  play: async ({ canvasElement }) => {
    await expectWidths(canvasElement);
  },
};

/** Dieselben drei Breiten im dunklen Theme — die Breite darf sich nicht ändern. */
export const AllSizesDark: Story = {
  ...AllSizes,
  globals: { theme: "dark" },
  play: async ({ canvasElement }) => {
    // Belegt zuerst, dass die Story wirklich im dunklen Theme läuft
    // (`ThemeProvider` ist der einzige Schreiber von `<html data-theme>`).
    await expect(document.documentElement.dataset.theme).toBe("dark");
    await expectWidths(canvasElement);
  },
};

/**
 * **Der Ausweg, absichtlich festgenagelt — keine Empfehlung.** Die
 * Breiten-Utility sitzt auf genau dem Element, in das `className` fließt, also
 * gewinnt eine Klasse am Aufrufort (`cn()` → tailwind-merge löst den
 * `max-w`-Konflikt auf). Diese Story existiert, weil dieser Mechanismus die
 * Begründung der Token-Syntax ist: mit `max-w-container-content` statt
 * `max-w-(--max-width-container-content)` erkennt tailwind-merge 3.6.0 den
 * Konflikt **nicht** mehr, behält beide Klassen und die CSS-Reihenfolge
 * entscheidet. Wird sie rot, ist die Syntax in `container-variants.ts`
 * gekippt — nicht der Aufrufort.
 *
 * Für Seitenbreiten ist der richtige Weg trotzdem `size`: `max-w-[1000px]` am
 * Aufrufort kann `layout-only-classname` nicht sehen (`Container` steht nicht
 * in `DS_CONTROLS`, siehe `eslint-plugin/index.js`), fällt also nirgends auf.
 */
export const CallSiteWidthStillWins: Story = {
  render: () => (
    <Container size="page" className="max-w-3xl py-gutter" data-testid="overridden">
      <Card className="p-6">
        <span className="text-on-surface">
          size=&quot;page&quot; mit className=&quot;max-w-3xl&quot; am Aufrufort.
        </span>
      </Card>
    </Container>
  ),
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector("[data-testid='overridden']");
    // Orakel: Tailwinds veröffentlichte Skala — `max-w-3xl` ist
    // `--container-3xl` = 48rem = 768px, aufgelöst von Chromium.
    await expect(getComputedStyle(el!).maxWidth).toBe("768px");
  },
};
