import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Bot, FlaskConical, Link2, SlidersHorizontal, User, Users, Workflow } from "lucide-react";
import { expect, within } from "storybook/test";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "Components/Navigation/Tabs",
  component: Tabs,
  argTypes: {
    value: { control: false },
    onValueChange: { control: false },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The normal case: one tab per area, one panel per tab. The active tab is
 * only recolored and underlined — never enlarged, so the bar doesn't rewrap
 * on switching. Activation is automatic: arrow keys move focus **and**
 * selection, Home/End jump to the ends.
 */
export const Basic: Story = {
  render: () => (
    <Tabs defaultValue="einzeln" className="max-w-xl">
      <TabsList aria-label="Freigabe">
        <TabsTrigger value="einzeln">Einzeln</TabsTrigger>
        <TabsTrigger value="mehrere">Mehrere</TabsTrigger>
        <TabsTrigger value="link">Einladungslink</TabsTrigger>
      </TabsList>
      <TabsContent value="einzeln">
        <div className="flex flex-col gap-stack-sm">
          <Label htmlFor="tabs-basic-kennung">Kennung der Person</Label>
          <Input id="tabs-basic-kennung" placeholder="s1234567" />
          <p className="text-sm text-on-surface-variant">
            Die Person erhält Lesezugriff auf diese Wissensbasis.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="mehrere">
        <p className="text-sm text-on-surface-variant">
          Eine Liste von Kennungen einfügen — eine pro Zeile. Bereits
          eingeladene Personen werden übersprungen.
        </p>
      </TabsContent>
      <TabsContent value="link">
        <div className="flex items-center gap-stack-sm">
          <Badge tone="info">gültig 7 Tage</Badge>
          <Button size="sm">Link erzeugen</Button>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * Tabs with icons: the icon is decorative (`aria-hidden`), the tab's
 * accessible name stays its text. Modeled on the settings bar of a knowledge
 * base in JustRAG.
 */
export const WithIcons: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <Tabs defaultValue="settings">
        <TabsList aria-label="Wissensbasis-Einstellungen">
          <TabsTrigger value="settings">
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            RAG-Einstellungen
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Bot aria-hidden className="h-4 w-4" />
            Agenten &amp; Teams
          </TabsTrigger>
          <TabsTrigger value="evals">
            <FlaskConical aria-hidden className="h-4 w-4" />
            Evals
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Workflow aria-hidden className="h-4 w-4" />
            Workflow
          </TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <p className="text-sm text-on-surface-variant">
            Chunk-Größe, Überlappung und Reranking dieser Wissensbasis.
          </p>
        </TabsContent>
        <TabsContent value="agents">
          <p className="text-sm text-on-surface-variant">
            Zugeordnete Agenten und Teams.
          </p>
        </TabsContent>
        <TabsContent value="evals">
          <p className="text-sm text-on-surface-variant">
            Bisherige Evaluationsläufe und ihre Ergebnisse.
          </p>
        </TabsContent>
        <TabsContent value="workflow">
          <p className="text-sm text-on-surface-variant">
            Freigabe- und Ingest-Workflow.
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  ),
};

/**
 * A disabled tab is a natively `disabled` button: Radix takes it out of
 * arrow-key navigation entirely, so it can be neither clicked nor reached by
 * keyboard. The reason for the lock therefore belongs visibly next to the
 * bar — a tooltip on a disabled tab is unreachable.
 */
export const DisabledTab: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-stack-md">
      <Tabs defaultValue="uebersicht">
        <TabsList aria-label="Auswertung">
          <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
          <TabsTrigger value="laeufe">Läufe</TabsTrigger>
          <TabsTrigger value="vergleich" disabled>
            Vergleich
          </TabsTrigger>
        </TabsList>
        <TabsContent value="uebersicht">
          <p className="text-sm text-on-surface-variant">
            Kennzahlen der letzten 30 Tage.
          </p>
        </TabsContent>
        <TabsContent value="laeufe">
          <p className="text-sm text-on-surface-variant">Ein Lauf bisher.</p>
        </TabsContent>
        <TabsContent value="vergleich">
          <p className="text-sm text-on-surface-variant">Nie sichtbar.</p>
        </TabsContent>
      </Tabs>
      <p className="text-sm text-on-surface-variant">
        „Vergleich" wird ab dem zweiten Evaluationslauf verfügbar.
      </p>
    </div>
  ),
};

const ControlledExample = () => {
  const [value, setValue] = useState("einzeln");
  return (
    <div className="flex max-w-xl flex-col gap-stack-md">
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Freigabe">
          <TabsTrigger value="einzeln">Einzeln</TabsTrigger>
          <TabsTrigger value="mehrere">Mehrere</TabsTrigger>
          <TabsTrigger value="link">Einladungslink</TabsTrigger>
        </TabsList>
        <TabsContent value="einzeln">
          <p className="text-sm text-on-surface-variant">Eine Person einladen.</p>
        </TabsContent>
        <TabsContent value="mehrere">
          <p className="text-sm text-on-surface-variant">Mehrere auf einmal.</p>
        </TabsContent>
        <TabsContent value="link">
          <p className="text-sm text-on-surface-variant">Link erzeugen und teilen.</p>
        </TabsContent>
      </Tabs>
      <div className="flex items-center gap-stack-sm">
        <span className="text-sm text-on-surface-variant">
          Aktueller Wert: <code>{value}</code>
        </span>
        <Button size="sm" variant="outline" onClick={() => setValue("link")}>
          Von außen auf „Einladungslink" setzen
        </Button>
      </div>
    </div>
  );
};

/**
 * Controlled: `value` + `onValueChange`. The state lives at the call site, and
 * the bar only moves when the call site changes it — so the active tab can be
 * set from the route, a search parameter or, as here, a button. For
 * uncontrolled use, `defaultValue` is enough.
 */
export const Controlled: Story = {
  render: () => <ControlledExample />,
};

/**
 * For expensive panels (one network call per tab), `activationMode="manual"`
 * prevents merely arrowing through from loading every area: arrow keys then
 * only move focus, and Enter or Space selects.
 */
export const ManualActivation: Story = {
  render: () => (
    <Tabs defaultValue="metriken" activationMode="manual" className="max-w-xl">
      <TabsList aria-label="Systemzustand">
        <TabsTrigger value="metriken">Metriken</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="jobs">Jobs</TabsTrigger>
      </TabsList>
      <TabsContent value="metriken">
        <p className="text-sm text-on-surface-variant">
          Wird bei Auswahl geladen — Pfeiltaste allein löst nichts aus.
        </p>
      </TabsContent>
      <TabsContent value="logs">
        <p className="text-sm text-on-surface-variant">Letzte 500 Zeilen.</p>
      </TabsContent>
      <TabsContent value="jobs">
        <p className="text-sm text-on-surface-variant">Laufende Ingest-Jobs.</p>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * A vertical bar via `orientation="vertical"`. Radix mirrors the orientation
 * as `data-orientation` onto every part, turns the bar, sets
 * `aria-orientation="vertical"` and swaps the navigation keys for arrow
 * up/down. Useful when the tab labels are long.
 */
export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="allgemein" orientation="vertical" className="max-w-2xl">
      <TabsList aria-label="Einstellungen">
        <TabsTrigger value="allgemein">Allgemein</TabsTrigger>
        <TabsTrigger value="sprache">Sprache &amp; Volltextsuche</TabsTrigger>
        <TabsTrigger value="modelle">Modelle</TabsTrigger>
        <TabsTrigger value="prompt">System-Prompt</TabsTrigger>
      </TabsList>
      <TabsContent value="allgemein">
        <p className="text-sm text-on-surface-variant">
          Name, Beschreibung und Sichtbarkeit der Wissensbasis.
        </p>
      </TabsContent>
      <TabsContent value="sprache">
        <p className="text-sm text-on-surface-variant">
          Sprache der Volltextsuche (Deutsch/Englisch).
        </p>
      </TabsContent>
      <TabsContent value="modelle">
        <p className="text-sm text-on-surface-variant">
          Chat-, Embedding-, Rerank- und TTS-Modell.
        </p>
      </TabsContent>
      <TabsContent value="prompt">
        <p className="text-sm text-on-surface-variant">
          Zusätzliche Anweisungen für die Antwortgenerierung.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * Many tabs: the bar brings **no** scroll container. Tabs are never squeezed
 * (`shrink-0`, rule 5 of the COMPONENT_GUIDELINES) — if the row doesn't fit,
 * it overflows, and the call site decides with
 * `className="overflow-x-auto overflow-y-hidden"` (layout, not skin) that it
 * scrolls instead. The arrow keys bring the focused tab into view by
 * themselves. From about eight tabs, a vertical bar or a `Select` is the
 * better choice.
 */
export const ManyTabs: Story = {
  render: () => {
    // The `value` ends up in the id Radix generates
    // (`…-trigger-<value>`), so a slug without spaces — not the label.
    const bereiche = [
      { value: "modelle", label: "KI-Modelle" },
      { value: "anmeldung", label: "Anmeldung" },
      { value: "nutzende", label: "Nutzende" },
      { value: "globale-kbs", label: "Globale Wissensbasen" },
      { value: "suche", label: "Suche" },
      { value: "agenten", label: "Agenten" },
      { value: "website", label: "Website" },
      { value: "systemzustand", label: "Systemzustand" },
      { value: "evaluation", label: "Evaluation" },
    ];
    return (
      <Card className="max-w-md p-6">
        <Tabs defaultValue={bereiche[0].value}>
          <TabsList
            aria-label="Verwaltung"
            className="overflow-x-auto overflow-y-hidden"
          >
            {bereiche.map((b) => (
              <TabsTrigger key={b.value} value={b.value}>
                {b.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {bereiche.map((b) => (
            <TabsContent key={b.value} value={b.value}>
              <p className="text-sm text-on-surface-variant">
                Einstellungen für „{b.label}".
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    );
  },
};

/**
 * `variant="segmented"`: the triggers share one tinted track and split its
 * width; the active one is a raised surface pill. For a few modes of one task
 * inside a dialog. The same APG tablist as the default strip.
 */
export const Segmented: Story = {
  render: () => (
    <Card className="max-w-xl p-6">
      <Tabs defaultValue="single">
        <TabsList variant="segmented" aria-label="Einladen">
          <TabsTrigger value="single"><User aria-hidden className="h-4 w-4" />Einzeln</TabsTrigger>
          <TabsTrigger value="bulk"><Users aria-hidden className="h-4 w-4" />Sammeleinladung</TabsTrigger>
          <TabsTrigger value="link"><Link2 aria-hidden className="h-4 w-4" />Einladungslinks</TabsTrigger>
        </TabsList>
        <TabsContent value="single"><p className="text-sm text-on-surface-variant">Eine Person einladen.</p></TabsContent>
        <TabsContent value="bulk"><p className="text-sm text-on-surface-variant">Viele Benutzernamen auf einmal.</p></TabsContent>
        <TabsContent value="link"><p className="text-sm text-on-surface-variant">Links zum Beitreten.</p></TabsContent>
      </Tabs>
    </Card>
  ),
  // ORACLE: the browser's layout — equal shares of the track, and the active
  // segment painted in a different surface than an inactive one.
  play: async ({ canvas }) => {
    const tabs = canvas.getAllByRole("tab");
    const widths = tabs.map((t) => Math.round(t.getBoundingClientRect().width));
    await expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(tabs[0]).backgroundColor).not.toBe(getComputedStyle(tabs[1]).backgroundColor);
  },
};

/**
 * The segmented strip in a narrow container: labels keep their width (rule 5,
 * never shrunk to fit) and the strip scrolls sideways instead — the same
 * call-site recipe as the underline strip ("ManyTabs").
 */
export const SegmentedNarrow: Story = {
  render: () => (
    <div className="w-[280px]">
      <Tabs defaultValue="single">
        <TabsList variant="segmented" aria-label="Einladen" className="overflow-x-auto overflow-y-hidden">
          <TabsTrigger value="single"><User aria-hidden className="h-4 w-4" />Einzeln</TabsTrigger>
          <TabsTrigger value="bulk"><Users aria-hidden className="h-4 w-4" />Sammeleinladung</TabsTrigger>
          <TabsTrigger value="link"><Link2 aria-hidden className="h-4 w-4" />Einladungslinks</TabsTrigger>
        </TabsList>
        <TabsContent value="single"><p className="text-sm text-on-surface-variant">Eine Person einladen.</p></TabsContent>
        <TabsContent value="bulk"><p className="text-sm text-on-surface-variant">Viele auf einmal.</p></TabsContent>
        <TabsContent value="link"><p className="text-sm text-on-surface-variant">Links.</p></TabsContent>
      </Tabs>
    </div>
  ),
  // ORACLE: the browser's layout — every label fits inside its own segment,
  // and no two segments overlap.
  play: async ({ canvas }) => {
    const tabs = canvas.getAllByRole("tab");
    for (const tab of tabs) await expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth);
    const rects = tabs.map((t) => t.getBoundingClientRect());
    for (let i = 1; i < rects.length; i++) await expect(rects[i].left).toBeGreaterThanOrEqual(rects[i - 1].right - 0.5);
  },
};

/**
 * Separate tabs like the sheets of a workbook: the inactive ones as gray boxes
 * on the divider, the active one in the light selection blue
 * (`primary-fixed`). For many tabs of the same kind above one piece of
 * content (e.g. the sheets of an Excel preview).
 */
export const Enclosed: Story = {
  render: () => (
    <Tabs defaultValue="erhebung" className="max-w-2xl gap-0">
      <TabsList variant="enclosed" aria-label="Tabellenblätter" className="px-2 pt-1.5">
        <TabsTrigger value="erhebung">Erhebung Nutzungsart</TabsTrigger>
        <TabsTrigger value="arten">Nutzungsarten</TabsTrigger>
        <TabsTrigger value="bauarten">Bauarten</TabsTrigger>
      </TabsList>
      {["erhebung", "arten", "bauarten"].map((v) => (
        <TabsContent key={v} value={v} className="bg-surface-container-lowest p-6">
          Inhalt von „{v}"
        </TabsContent>
      ))}
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toHaveAttribute("data-variant", "enclosed");
  },
};
