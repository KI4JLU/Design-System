import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: { a11y: { test: "error" } },
  args: { orientation: "horizontal", decorative: true },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    decorative: { control: "boolean" },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="flex h-16 max-w-md items-center gap-4 text-sm text-on-surface">
      <span>Links</span>
      <Separator {...args} />
      <span>Rechts</span>
    </div>
  ),
};

const PLACES = [
  { name: "Eigene Dateien", path: "C:\\Users\\mmuster\\Documents" },
  { name: "Projektlaufwerk", path: "\\\\fs.uni-giessen.de\\projekte" },
  { name: "Downloads", path: "C:\\Users\\mmuster\\Downloads" },
];

/**
 * Horizontal zwischen Listenzeilen einer Karte (Orte in „Dateien"). Dekorativ:
 * die Liste selbst gliedert den Inhalt, die Linie ist nur Rhythmus.
 */
export const HorizontalInList: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle asChild>
          <h2>Orte</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="m-0 flex list-none flex-col p-0">
          {PLACES.map((place, index) => (
            <li key={place.name} className="flex flex-col">
              {index > 0 && <Separator className="my-3" />}
              <span className="text-sm font-medium text-on-surface">{place.name}</span>
              <span className="text-xs text-on-surface-variant">{place.path}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  ),
};

/**
 * Semantisch (`decorative={false}`): trennt zwei Abschnitte einer Karte, die
 * sonst nichts als eigene Gruppe auszeichnet — `role="separator"`.
 */
export const SemanticBetweenSections: Story = {
  render: () => (
    <Card className="max-w-md p-6">
      <p className="m-0 text-sm text-on-surface">Quelltext: 1.204 Zeichen</p>
      <Separator decorative={false} className="my-4" />
      <p className="m-0 text-sm text-on-surface">Übersetzung: 1.318 Zeichen</p>
    </Card>
  ),
};

const ICON = { "aria-hidden": true, className: "size-4" } as const;

/**
 * Vertikal zwischen den Gruppen einer Werkzeugleiste (Editor des Übersetzers).
 * Die Linie streckt sich auf die Höhe der Zeile; hier begrenzt `h-5` sie auf
 * die Icon-Höhe.
 */
export const VerticalInToolbar: Story = {
  render: () => (
    <div
      role="group"
      aria-label="Formatierung"
      className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-1"
    >
      <Button variant="ghost" size="icon" aria-label="Rückgängig">
        <Undo2 {...ICON} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Wiederholen">
        <Redo2 {...ICON} />
      </Button>
      <Separator orientation="vertical" className="mx-0.5 h-5 self-center" />
      <Button variant="ghost" size="icon" aria-label="Fett">
        <Bold {...ICON} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Kursiv">
        <Italic {...ICON} />
      </Button>
      <Separator orientation="vertical" className="mx-0.5 h-5 self-center" />
      <Button variant="ghost" size="icon" aria-label="Aufzählung">
        <List {...ICON} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Nummerierte Liste">
        <ListOrdered {...ICON} />
      </Button>
    </div>
  ),
};

/** Ohne Höhe am Aufrufort streckt sich die vertikale Linie über die ganze Zeile. */
export const VerticalStretches: Story = {
  render: () => (
    <div className="flex max-w-md gap-4 text-sm text-on-surface">
      <div className="flex flex-col gap-1">
        <span className="font-medium">Deutsch</span>
        <span className="text-on-surface-variant">Quelltext</span>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-col gap-1">
        <span className="font-medium">Englisch</span>
        <span className="text-on-surface-variant">Übersetzung</span>
      </div>
    </div>
  ),
};
