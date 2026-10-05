import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card } from "./card";
import { Highlight } from "./highlight";
import { highlightVariants } from "./highlight-variants";

const meta = {
  title: "Components/Highlight",
  component: Highlight,
  parameters: { a11y: { test: "error" } },
  args: { kind: "mark", active: false, children: "Glossar" },
  argTypes: {
    kind: { control: "inline-radio", options: ["mark", "insert", "delete"] },
    active: { control: "boolean" },
    asChild: { control: false },
  },
} satisfies Meta<typeof Highlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <p className="m-0 max-w-md text-body-base text-on-surface">
      Lege für Fachbegriffe ein <Highlight {...args} /> an, damit der Übersetzer sie einheitlich
      überträgt.
    </p>
  ),
};

function Arrow() {
  return (
    <span aria-hidden="true" className="text-on-surface-variant">
      {" → "}
    </span>
  );
}

/**
 * „Änderungen anzeigen" nach dem Umformulieren: jede ersetzte Stelle als
 * `alt → neu`. Gelöschtes ist durchgestrichen, Eingefügtes unterstrichen —
 * die Bedeutung hängt nicht an der Farbe; Screenreader hören „gelöscht:" /
 * „eingefügt:" davor.
 */
export const RephraseDiff: Story = {
  render: () => (
    <Card className="max-w-xl p-6">
      <p className="m-0 text-body-base text-on-surface">
        Die Sprechstunde <Highlight kind="delete">findet ab sofort immer</Highlight>
        <Arrow />
        <Highlight kind="insert">findet ab dem Wintersemester</Highlight> dienstags von 10 bis 12
        Uhr statt. Bitte melden Sie sich{" "}
        <Highlight kind="delete">vorher per Mail an</Highlight>
        <Arrow />
        <Highlight kind="insert">vorab über Stud.IP an</Highlight>, damit wir{" "}
        <Highlight kind="insert">genug</Highlight> Zeit einplanen können.
      </p>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const del = canvasElement.querySelector("del")!;
    const ins = canvasElement.querySelector("ins")!;
    expect(getComputedStyle(del).textDecorationLine).toContain("line-through");
    expect(getComputedStyle(ins).textDecorationLine).toContain("underline");
    expect(del.textContent).toMatch(/^gelöscht: /);
  },
};

/**
 * Suchtreffer im Text, der aktuelle (`active`) kräftiger. Die Position sagt
 * ein eigenes `role="status"` am Aufrufort an.
 */
export const SearchHits: Story = {
  render: () => (
    <Card className="flex max-w-xl flex-col gap-stack-sm p-6">
      <p className="m-0 text-sm text-on-surface-variant" role="status">
        Treffer 2 von 3 für „Glossar“
      </p>
      <p className="m-0 text-body-base text-on-surface">
        Ein <Highlight>Glossar</Highlight> legt fest, wie Fachbegriffe übersetzt werden. Jedes{" "}
        <Highlight active>Glossar</Highlight> gehört zu einem Fachbereich; Begriffe, die in keinem{" "}
        <Highlight>Glossar</Highlight> stehen, übersetzt die KI frei.
      </p>
    </Card>
  ),
};

/**
 * Lange markierte Passagen brechen wie normaler Text um; Fläche und Ecken
 * wiederholen sich auf jeder Zeile (`box-decoration-clone`).
 */
export const WrapsInLine: Story = {
  render: () => (
    <p className="m-0 max-w-xs text-body-base text-on-surface">
      Der Übersetzer markiert{" "}
      <Highlight active>
        den Satz, den Sie gerade bearbeiten, über mehrere Zeilen hinweg
      </Highlight>{" "}
      und lässt den Rest des Absatzes unverändert.
    </p>
  ),
};

/**
 * Ohne Komponente: HTML, das als String gebaut wird (Ergebnisfeld des
 * Übersetzers) oder Editor-Dekorationen nehmen `highlightVariants()`.
 */
export const ClassesForHtmlStrings: Story = {
  render: () => {
    const html = `Bitte <del class="${highlightVariants({ kind: "delete" })}"><span class="sr-only">gelöscht: </span>schicken</del> <ins class="${highlightVariants({ kind: "insert" })}"><span class="sr-only">eingefügt: </span>senden</ins> Sie uns die Unterlagen.`;
    return (
      <p
        className="m-0 max-w-md text-body-base text-on-surface"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  },
};
