import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import { Checkbox } from "./checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type TableDensity,
} from "./table";

const meta = {
  title: "Components/Table",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const KEYS = [
  { name: "Ingest-Pipeline", key: "jlu_a1b2…9f0e", created: "01.02.2026", used: "gestern", state: "aktiv" },
  { name: "Eval-Runner", key: "jlu_c3d4…71ac", created: "14.03.2026", used: "vor 3 Tagen", state: "aktiv" },
  { name: "Altes Widget", key: "jlu_e5f6…b220", created: "22.11.2025", used: "—", state: "abgelaufen" },
];

/**
 * Der Normalfall: eine dichte Datentabelle in einer `Card`. Zahlen- und
 * Aktionsspalten werden am Zellenaufruf rechtsbündig gesetzt (`text-right`),
 * die Kopfzeile ist ruhiger als der Inhalt (`on-surface-variant`).
 */
export const DataTable: Story = {
  render: () => (
    <Card className="max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Schlüssel</TableHead>
            <TableHead>Erstellt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {KEYS.map((k) => (
            <TableRow key={k.name}>
              <TableCell className="font-medium">{k.name}</TableCell>
              <TableCell>{k.key}</TableCell>
              <TableCell>{k.created}</TableCell>
              <TableCell>
                <Badge tone={k.state === "aktiv" ? "success" : "neutral"}>{k.state}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost-destructive" size="sm">
                  Widerrufen
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * `TableCaption` benennt die Tabelle (zugänglicher Name, unten dargestellt),
 * `TableFooter` trägt die Summenzeile. Das `<caption>` steht im DOM als
 * **erstes** Kind des `<table>` — `caption-bottom` schiebt es optisch nach
 * unten.
 */
export const CaptionAndFooter: Story = {
  render: () => (
    <Card className="max-w-2xl">
      <Table>
        <TableCaption>Abrechnung März 2026 — alle Beträge netto.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead className="text-right">Anfragen</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Chat-Antworten</TableCell>
            <TableCell className="text-right">128.400</TableCell>
            <TableCell className="text-right">412,80 €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dokument-Ingest</TableCell>
            <TableCell className="text-right">3.210</TableCell>
            <TableCell className="text-right">96,30 €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Evaluationsläufe</TableCell>
            <TableCell className="text-right">42</TableCell>
            <TableCell className="text-right">21,00 €</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Gesamt</TableCell>
            <TableCell className="text-right">530,10 €</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  ),
};

/**
 * Breite Tabellen scrollen in ihrem **eigenen** Container statt die Seite zu
 * sprengen — der Container gehört zu `Table`, es braucht kein `overflow-x-auto`
 * am Aufrufort. Der Rahmen hier ist absichtlich schmal, damit der Scrollbalken
 * sichtbar wird. Spalten, die nie umbrechen sollen (Datum, Zahlen), bekommen
 * `whitespace-nowrap` an der Zelle.
 */
export const WideScrolls: Story = {
  render: () => (
    <Card className="max-w-md">
      <Table>
        <TableCaption>Evaluationsläufe — 8 Spalten in einer schmalen Karte.</TableCaption>
        <TableHeader>
          <TableRow>
            {["Status", "Label", "Gestartet", "Dauer", "Wissensbasis", "Judge", "Recall", "Aktionen"].map((c) => (
              <TableHead key={c} className="whitespace-nowrap">
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Badge tone="success">fertig</Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">Baseline v{i}</TableCell>
              <TableCell className="whitespace-nowrap">0{i}.04.2026 09:1{i}</TableCell>
              <TableCell className="whitespace-nowrap text-right">4m 1{i}s</TableCell>
              <TableCell className="whitespace-nowrap">Studienberatung</TableCell>
              <TableCell>ja</TableCell>
              <TableCell className="text-right">0,8{i}</TableCell>
              <TableCell className="whitespace-nowrap text-right">
                <Button variant="ghost" size="sm">
                  Öffnen
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * Vertikal scrollende Tabelle: die Höhe gehört an den Scroll-Container, nicht
 * an die Tabelle — dafür ist `containerClassName` da. (Ohne diesen Zugriff
 * wäre der „Low-Score-Queries"-Block im JustRAG-Dashboard nicht baubar.)
 * Eine mitlaufende Kopfzeile bringt `Table` bewusst noch **nicht** mit,
 * siehe „Bewusst nicht enthalten" in der Doku.
 */
export const BoundedHeightScrolls: Story = {
  render: () => (
    <Card className="max-w-xl">
      <Table containerClassName="max-h-56">
        <TableHeader>
          <TableRow>
            <TableHead>Anfrage</TableHead>
            <TableHead className="text-right whitespace-nowrap">Ø Score</TableHead>
            <TableHead className="text-right whitespace-nowrap">Datum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 12 }, (_, i) => (
            <TableRow key={i}>
              <TableCell>Wie melde ich mich für die Klausur im Modul {i + 1} an?</TableCell>
              <TableCell className="text-right">0,{20 + i}</TableCell>
              <TableCell className="whitespace-nowrap text-right">0{(i % 9) + 1}.03.2026</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * Leerzustand: eine einzelne Zeile mit `colSpan` über alle Spalten. Die
 * Kopfzeile bleibt stehen, damit die Struktur der Tabelle lesbar bleibt —
 * ein leeres `<tbody>` wäre für Screenreader eine Tabelle ohne Aussage.
 */
export const Empty: Story = {
  render: () => (
    <Card className="max-w-2xl">
      <Table>
        <TableCaption>Zugriffsschlüssel</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Schlüssel</TableHead>
            <TableHead>Erstellt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="py-8 text-center text-on-surface-variant">
              Noch kein Schlüssel angelegt.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * Markdown-Tabelle: beliebiger Inhalt, schmale Spalte. Zellen umbrechen von
 * Haus aus, lange ungetrennte Zeichenketten (Hashes, URLs) brechen per
 * `wrap-anywhere` innerhalb der Zelle statt die Tabelle zu sprengen.
 */
export const ArbitraryContent: Story = {
  render: () => (
    <Card className="max-w-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quelle</TableHead>
            <TableHead>Fundstelle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <a className="text-primary underline" href="https://www.uni-giessen.de">
                Prüfungsordnung 2024
              </a>
            </TableCell>
            <TableCell>
              § 12 Abs. 3 — die Anmeldung erfolgt ausschließlich elektronisch und
              muss spätestens zwei Wochen vor dem Prüfungstermin vorliegen.
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dokument-Hash</TableCell>
            <TableCell>c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  ),
};

const RIGHT_GROUPS = [
  { label: "Thema", columns: ["Einladen", "Rechte vergeben"] },
  { label: "Quellen in Sidebar", columns: ["Quellen sehen", "Quellen auswählen", "Quellen herunterladen"] },
  { label: "Antworten", columns: ["Zitate sehen"] },
];
/** `true`/`false` = fest durch die Rolle, `"edit"` = hier einstellbar. */
const RIGHT_ROWS: { role: string; cells: (boolean | "edit")[] }[] = [
  { role: "Eigentümer", cells: [true, true, true, true, true, true] },
  { role: "Admin", cells: [true, true, true, true, true, true] },
  { role: "Bearbeiter", cells: [false, false, true, true, "edit", true] },
  { role: "Leser", cells: [false, false, "edit", "edit", "edit", "edit"] },
];

function RightsMatrix({ density, className }: { density?: TableDensity; className?: string }) {
  return (
    <Card className={className}>
      <Table density={density}>
        <TableCaption>Rollen und Rechte</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} wrap="words" className="align-bottom">
              Rolle
            </TableHead>
            {RIGHT_GROUPS.map((g, i) => (
              <TableHead key={g.label} group colSpan={g.columns.length} divider={i > 0}>
                {g.label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {RIGHT_GROUPS.flatMap((g, i) =>
              g.columns.map((c, j) => (
                <TableHead key={c} wrap="words" divider={i > 0 && j === 0} className="text-center">
                  {c}
                </TableHead>
              )),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {RIGHT_ROWS.map((row) => {
            let col = 0;
            return (
              <TableRow key={row.role}>
                <TableHead scope="row" wrap="words" className="font-semibold text-on-surface">
                  {row.role}
                </TableHead>
                {RIGHT_GROUPS.flatMap((g, i) =>
                  g.columns.map((c, j) => {
                    const value = row.cells[col++];
                    return (
                      <TableCell key={c} divider={i > 0 && j === 0} className="text-center">
                        {value === "edit" ? (
                          <Checkbox aria-label={`${row.role}: ${c}`} defaultChecked />
                        ) : (
                          <Checkbox locked checked={value} aria-label={`${row.role}: ${c} (fest)`} />
                        )}
                      </TableCell>
                    );
                  }),
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

/**
 * Spaltengruppen: eine Kopfzeile mit `group`-Überschriften (`colSpan`,
 * `scope="colgroup"`, Label in Primärfarbe unterstrichen) über der
 * Spaltenzeile; `divider` zieht die Grenze zwischen zwei Gruppen durch Kopf
 * und Rumpf. Unter dem Kopf steht **eine** Linie — die zwischen den beiden
 * Kopfzeilen entfällt, die Unterstreichung trennt dort. Kopfzeilen brechen mit
 * `wrap="words"` nur zwischen Wörtern. Feste Werte sind `Checkbox locked`,
 * einstellbare normale Checkboxen.
 */
export const GroupedColumns: Story = {
  render: () => <RightsMatrix className="max-w-4xl p-0" />,
  play: async ({ canvasElement, canvas }) => {
    const rows = canvasElement.querySelectorAll("thead tr");
    await expect(rows).toHaveLength(2);
    // One rule under the header: none between the group row and the column row.
    await expect(getComputedStyle(rows[0]).borderBottomWidth).toBe("0px");
    await expect(getComputedStyle(rows[1]).borderBottomWidth).toBe("1px");

    const group = canvas.getByRole("columnheader", { name: "Quellen in Sidebar" });
    await expect(group).toHaveAttribute("scope", "colgroup");
    const underline = group.firstElementChild as HTMLElement;
    await expect(getComputedStyle(underline).borderBottomWidth).toBe("2px");
    await expect(getComputedStyle(group).borderLeftWidth).toBe("1px");

    // Header words never break inside a word.
    const head = canvas.getByRole("columnheader", { name: "Quellen herunterladen" });
    await expect(getComputedStyle(head).overflowWrap).toBe("break-word");
    await expect(getComputedStyle(head).borderLeftWidth).toBe("0px");

    const locked = canvas.getByRole("checkbox", { name: "Leser: Einladen (fest)" });
    await expect(locked).toBeDisabled();
    await expect(getComputedStyle(locked).opacity).toBe("1");
  },
};

/**
 * Dieselbe Matrix mit `density="compact"`: `text-xs`, 32px Kopfzeilen,
 * `p-1.5` in den Zellen, kleinere Gruppenüberschrift — für dichte Matrizen,
 * die in eine schmale Spalte passen müssen (JustRAGs Rollen-×-Rechte-Tabelle,
 * ~670px). Der Aufrufort setzt keine Schriftgrößen- oder Padding-Klassen.
 */
export const GroupedColumnsCompact: Story = {
  render: () => <RightsMatrix density="compact" className="w-[670px] p-0" />,
  play: async ({ canvasElement, canvas }) => {
    const table = canvas.getByRole("table");
    await expect(table).toHaveAttribute("data-density", "compact");

    // text-xs = 0.75rem = 12px at the browser's 16px root.
    const head = canvas.getByRole("columnheader", { name: "Quellen herunterladen" });
    await expect(getComputedStyle(head).fontSize).toBe("12px");
    await expect(getComputedStyle(head).paddingLeft).toBe("6px");
    const cell = canvas.getAllByRole("cell")[0];
    await expect(getComputedStyle(cell).fontSize).toBe("12px");
    await expect(getComputedStyle(cell).paddingTop).toBe("6px");
    await expect(getComputedStyle(cell).paddingLeft).toBe("6px");

    const group = canvas.getByRole("columnheader", { name: "Quellen in Sidebar" });
    await expect(getComputedStyle(group).fontSize).toBe("12px");
    await expect(getComputedStyle(group).paddingTop).toBe("8px");
    await expect(getComputedStyle(group.firstElementChild as HTMLElement).borderBottomWidth).toBe("2px");

    // The whole matrix fits its 670px card: the scroll container has nothing
    // to scroll horizontally.
    const scroller = canvasElement.querySelector("table")?.parentElement as HTMLElement;
    await expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth);
  },
};

const ROTATED_ROLES = [
  { role: "Besitzer", fixed: true },
  { role: "Admin", fixed: true },
  { role: "Bearbeiter", fixed: false },
  { role: "Leser", fixed: false },
];
/** Je Recht: Werte für Bearbeiter und Leser (`"edit"` = hier einstellbar). */
const ROTATED_SECTIONS: { section: string; rights: { right: string; cells: (boolean | "edit")[] }[] }[] = [
  {
    section: "Thema",
    rights: [
      { right: "Einladen", cells: [false, false] },
      { right: "Rechte vergeben", cells: [false, false] },
    ],
  },
  {
    section: "Quellen in der Sidebar",
    rights: [
      { right: "Quellen sehen", cells: [true, "edit"] },
      { right: "Quellen auswählen", cells: [true, "edit"] },
      { right: "Quellen herunterladen", cells: ["edit", "edit"] },
    ],
  },
  { section: "Antworten", rights: [{ right: "Zitate sehen", cells: [true, "edit"] }] },
];

/**
 * `banded`: Abschnitte als Band mit Anzahl (`section="band"`, `count`) und
 * die beiden festen Spalten als EIN Band (`mutedJoin` start/end). Sonst die
 * Grundform: schlichte Abschnittsbeschriftung, je feste Spalte ein Band.
 */
function RightsByRole({ banded }: { banded: boolean }) {
  const fixedCount = ROTATED_ROLES.filter((r) => r.fixed).length;
  const join = (j: number) =>
    !banded || j >= fixedCount ? undefined : j === 0 ? "start" : j === fixedCount - 1 ? "end" : "middle";
  return (
    <Card className="max-w-2xl p-0">
      <Table>
        <TableCaption>Rechte je Rolle</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead wrap="words">Recht</TableHead>
            {ROTATED_ROLES.map((r, j) => (
              <TableHead
                key={r.role}
                wrap="words"
                className="text-center"
                muted={r.fixed}
                mutedEdge="top"
                mutedJoin={join(j)}
              >
                {r.role}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        {ROTATED_SECTIONS.map((group, g) => (
          // One TableBody per group: the row group `scope="rowgroup"` names.
          <TableBody key={group.section}>
            <TableRow>
              {/* Only the first column: a heading spanning the muted columns
                  would cover their band. */}
              <TableHead section={banded ? "band" : true} count={banded ? group.rights.length : undefined}>
                {group.section}
              </TableHead>
              {ROTATED_ROLES.map((r, j) => (
                <TableCell key={r.role} muted={r.fixed} mutedJoin={join(j)} />
              ))}
            </TableRow>
            {group.rights.map((row, i) => {
              const last = g === ROTATED_SECTIONS.length - 1 && i === group.rights.length - 1;
              return (
                <TableRow key={row.right}>
                  <TableHead scope="row" wrap="words" className="font-semibold text-on-surface">
                    {row.right}
                  </TableHead>
                  {ROTATED_ROLES.map((r, j) => {
                    const value = r.fixed ? true : row.cells[j - fixedCount];
                    return (
                      <TableCell
                        key={r.role}
                        className="text-center"
                        muted={r.fixed}
                        mutedEdge={last ? "bottom" : undefined}
                        mutedJoin={join(j)}
                      >
                        {value === "edit" ? (
                          <Checkbox aria-label={`${r.role}: ${row.right}`} defaultChecked />
                        ) : (
                          <Checkbox locked checked={value} aria-label={`${r.role}: ${row.right} (fest)`} />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        ))}
      </Table>
    </Card>
  );
}

const band = (el: Element) => getComputedStyle(el, "::before");
const cellOf = (el: HTMLElement) => el.closest("td") as HTMLElement;

/**
 * Gedrehte Matrix: Rechte als Zeilen, Rollen als Spalten. Besitzer und Admin
 * haben immer jedes Recht — ihre Spalten sind `muted` und mit `mutedJoin`
 * (`start` / `end`) zu EINEM Band verbunden: kein Spalt dazwischen, gerundet
 * nur an den äußeren Ecken (oben am Kopf mit `mutedEdge="top"`, unten an der
 * letzten Zeile mit `mutedEdge="bottom"`).
 *
 * Die Rechte sind in Gruppen gegliedert: je Gruppe ein `TableBody`, erste
 * Zeile eine Abschnittsüberschrift `TableHead section="band"` mit `count` —
 * die ganze Zeile ist ein getöntes Band, die Anzahl steht ruhiger hinter dem
 * Label. Die Überschrift steht nur in der ersten Spalte; wo das Abschnittsband
 * das gedämpfte Spaltenband kreuzt, ist die Kreuzung eine Stufe dunkler, das
 * Spaltenband läuft also sichtbar durch.
 */
export const RotatedMatrix: Story = {
  render: () => <RightsByRole banded />,
  play: async ({ canvas }) => {
    // One joined band: Besitzer is its start, Admin its end — no inset and no
    // rounding where they meet, rounded only at the band's outer corners.
    const owner = canvas.getByRole("columnheader", { name: "Besitzer" });
    const admin = canvas.getByRole("columnheader", { name: "Admin" });
    await expect(owner).toHaveAttribute("data-muted-join", "start");
    await expect(admin).toHaveAttribute("data-muted-join", "end");
    await expect(band(owner).borderTopLeftRadius).not.toBe("0px");
    await expect(band(owner).borderTopRightRadius).toBe("0px");
    await expect(band(owner).right).toBe("0px");
    await expect(band(owner).left).toBe("2px");
    await expect(band(admin).borderTopLeftRadius).toBe("0px");
    await expect(band(admin).borderTopRightRadius).not.toBe("0px");
    await expect(band(admin).left).toBe("0px");
    await expect(band(admin).right).toBe("2px");
    // The two halves touch: Besitzer's band ends where Admin's begins.
    const ownerBox = owner.getBoundingClientRect();
    const adminBox = admin.getBoundingClientRect();
    await expect(Math.abs(ownerBox.right - adminBox.left)).toBeLessThan(1.5);

    const lastAdmin = cellOf(canvas.getByRole("checkbox", { name: "Admin: Zitate sehen (fest)" }));
    await expect(band(lastAdmin).borderBottomRightRadius).not.toBe("0px");
    await expect(band(lastAdmin).borderBottomLeftRadius).toBe("0px");

    // A band section: full-row tint, label in uppercase, the count not —
    // and the count is part of the heading's name, after a comma.
    const section = canvas.getByRole("rowheader", { name: "Quellen in der Sidebar, 3" });
    await expect(section).toHaveAttribute("scope", "rowgroup");
    await expect(section).toHaveAttribute("data-section", "band");
    await expect(getComputedStyle(section).textTransform).toBe("uppercase");
    const count = section.querySelector('[data-slot="table-section-count"]') as HTMLElement;
    await expect(count).toHaveTextContent("3");
    await expect(getComputedStyle(count).textTransform).toBe("none");
    await expect(getComputedStyle(count).fontWeight).toBe("400");

    const sectionRow = section.parentElement as HTMLElement;
    // The band is one inset shadow over the whole row (no per-cell seams).
    const shadow = getComputedStyle(sectionRow).boxShadow;
    await expect(shadow).toContain("inset");
    // Tailwind composes several shadow layers; the band is the inset one.
    const insetLayer = shadow.split(/,(?![^(]*\))/).find((layer) => layer.includes("inset")) ?? "";
    const rowFill = (insetLayer.match(/rgba?\([^)]*\)/) ?? [""])[0];
    await expect(rowFill).not.toBe("");
    await expect(getComputedStyle(sectionRow).borderBottomWidth).toBe("0px");
    // The muted band crosses the section band, one step darker than the row
    // and than the band in a data row — visible, not swallowed.
    const crossing = sectionRow.children[1] as HTMLElement;
    await expect(crossing).toHaveAttribute("data-muted");
    await expect(band(crossing).backgroundColor).not.toBe(rowFill);
    await expect(band(crossing).backgroundColor).not.toBe(band(lastAdmin).backgroundColor);
    await expect(band(crossing).top).toBe("-1px");
    // A data row's band has the row fill's token (both surface-container).
    await expect(band(lastAdmin).backgroundColor).toBe(rowFill);
    // The hover half (no tint change) cannot be measured here — Testing
    // Library's hover never puts the row into CSS `:hover` — so its class is
    // pinned in table.test.tsx.
  },
};

/**
 * Die Grundform derselben Matrix: schlichte Abschnittsbeschriftung
 * (`section`, ohne Band) mit Abstand nach oben, und jede feste Spalte als
 * eigenes Band (ohne `mutedJoin`, 2px Abstand zwischen den Bändern). Zwischen
 * zwei gedämpften Zellen läuft das Band über die Zeilenlinie hinweg.
 */
export const RotatedMatrixPlain: Story = {
  render: () => <RightsByRole banded={false} />,
  play: async ({ canvas }) => {
    const head = canvas.getByRole("columnheader", { name: "Admin" });
    await expect(head).toHaveAttribute("data-muted-edge", "top");
    await expect(head).not.toHaveAttribute("data-muted-join");
    await expect(band(head).position).toBe("absolute");
    await expect(band(head).borderTopLeftRadius).not.toBe("0px");
    await expect(band(head).borderTopRightRadius).not.toBe("0px");
    await expect(band(head).borderBottomLeftRadius).toBe("0px");
    await expect(band(head).left).toBe("2px");
    await expect(band(head).right).toBe("2px");
    await expect(band(head).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    const plainHead = canvas.getByRole("columnheader", { name: "Leser" });
    await expect(plainHead).not.toHaveAttribute("data-muted");
    await expect(band(plainHead).content).toBe("none");

    // A middle cell: no rounding, reaching over the row rule on both sides.
    const middle = cellOf(canvas.getByRole("checkbox", { name: "Admin: Quellen sehen (fest)" }));
    await expect(band(middle).borderTopLeftRadius).toBe("0px");
    await expect(band(middle).top).toBe("-1px");
    await expect(band(middle).bottom).toBe("-1px");

    // A plain row-group heading: rowheader with scope=rowgroup, small
    // uppercase label, space above, a row with no fill and no rule.
    const section = canvas.getByRole("rowheader", { name: "Quellen in der Sidebar" });
    await expect(section).toHaveAttribute("scope", "rowgroup");
    await expect(section).not.toHaveAttribute("data-section");
    await expect(getComputedStyle(section).textTransform).toBe("uppercase");
    await expect(getComputedStyle(section).fontSize).toBe("12px");
    await expect(parseFloat(getComputedStyle(section).paddingTop)).toBeGreaterThan(
      parseFloat(getComputedStyle(section).paddingBottom),
    );
    const sectionRow = section.parentElement as HTMLElement;
    await expect(getComputedStyle(sectionRow).borderBottomWidth).toBe("0px");
    await expect(getComputedStyle(sectionRow).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(sectionRow).boxShadow).toBe("none");
    // The muted band runs through the heading row in its usual tone.
    await expect(band(sectionRow.children[2]).top).toBe("-1px");
    await expect(band(sectionRow.children[2]).backgroundColor).toBe(band(middle).backgroundColor);

    // The last body cell closes the band.
    const last = cellOf(canvas.getByRole("checkbox", { name: "Admin: Zitate sehen (fest)" }));
    await expect(last).toHaveAttribute("data-muted-edge", "bottom");
    await expect(band(last).borderBottomRightRadius).not.toBe("0px");
    await expect(band(last).bottom).toBe("0px");
  },
};
