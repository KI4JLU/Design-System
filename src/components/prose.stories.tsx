import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card } from "./card";
import { Prose } from "./prose";
import { proseVariants } from "./prose-variants";

const meta = {
  title: "Components/Prose",
  component: Prose,
  parameters: { a11y: { test: "error" } },
  args: { size: "default" },
  argTypes: {
    size: { control: "inline-radio", options: ["default", "compact"] },
    asChild: { control: false },
  },
} satisfies Meta<typeof Prose>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What a Markdown renderer emits for a meeting summary (Transkription → Zusammenfassung). */
function MeetingSummary() {
  return (
    <>
      <h1>Jour fixe KI-Team, 5. Oktober 2026</h1>
      <p>
        Teilnehmende: <strong>Maria Musterfrau</strong> (Leitung), Jonas Beispiel, Aylin Demir.
        Protokoll und Aufnahme liegen im <a href="#ablage">Teamordner</a>.
      </p>
      <h2>Beschlüsse</h2>
      <ol>
        <li>Der Übersetzer geht am 12. Oktober für alle Beschäftigten live.</li>
        <li>
          Die Transkription bekommt eine <em>Sprechererkennung</em>:
          <ul>
            <li>zunächst nur für Aufnahmen bis 60 Minuten,</li>
            <li>Namen werden nach der Aufnahme zugeordnet.</li>
          </ul>
        </li>
        <li>Glossare werden pro Fachbereich gepflegt.</li>
      </ol>
      <h2>Aufgaben</h2>
      <table>
        <thead>
          <tr>
            <th>Aufgabe</th>
            <th>Verantwortlich</th>
            <th>Fällig</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Release-Notiz für das Intranet</td>
            <td>Aylin Demir</td>
            <td>09.10.2026</td>
          </tr>
          <tr>
            <td>Lasttest des Übersetzers</td>
            <td>Jonas Beispiel</td>
            <td>10.10.2026</td>
          </tr>
        </tbody>
      </table>
      <h3>Offene Fragen</h3>
      <blockquote>
        <p>
          Dürfen Prüfungsunterlagen über den Übersetzer laufen? Das klärt die Rechtsabteilung bis
          zum nächsten Termin.
        </p>
      </blockquote>
      <h4>Technische Notiz</h4>
      <p>
        Der neue Endpunkt heißt <code>/api/translate</code> und erwartet die Zielsprache als
        ISO-Code:
      </p>
      <pre>
        <code>{`POST /api/translate
{ "text": "Guten Morgen", "target": "en" }`}</code>
      </pre>
      <hr />
      <p>Nächster Termin: Montag, 12. Oktober 2026, 10:00 Uhr.</p>
    </>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Card className="max-w-2xl p-6">
      <Prose {...args}>
        <MeetingSummary />
      </Prose>
    </Card>
  ),
};

/**
 * Eine Besprechungszusammenfassung, wie der Markdown-Renderer sie ausgibt:
 * Überschriften, verschachtelte Listen, Tabelle, Zitat, Inline-Code und
 * Codeblock — keins der Elemente trägt eigene Klassen.
 */
export const MeetingSummaryMarkdown: Story = {
  render: () => (
    <Card className="max-w-2xl p-6">
      <Prose>
        <MeetingSummary />
      </Prose>
    </Card>
  ),
  // The UA margins are gone: the first heading sits flush, lists keep their markers.
  play: async ({ canvasElement }) => {
    const h1 = canvasElement.querySelector("h1")!;
    expect(getComputedStyle(h1).marginTop).toBe("0px");
    expect(getComputedStyle(canvasElement.querySelector("ol")!).listStyleType).toBe("decimal");
    expect(getComputedStyle(canvasElement.querySelector("ul")!).listStyleType).toBe("disc");
    expect(getComputedStyle(canvasElement.querySelector("blockquote")!).marginLeft).toBe("0px");
  },
};

/** `compact`: dieselbe Zusammenfassung in einer schmalen Seitenspalte. */
export const Compact: Story = {
  render: () => (
    <Card className="max-w-sm p-4">
      <Prose size="compact">
        <MeetingSummary />
      </Prose>
    </Card>
  ),
};

/**
 * Ohne Komponente: ein Editor, der sein Wurzelelement selbst rendert (Tiptap),
 * bekommt die Klassen über `proseVariants()` — hier ein `contentEditable`
 * als Stellvertreter für `editorProps.attributes.class`.
 */
export const EditorClasses: Story = {
  render: () => (
    <Card className="max-w-2xl">
      <div
        role="textbox"
        aria-multiline="true"
        aria-label="Dokument"
        contentEditable
        suppressContentEditableWarning
        className={proseVariants({ className: "min-h-48 p-6 outline-none" })}
      >
        <h2>Einladung zum Fachtag</h2>
        <p>
          Liebe Kolleginnen und Kollegen, am <strong>20. November</strong> stellen wir die neuen
          KI-Werkzeuge der JLU vor.
        </p>
        <ul>
          <li>
            <p>Übersetzer und Glossare</p>
          </li>
          <li>
            <p>Transkription mit Zusammenfassung</p>
          </li>
        </ul>
      </div>
    </Card>
  ),
};
