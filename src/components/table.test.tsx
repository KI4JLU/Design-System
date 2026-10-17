import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

/**
 * ORACLE — W3C HTML-AAM, "HTML Element Role Mappings", plus the ARIA accname
 * computation. Independent of this component: the mappings below are asserted
 * through Testing Library's `getByRole`, which resolves roles via aria-query /
 * dom-accessibility-api — a third-party implementation of those same specs.
 * Nothing in `table.tsx` ever names a role, so a passing `getByRole("row")`
 * can only come from the native element the component chose to render.
 *
 *   <table>            → role "table"
 *   <thead>/<tbody>/<tfoot> → role "rowgroup"
 *   <tr>               → role "row"
 *   <th scope="col">   → role "columnheader"
 *   <th scope="row">   → role "rowheader"
 *   <td>               → role "cell"
 *   <caption>          → accessible NAME of the table (name from content)
 *
 * The wrapper oracle is APG's landmark guidance + HTML-AAM's "no role" rule
 * for a generic <div>: an element without a role contributes nothing to the
 * accessibility tree, so wrapping the table must leave the tree identical and
 * must not mint a landmark.
 */

const COLUMNS = ["Name", "Schlüssel", "Erstellt", "Zuletzt genutzt"];
const ROWS = [
  ["Ingest-Pipeline", "jlu_a1b2", "01.02.2026", "gestern"],
  ["Eval-Runner", "jlu_c3d4", "14.03.2026", "vor 3 Tagen"],
];

const renderTable = (opts: { caption?: string; footer?: boolean } = {}) =>
  render(
    <Table>
      {opts.caption ? <TableCaption>{opts.caption}</TableCaption> : null}
      <TableHeader>
        <TableRow>
          {COLUMNS.map((c) => (
            <TableHead key={c}>{c}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row[0]}>
            {row.map((cell) => (
              <TableCell key={cell}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      {opts.footer ? (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={COLUMNS.length}>2 Schlüssel</TableCell>
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>,
  );

describe("Table — native semantics (HTML-AAM role mappings)", () => {
  it("exposes table / rowgroup / row / columnheader / cell", () => {
    renderTable();
    const table = screen.getByRole("table");
    // thead + tbody are two rowgroups; header row + 2 data rows = 3 rows.
    expect(within(table).getAllByRole("rowgroup")).toHaveLength(2);
    expect(within(table).getAllByRole("row")).toHaveLength(1 + ROWS.length);
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((el) => el.textContent),
    ).toEqual(COLUMNS);
    expect(within(table).getAllByRole("cell")).toHaveLength(
      ROWS.length * COLUMNS.length,
    );
  });

  it("counts <tfoot> as a third rowgroup and its colSpan cell as one cell", () => {
    renderTable({ footer: true });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("rowgroup")).toHaveLength(3);
    // The footer adds one row and exactly one cell, spanning all columns.
    expect(within(table).getAllByRole("row")).toHaveLength(2 + ROWS.length);
    expect(within(table).getAllByRole("cell")).toHaveLength(
      ROWS.length * COLUMNS.length + 1,
    );
    expect(screen.getByRole("cell", { name: "2 Schlüssel" })).toHaveAttribute(
      "colspan",
      String(COLUMNS.length),
    );
  });

  it("makes TableHead a columnheader through scope=col, and scope=row a rowheader", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Ingest-Pipeline</TableHead>
            <TableCell>aktiv</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    // Overriding scope flips the role — proof the role comes from the native
    // scope attribute, not from anything the component hardcodes.
    expect(screen.getByRole("rowheader", { name: "Ingest-Pipeline" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader")).toBeNull();
  });

  it("defaults scope to col so a header cell is announced as a column header", () => {
    renderTable();
    for (const el of screen.getAllByRole("columnheader")) {
      expect(el.tagName).toBe("TH");
      expect(el).toHaveAttribute("scope", "col");
    }
  });
});

describe("Table — accessible name from <caption>", () => {
  it("resolves the table by its caption text", () => {
    renderTable({ caption: "Zugriffsschlüssel" });
    expect(screen.getByRole("table", { name: "Zugriffsschlüssel" })).toBeInTheDocument();
  });

  it("has no accessible name when no caption is given", () => {
    renderTable();
    expect(screen.getByRole("table")).toHaveAccessibleName("");
  });

  it("renders the caption as a <caption> element inside the table", () => {
    renderTable({ caption: "Zugriffsschlüssel" });
    // HTML content model: <caption> is a child of <table>, not a sibling —
    // an accname sourced from a <div> outside the table would not be a caption.
    const caption = screen.getByRole("table", { name: "Zugriffsschlüssel" })
      .firstElementChild;
    expect(caption?.tagName).toBe("CAPTION");
  });
});

describe("Table — scroll container", () => {
  it("wraps the table in its own container without disturbing the a11y tree", () => {
    const { container } = renderTable({ caption: "Zugriffsschlüssel" });
    const table = screen.getByRole("table", { name: "Zugriffsschlüssel" });
    const wrapper = table.parentElement as HTMLElement;
    // A container exists between the table and the render root …
    expect(wrapper).not.toBe(container);
    expect(container).toContainElement(wrapper);
    // … and it is role-less and untabbable, so the accessibility tree is the
    // bare table structure (HTML-AAM: a generic <div> maps to no role).
    expect(wrapper).not.toHaveAttribute("role");
    expect(wrapper).not.toHaveAttribute("tabindex");
    // No landmark is minted (APG: avoid landmark proliferation).
    expect(within(container).queryAllByRole("region")).toHaveLength(0);
  });

  it("puts containerClassName on the container, never on the table", () => {
    render(
      <Table containerClassName="max-h-72" className="table-fixed">
        <TableBody>
          <TableRow>
            <TableCell>Zelle</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByRole("table");
    // The bounded height belongs to the scroll port, otherwise a vertically
    // scrolling table (JustRAG's dashboard) is impossible to build.
    expect(table.parentElement).toHaveClass("max-h-72");
    expect(table).not.toHaveClass("max-h-72");
    expect(table).toHaveClass("table-fixed");
  });
});

describe("Table — arbitrary cell content (markdown tables)", () => {
  it("keeps interactive content inside a cell reachable by its own role", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <a href="https://example.org">Quelle</a>
            </TableCell>
            <TableCell>
              <button type="button">Export</button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(2);
    expect(within(cells[0]).getByRole("link", { name: "Quelle" })).toBeInTheDocument();
    expect(within(cells[1]).getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("accepts raw <tr>/<td> children, as react-markdown emits them", () => {
    // A markdown renderer maps only some tags; the parts must not require
    // their own children types to keep the structure valid.
    render(
      <Table>
        <TableHeader>
          <tr>
            <th scope="col">Spalte</th>
          </tr>
        </TableHeader>
        <TableBody>
          <tr>
            <td>Wert</td>
          </tr>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("columnheader", { name: "Spalte" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Wert" })).toBeInTheDocument();
    expect(screen.getAllByRole("rowgroup")).toHaveLength(2);
  });
});

/**
 * ORACLE for the props below — the props' own documented contract (JSDoc in
 * table.tsx), checked through the rendered markup only: the wrap mode is the
 * Tailwind utility that maps to the CSS `overflow-wrap` value named in the
 * contract (`anywhere` → `wrap-anywhere`, `words` → `wrap-break-word`), the
 * group heading's role comes from HTML-AAM (`th scope="colgroup"` is still a
 * `columnheader`). Pixel geometry (one rule under the header, underline width)
 * is measured in a real browser by the `GroupedColumns` story's play function.
 */
const renderGrouped = (density?: TableDensity) =>
  render(
    <Table density={density}>
      <TableHeader>
        <TableRow>
          <TableHead rowSpan={2}>Rolle</TableHead>
          <TableHead group colSpan={2}>
            Thema
          </TableHead>
          <TableHead group colSpan={2} divider>
            Antworten
          </TableHead>
        </TableRow>
        <TableRow>
          <TableHead wrap="words">Einladen</TableHead>
          <TableHead wrap="words">Rechte vergeben</TableHead>
          <TableHead wrap="words" divider>
            Quellen sehen
          </TableHead>
          <TableHead wrap="words">Zitate sehen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead scope="row">Leser</TableHead>
          <TableCell>nein</TableCell>
          <TableCell>nein</TableCell>
          <TableCell divider>ja</TableCell>
          <TableCell>ja</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );

describe("Table — wrap", () => {
  it("breaks anywhere by default, on head and cell", () => {
    renderTable();
    expect(screen.getAllByRole("columnheader")[0]).toHaveClass("wrap-anywhere");
    expect(screen.getAllByRole("cell")[0]).toHaveClass("wrap-anywhere");
  });

  it('wrap="words" only breaks between words', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead wrap="words">Quellen herunterladen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell wrap="words">Eintrag</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const head = screen.getByRole("columnheader", { name: "Quellen herunterladen" });
    const cell = screen.getByRole("cell", { name: "Eintrag" });
    for (const el of [head, cell]) {
      expect(el).toHaveClass("wrap-break-word");
      expect(el).not.toHaveClass("wrap-anywhere");
    }
  });
});

describe("Table — column groups", () => {
  it("a group heading is a columnheader with scope=colgroup spanning its columns", () => {
    renderGrouped();
    const group = screen.getByRole("columnheader", { name: "Thema" });
    expect(group.tagName).toBe("TH");
    expect(group).toHaveAttribute("scope", "colgroup");
    expect(group).toHaveAttribute("colspan", "2");
    expect(group).toHaveAttribute("data-slot", "table-group-head");
  });

  it("underlines the group label in primary, not the whole cell", () => {
    renderGrouped();
    const group = screen.getByRole("columnheader", { name: "Thema" });
    expect(group).toHaveClass("text-center", "font-semibold");
    // The rule sits on the label's own box, so it is inset by the cell's
    // padding and two adjacent groups' underlines never touch.
    const label = group.firstElementChild as HTMLElement;
    expect(label.textContent).toBe("Thema");
    expect(label).toHaveClass("border-b-2", "border-primary");
    expect(group).not.toHaveClass("border-b-2");
  });

  it("keeps an explicit scope on a group heading", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead group scope="col">
              Gruppe
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    expect(screen.getByRole("columnheader", { name: "Gruppe" })).toHaveAttribute("scope", "col");
  });

  it("a plain heading renders its children without the group wrapper", () => {
    renderGrouped();
    const plain = screen.getByRole("columnheader", { name: "Einladen" });
    expect(plain).toHaveAttribute("scope", "col");
    expect(plain).not.toHaveAttribute("data-slot");
    expect(plain.firstChild?.nodeType).toBe(Node.TEXT_NODE);
  });

  it("divider draws a leading rule on head and cell, and only where set", () => {
    renderGrouped();
    expect(screen.getByRole("columnheader", { name: "Antworten" })).toHaveClass(
      "border-l",
      "border-outline-variant",
    );
    expect(screen.getByRole("columnheader", { name: "Quellen sehen" })).toHaveClass("border-l");
    const cells = screen.getAllByRole("cell");
    expect(cells.map((c) => c.classList.contains("border-l"))).toEqual([false, false, true, false]);
    expect(screen.getByRole("columnheader", { name: "Thema" })).not.toHaveClass("border-l");
  });

  it("closes the header with a rule under the last header row only", () => {
    const { container } = renderGrouped();
    const thead = container.querySelector("thead") as HTMLElement;
    // The header rows carry TableRow's own bottom border; the thead removes it
    // from every row but the last, so a grouped header gets one rule, not two.
    expect(thead).toHaveClass("[&_tr]:border-b", "[&_tr:not(:last-child)]:border-b-0");
    expect(thead.querySelectorAll("tr")).toHaveLength(2);
  });
});

/**
 * ORACLE — the `density` contract in table.tsx's JSDoc, checked through the
 * Tailwind utilities that name it (`text-xs`/`text-sm`, `h-8`/`h-10`,
 * `p-1.5`/`p-2`). Whether those classes cascade into the rendered size is
 * Tailwind's business and is measured in a real browser by the
 * `GroupedColumnsCompact` story's play function.
 */
describe("Table — density", () => {
  it("default leaves the data-table rhythm unchanged", () => {
    renderGrouped();
    expect(screen.getByRole("table")).toHaveAttribute("data-density", "default");
    expect(screen.getByRole("table")).toHaveClass("text-sm");
    expect(screen.getByRole("columnheader", { name: "Einladen" })).toHaveClass("h-10", "px-2");
    expect(screen.getAllByRole("cell")[0]).toHaveClass("p-2");
    expect(screen.getAllByRole("cell")[0]).not.toHaveClass("text-xs");
  });

  it("compact shrinks text, header height and padding on every part", () => {
    renderGrouped("compact");
    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("data-density", "compact");
    expect(table).toHaveClass("text-xs");
    expect(table).not.toHaveClass("text-sm");

    const head = screen.getByRole("columnheader", { name: "Einladen" });
    expect(head).toHaveClass("h-8", "px-1.5", "text-xs");
    expect(head).not.toHaveClass("h-10", "px-2");

    const rowHead = screen.getByRole("rowheader", { name: "Leser" });
    expect(rowHead).toHaveClass("h-8", "px-1.5", "text-xs");

    for (const cell of screen.getAllByRole("cell")) {
      expect(cell).toHaveClass("p-1.5", "text-xs");
      expect(cell).not.toHaveClass("p-2");
    }
  });

  it("compact scales the group heading and its underline", () => {
    renderGrouped("compact");
    const group = screen.getByRole("columnheader", { name: "Thema" });
    expect(group).toHaveClass("pt-2", "pb-0");
    expect(group).not.toHaveClass("pt-3");
    expect(group.firstElementChild).toHaveClass("pb-1", "border-b-2", "border-primary");
  });

  it("compact reaches the caption, and a call-site class still wins", () => {
    render(
      <Table density="compact">
        <TableCaption>Rechte</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell className="p-3">Wert</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText("Rechte")).toHaveClass("text-xs");
    const cell = screen.getByRole("cell", { name: "Wert" });
    expect(cell).toHaveClass("p-3");
    expect(cell).not.toHaveClass("p-1.5");
  });

  it("does not leak into a default table rendered next to a compact one", () => {
    render(
      <>
        <Table density="compact" aria-label="dicht">
          <TableBody>
            <TableRow>
              <TableCell>a</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Table aria-label="normal">
          <TableBody>
            <TableRow>
              <TableCell>b</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>,
    );
    expect(screen.getByRole("cell", { name: "a" })).toHaveClass("p-1.5");
    expect(screen.getByRole("cell", { name: "b" })).toHaveClass("p-2");
  });
});

/**
 * ORACLE — the `muted` / `mutedEdge` contract in table.tsx's JSDoc: the data
 * attributes it documents and the `before:` utilities that draw the band. The
 * band's actual geometry (radius, the 1px reach over the row rule) is
 * measured in a real browser by the `RotatedMatrix` story's play function.
 */
describe("Table — muted columns", () => {
  const renderMuted = () =>
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recht</TableHead>
            <TableHead muted mutedEdge="top">Admin</TableHead>
            <TableHead>Leser</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Einladen</TableHead>
            <TableCell muted>ja-1</TableCell>
            <TableCell>nein-1</TableCell>
          </TableRow>
          <TableRow>
            <TableHead scope="row">Zitate</TableHead>
            <TableCell muted mutedEdge="bottom">ja-2</TableCell>
            <TableCell>nein-2</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

  it("marks muted cells and their band ends with data attributes", () => {
    renderMuted();
    const head = screen.getByRole("columnheader", { name: "Admin" });
    expect(head).toHaveAttribute("data-muted", "");
    expect(head).toHaveAttribute("data-muted-edge", "top");
    expect(screen.getByRole("cell", { name: "ja-1" })).toHaveAttribute("data-muted", "");
    expect(screen.getByRole("cell", { name: "ja-1" })).not.toHaveAttribute("data-muted-edge");
    expect(screen.getByRole("cell", { name: "ja-2" })).toHaveAttribute("data-muted-edge", "bottom");
  });

  it("leaves plain cells untouched", () => {
    renderMuted();
    for (const el of [
      screen.getByRole("columnheader", { name: "Leser" }),
      screen.getByRole("cell", { name: "nein-1" }),
    ]) {
      expect(el).not.toHaveAttribute("data-muted");
      expect(el).not.toHaveClass("isolate", "before:bg-surface-container");
    }
  });

  it("tints the band, quiets the text and rounds only the marked ends", () => {
    renderMuted();
    const head = screen.getByRole("columnheader", { name: "Admin" });
    const middle = screen.getByRole("cell", { name: "ja-1" });
    const last = screen.getByRole("cell", { name: "ja-2" });
    for (const el of [head, middle, last]) {
      expect(el).toHaveClass("relative", "isolate", "text-on-surface-variant", "before:bg-surface-container");
    }
    // Standalone band: 2px inset on both sides; corners are logical
    // (ss/se = top start/end, es/ee = bottom start/end).
    for (const el of [head, middle, last]) expect(el).toHaveClass("before:start-0.5", "before:end-0.5");
    expect(head).toHaveClass("before:rounded-ss-lg", "before:rounded-se-lg", "before:top-0", "before:-bottom-px");
    expect(head).not.toHaveClass("before:rounded-es-lg", "before:rounded-ee-lg");
    expect(middle).toHaveClass("before:-top-px", "before:-bottom-px");
    expect(middle.className).not.toMatch(/before:rounded-/);
    expect(last).toHaveClass("before:rounded-es-lg", "before:rounded-ee-lg", "before:bottom-0", "before:-top-px");
  });

  it("ignores mutedEdge without muted", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell mutedEdge="bottom">x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = screen.getByRole("cell", { name: "x" });
    expect(cell).not.toHaveAttribute("data-muted-edge");
    expect(cell.className).not.toMatch(/before:/);
  });

  it("mutedJoin makes adjacent columns one band, rounded at its outer corners only", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead muted mutedEdge="top" mutedJoin="start">Besitzer</TableHead>
            <TableHead muted mutedEdge="top" mutedJoin="middle">Co-Admin</TableHead>
            <TableHead muted mutedEdge="top" mutedJoin="end">Admin</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const start = screen.getByRole("columnheader", { name: "Besitzer" });
    const middle = screen.getByRole("columnheader", { name: "Co-Admin" });
    const end = screen.getByRole("columnheader", { name: "Admin" });
    expect(start).toHaveAttribute("data-muted-join", "start");
    expect(middle).toHaveAttribute("data-muted-join", "middle");
    expect(end).toHaveAttribute("data-muted-join", "end");

    // Start: outer (start) side inset and rounded, shared (end) side flush and square.
    expect(start).toHaveClass("before:start-0.5", "before:end-0", "before:rounded-ss-lg");
    expect(start).not.toHaveClass("before:end-0.5", "before:rounded-se-lg");
    // Middle: flush on both sides, no rounding.
    expect(middle).toHaveClass("before:start-0", "before:end-0");
    expect(middle.className).not.toMatch(/before:rounded-/);
    // End: the mirror of start.
    expect(end).toHaveClass("before:start-0", "before:end-0.5", "before:rounded-se-lg");
    expect(end).not.toHaveClass("before:start-0.5", "before:rounded-ss-lg");
  });

  it("ignores mutedJoin without muted", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell mutedJoin="start">x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = screen.getByRole("cell", { name: "x" });
    expect(cell).not.toHaveAttribute("data-muted-join");
    expect(cell.className).not.toMatch(/before:/);
  });
});

/**
 * ORACLE — HTML-AAM: a `th` with `scope="rowgroup"` maps to `rowheader`
 * (resolved by Testing Library, not by table.tsx), plus the `section`
 * contract in table.tsx's JSDoc for the classes. The rendered type size and
 * the missing rule under the heading row are measured in a real browser by
 * the `RotatedMatrix` story.
 */
describe("Table — row-group heading (section)", () => {
  const renderSections = () =>
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead section colSpan={2}>Thema</TableHead>
          </TableRow>
          <TableRow>
            <TableHead scope="row">Einladen</TableHead>
            <TableCell>ja</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

  it("is a rowheader with scope=rowgroup spanning its colSpan", () => {
    renderSections();
    const head = screen.getByRole("rowheader", { name: "Thema" });
    expect(head).toHaveAttribute("scope", "rowgroup");
    expect(head).toHaveAttribute("colspan", "2");
    expect(head).toHaveAttribute("data-slot", "table-section-head");
  });

  it("keeps an explicit scope", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead section scope="row">Thema</TableHead>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("rowheader", { name: "Thema" })).toHaveAttribute("scope", "row");
  });

  it("is a small uppercase semibold muted label with space above", () => {
    renderSections();
    const head = screen.getByRole("rowheader", { name: "Thema" });
    expect(head).toHaveClass("text-xs", "uppercase", "font-semibold", "text-on-surface-variant", "pt-5", "pb-1");
    expect(head).not.toHaveClass("h-10", "font-medium");
  });

  it('section="band" tints the whole row as one inset shadow and keeps the label on-surface', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead section="band">Thema</TableHead>
            <TableCell muted />
          </TableRow>
        </TableBody>
      </Table>,
    );
    const head = screen.getByRole("rowheader", { name: "Thema" });
    expect(head).toHaveAttribute("scope", "rowgroup");
    expect(head).toHaveAttribute("data-section", "band");
    expect(head).toHaveClass("uppercase", "font-semibold", "text-on-surface", "py-2");
    expect(head).not.toHaveClass("pt-5", "text-on-surface-variant");
    const row = screen.getByRole("row");
    expect(row).toHaveClass(
      "has-[[data-section=band]]:shadow-[inset_0_0_0_100vmax_var(--color-surface-container)]",
      // The muted band's crossing, one step darker than the section band.
      "has-[[data-section=band]]:[&>[data-muted]]:before:bg-surface-container-high",
    );
  });

  it("a plain section carries no band marker", () => {
    renderSections();
    expect(screen.getByRole("rowheader", { name: "Thema" })).not.toHaveAttribute("data-section");
  });

  it("count follows the label, unstyled by the uppercase, and joins the name after a comma", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead section="band" count={4}>Quellen in der Sidebar</TableHead>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const head = screen.getByRole("rowheader", { name: "Quellen in der Sidebar, 4" });
    const count = head.querySelector('[data-slot="table-section-count"]') as HTMLElement;
    expect(count).toHaveTextContent("4");
    expect(count).toHaveClass("normal-case", "font-normal", "text-on-surface-variant");
    // Label first, count last.
    expect(head.lastElementChild).toBe(count);
  });

  it("renders no count slot without a count, and ignores count without section", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead count={4}>Spalte</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead section>Thema</TableHead>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("columnheader", { name: "Spalte" }).querySelector('[data-slot="table-section-count"]')).toBeNull();
    expect(screen.getByRole("rowheader", { name: "Thema" }).querySelector('[data-slot="table-section-count"]')).toBeNull();
  });

  it("its row opts out of the hover tint and the rule; data rows keep both", () => {
    renderSections();
    const [sectionRow, dataRow] = screen.getAllByRole("row");
    for (const row of [sectionRow, dataRow]) {
      // One class string for every row; the :has() variant only matches the
      // row that holds a section heading (checked in the browser by the story).
      expect(row).toHaveClass(
        "hover:bg-surface-container-high",
        "has-[[data-slot=table-section-head]]:hover:bg-transparent",
        "has-[[data-slot=table-section-head]]:border-b-0",
      );
    }
    expect(sectionRow.querySelector('[data-slot="table-section-head"]')).not.toBeNull();
    expect(dataRow.querySelector('[data-slot="table-section-head"]')).toBeNull();
  });

  it("tightens its top space in a compact table", () => {
    render(
      <Table density="compact">
        <TableBody>
          <TableRow>
            <TableHead section>Thema</TableHead>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const head = screen.getByRole("rowheader", { name: "Thema" });
    expect(head).toHaveClass("pt-3", "px-1.5");
    expect(head).not.toHaveClass("pt-5");
  });
});
