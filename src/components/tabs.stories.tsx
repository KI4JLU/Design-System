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
  title: "Components/Tabs",
  component: Tabs,
  argTypes: {
    value: { control: false },
    onValueChange: { control: false },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Der Normalfall: ein Reiter je Bereich, ein Panel je Reiter. Der aktive
 * Reiter wird nur umgefärbt und unterstrichen — nie vergrößert, damit die
 * Leiste beim Wechsel nicht umbricht. Aktivierung ist automatisch: Pfeiltasten
 * wechseln den Fokus **und** die Auswahl, Pos1/Ende springen an den Rand.
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
 * Reiter mit Icon: das Icon ist dekorativ (`aria-hidden`), der zugängliche
 * Name des Reiters bleibt sein Text. Vorbild ist die Einstellungs-Leiste einer
 * Wissensbasis in JustRAG.
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
 * Ein deaktivierter Reiter ist ein nativ `disabled` Button: Radix nimmt ihn
 * ganz aus der Pfeiltasten-Navigation heraus, er ist also weder anklickbar
 * noch per Tastatur erreichbar. Der Grund der Sperre gehört deshalb sichtbar
 * neben die Leiste — ein Tooltip auf einem deaktivierten Reiter ist nicht
 * erreichbar.
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
 * Kontrolliert: `value` + `onValueChange`. Der Zustand liegt beim Aufrufort,
 * die Leiste bewegt sich nur, wenn er ihn ändert — so lässt sich der aktive
 * Reiter aus der Route, dem Suchparameter oder wie hier aus einem Button
 * setzen. Unkontrolliert genügt `defaultValue`.
 */
export const Controlled: Story = {
  render: () => <ControlledExample />,
};

/**
 * Bei teuren Panels (ein Netzwerkaufruf je Reiter) verhindert
 * `activationMode="manual"`, dass das bloße Durchpfeilen jeden Bereich lädt:
 * Pfeiltasten bewegen dann nur den Fokus, Enter oder Leertaste wählen aus.
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
 * Senkrechte Leiste über `orientation="vertical"`. Radix spiegelt die
 * Ausrichtung als `data-orientation` auf jedes Teil, dreht die Leiste, setzt
 * `aria-orientation="vertical"` und tauscht die Navigationstasten gegen
 * Pfeil-hoch/-runter. Sinnvoll, wenn die Reiterbeschriftungen lang sind.
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
 * Viele Reiter: die Leiste bringt **keinen** Scroll-Container mit. Reiter
 * werden nie gestaucht (`shrink-0`, Regel 5 der COMPONENT_GUIDELINES) — passt
 * die Reihe nicht, läuft sie über, und der Aufrufort entscheidet mit
 * `className="overflow-x-auto overflow-y-hidden"` (Layout, nicht Skin), dass
 * sie stattdessen scrollt. Die Pfeiltasten holen den fokussierten Reiter
 * dabei von selbst ins Bild. Ab etwa acht Reitern ist eine senkrechte Leiste
 * oder ein `Select` die bessere Wahl.
 */
export const ManyTabs: Story = {
  render: () => {
    // Der `value` landet in der von Radix erzeugten id
    // (`…-trigger-<value>`), also ein Slug ohne Leerzeichen — nicht das Label.
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
 * Getrennte Reiter wie die Blätter einer Arbeitsmappe: die inaktiven als graue
 * Kästen auf der Trennlinie, der aktive im hellen Auswahlblau
 * (`primary-fixed`). Für viele gleichartige Reiter über einem
 * Inhalt (z. B. die Tabellenblätter einer Excel-Vorschau).
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
