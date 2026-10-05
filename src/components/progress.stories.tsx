import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
import { Progress } from "./progress";

const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: { a11y: { test: "error" } },
  args: { value: 42, label: "vorlesung-01.mp3 wird hochgeladen", className: "max-w-md" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    tone: { control: "inline-radio", options: ["primary", "success", "error"] },
    size: { control: "inline-radio", options: ["sm", "default"] },
    formatValue: { control: false },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Bestimmte Werte: `value` von 0 bis `max` (Default 100). */
export const Determinate: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-stack-md">
      <Progress value={0} label="Upload, noch nicht begonnen" />
      <Progress value={25} label="Upload zu einem Viertel" />
      <Progress value={60} label="Upload zu drei Fünfteln" />
      <Progress value={100} label="Upload abgeschlossen" />
    </div>
  ),
};

/**
 * Unbestimmt: ohne `value` — die Datei liegt in der Warteschlange, der Dienst
 * nennt keinen Fortschritt. `aria-valuenow` entfällt, der Balken pulsiert und
 * steht bei reduzierter Bewegung still (halbe Deckkraft).
 */
export const Indeterminate: Story = {
  render: (args) => <Progress {...args} value={undefined} label="Dokument wird übersetzt" />,
};

/** Ton nach Stand der Arbeit: läuft (`primary`), fertig (`success`), fehlgeschlagen (`error`). */
export const Tones: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-stack-md">
      <Progress value={45} tone="primary" label="Wird hochgeladen" showValue />
      <Progress value={100} tone="success" label="Hochgeladen" showValue />
      <Progress value={70} tone="error" label="Upload abgebrochen" showValue />
    </div>
  ),
};

/**
 * `showValue` zeigt den Prozentwert neben dem Balken (deutsch formatiert,
 * „42 %"; `formatValue` für andere Sprachen). Für Screenreader ist er
 * ausgeblendet — `aria-valuenow` trägt die Zahl bereits.
 */
export const WithValue: Story = {
  args: { value: 42, showValue: true },
};

/** `sm` (4px) für dichte Listenzeilen, `default` (8px). */
export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-stack-md">
      <Progress value={60} size="sm" label="Klein" showValue />
      <Progress value={60} label="Standard" showValue />
    </div>
  ),
};

type Row = {
  name: string;
  status: string;
  value?: number;
  tone?: "primary" | "success" | "error";
};

const ROWS: Row[] = [
  { name: "Hausarbeit-Entwurf.docx", status: "Wird hochgeladen …", value: 35 },
  { name: "Modulhandbuch-2026.pdf", status: "Wird übersetzt …" },
  { name: "Präsentation-Seminar.pptx", status: "Fertig", value: 100, tone: "success" },
  { name: "Gutachten-gescannt.pdf", status: "Fehlgeschlagen", value: 60, tone: "error" },
];

/**
 * Dokumentliste des Übersetzers: je Datei eine Zeile mit Typ, Name, Status und
 * Balken — hochladen (bestimmt), übersetzen (unbestimmt), fertig, Fehler. Der
 * Balken heißt wie die Datei; der Status daneben ist der sichtbare Text, die
 * Meilensteine sagt die App über ihre eigene Statusregion an.
 */
export const DocumentRows: Story = {
  render: () => (
    <ul className="m-0 flex max-w-2xl list-none flex-col divide-y divide-outline-variant p-0">
      {ROWS.map((row) => {
        const extension = row.name.split(".").pop()!.toUpperCase();
        return (
          <li key={row.name} className="flex items-center gap-stack-md py-3">
            <span className="flex min-w-0 flex-1 items-center gap-stack-sm text-sm text-on-surface">
              <Badge aria-hidden="true" tone={row.tone === "error" ? "error" : "neutral"}>
                {extension}
              </Badge>
              <span className="truncate">{row.name}</span>
            </span>
            <span className="w-36 shrink-0 text-sm text-on-surface-variant">{row.status}</span>
            <Progress
              className="w-32 shrink-0"
              size="sm"
              label={row.name}
              value={row.value}
              tone={row.tone}
              showValue
            />
          </li>
        );
      })}
    </ul>
  ),
};
