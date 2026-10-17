import * as React from "react";
import { cn } from "../lib/utils";

/**
 * How tightly a table is set. `default` is the data-table rhythm (`text-sm`,
 * 40px header, `p-2` cells). `compact` is for dense matrices that must fit a
 * narrow column (e.g. a role × rights table): `text-xs`, 32px header,
 * `p-1.5` cells, a smaller group heading. Set once on `Table`; every
 * `TableHead`, `TableCell` and `TableCaption` inside follows it, so a call
 * site never needs a font-size or padding class.
 */
export type TableDensity = "default" | "compact";

const TableDensityContext = React.createContext<TableDensity>("default");

/**
 * Semantic data table — the shadcn part set, normalised onto JLU tokens.
 * Deliberately **no Radix**: Radix Primitives ships no table primitive and the
 * shadcn source imports only React + `cn` (verified against the file
 * `npx shadcn@latest add table` emitted). Native `<table>` markup already
 * carries the whole accessibility contract (HTML-AAM maps `table` → `table`,
 * `thead`/`tbody`/`tfoot` → `rowgroup`, `tr` → `row`, `th scope="col"` →
 * `columnheader`, `td` → `cell`, and `<caption>` supplies the table's
 * accessible name), so a JS layer on top could only take that away.
 *
 * `Table` brings its own horizontal scroll container, matching both the
 * shadcn shape and this repo's precedent that wide content scrolls in its own
 * container (`TableLayout`, the markdown table overrides in the consuming
 * apps). The container is a bare `<div>` with **no role and no tabindex**: an
 * element without a role is transparent to the accessibility tree, so the
 * table/rowgroup/row/columnheader/cell structure survives it intact. Giving it
 * `role="region"` would mint an extra landmark — APG warns against landmark
 * proliferation, and an unnamed region is discarded by most screen readers
 * anyway. Use `containerClassName` to reach that container (e.g. a bounded
 * height for a vertically scrolling table).
 */
export interface TableProps extends React.ComponentProps<"table"> {
  /**
   * Classes for the scroll container around the table (layout only, e.g.
   * `max-h-72` for a vertically scrolling table). The `<table>` itself is
   * styled through `className`.
   */
  containerClassName?: string;
  /** Text size and cell padding of the whole table. Default `"default"`. */
  density?: TableDensity;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, density = "default", ...props }, ref) => (
    <TableDensityContext.Provider value={density}>
      <div className={cn("relative w-full overflow-x-auto", containerClassName)}>
        <table
          ref={ref}
          data-density={density}
          className={cn(
            "w-full caption-bottom text-on-surface",
            density === "compact" ? "text-xs" : "text-sm",
            className,
          )}
          {...props}
        />
      </div>
    </TableDensityContext.Provider>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<"thead">
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    // Only the last header row closes the header with a rule. A header with
    // column groups (a `group` row above the column row) must not get a second
    // line between the two rows: the group heading's own underline is the
    // separator there.
    className={cn(
      "[&_tr]:border-b [&_tr]:border-outline-variant [&_tr:not(:last-child)]:border-b-0",
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<"tbody">
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<"tfoot">
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-outline-variant bg-surface-container font-medium [&>tr:last-child]:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentProps<"tr">>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      // A row holding a row-group heading (`TableHead section`) is a label,
      // not data: no rule under it and no hover tint (`has-…:hover:` outranks
      // the plain `hover:` by one more pseudo-class). With `section="band"`
      // the row is a full-width `surface-container` band, painted as ONE inset
      // shadow on the row rather than a row background: Chromium paints a row
      // background cell by cell, which leaves 1px hairline seams at fractional
      // column widths. Muted cells in a band row draw the crossing one step
      // darker (`surface-container-high`), so a muted column band stays
      // visible through the section band instead of vanishing in it.
      className={cn(
        "border-b border-outline-variant transition-colors hover:bg-surface-container-high data-[state=selected]:bg-secondary-container",
        "has-[[data-slot=table-section-head]]:border-b-0 has-[[data-slot=table-section-head]]:hover:bg-transparent",
        "has-[[data-section=band]]:shadow-[inset_0_0_0_100vmax_var(--color-surface-container)]",
        "has-[[data-section=band]]:[&>[data-muted]]:before:bg-surface-container-high",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

/**
 * How a cell's text wraps when its column is narrow. `anywhere` (default)
 * may break inside a word, so long unbroken data (ids, URLs) never widens the
 * table. `words` only breaks between words (a single word longer than the
 * column still breaks) — for headers and short labels, where "Sehe-n" is
 * worse than a slightly wider column.
 */
export type TableCellWrap = "anywhere" | "words";
const wrapClass: Record<TableCellWrap, string> = {
  anywhere: "wrap-anywhere",
  words: "wrap-break-word",
};

/**
 * Which end of a muted column band a cell is: `top` rounds its upper corners
 * (the header cell), `bottom` its lower ones (the last body cell). Cells in
 * between take no edge, so consecutive muted cells read as one band.
 */
export type TableMutedEdge = "top" | "bottom";

/**
 * Where a muted column sits in a band shared by ADJACENT muted columns:
 * `start` = the first column (inline-start side rounded and inset), `middle`
 * = an inner column (no rounding, no inset), `end` = the last column.
 * Unset, every muted column is its own band (2px inset on both sides).
 */
export type TableMutedJoin = "start" | "middle" | "end";

/** `true` = a plain row-group label; `"band"` = the label on a full-row tint. */
export type TableSection = boolean | "band";

interface MutedProps {
  /**
   * A column that is shown but not editable here (e.g. a role that always has
   * every right): tinted band, quieter text. Set it on every cell of the
   * column, header included, and `mutedEdge` on the two ends.
   */
  muted?: boolean;
  /** Rounds this end of the muted band. Only read when `muted` is set. */
  mutedEdge?: TableMutedEdge;
  /**
   * Joins adjacent muted columns into ONE band: set it on every cell of each
   * joined column (`start` on the first, `end` on the last, `middle` between).
   * Only read when `muted` is set.
   */
  mutedJoin?: TableMutedJoin;
}

/**
 * The band is a pseudo-element behind the cell's content rather than the
 * cell's own background: CSS Backgrounds 3 says `border-radius` does not
 * apply to internal table elements under `border-collapse: collapse`, which
 * Tailwind's preflight sets on every table. `isolate` keeps the pseudo-element's
 * negative z-index inside the cell, above the row's hover fill. Between two
 * muted cells the band reaches 1px past the cell over the row rule (a
 * positioned cell paints above the collapsed borders), so the column reads as
 * one band and not as stacked tiles; its rounded ends stay inside the cell. A
 * 2px inset on each side keeps two neighbouring muted columns two bands —
 * unless `mutedJoin` joins them: then the shared sides have no inset and no
 * rounding, and only the band's outer corners are rounded. Sides and corners
 * are logical (start/end), so a joined band mirrors correctly in RTL.
 */
const mutedClasses = (
  muted: boolean,
  edge: TableMutedEdge | undefined,
  group: TableMutedJoin | undefined,
) => {
  if (!muted) return false;
  // The band's own outer sides: a standalone column has both.
  const outerStart = group === undefined || group === "start";
  const outerEnd = group === undefined || group === "end";
  return cn(
    "relative isolate text-on-surface-variant",
    "before:absolute before:-z-10 before:bg-surface-container",
    outerStart ? "before:start-0.5" : "before:start-0",
    outerEnd ? "before:end-0.5" : "before:end-0",
    edge === "top"
      ? cn("before:top-0", outerStart && "before:rounded-ss-lg", outerEnd && "before:rounded-se-lg")
      : "before:-top-px",
    edge === "bottom"
      ? cn("before:bottom-0", outerStart && "before:rounded-es-lg", outerEnd && "before:rounded-ee-lg")
      : "before:-bottom-px",
  );
};

const mutedData = (
  muted: boolean,
  edge: TableMutedEdge | undefined,
  group: TableMutedJoin | undefined,
) => ({
  "data-muted": muted ? "" : undefined,
  "data-muted-edge": muted ? edge : undefined,
  "data-muted-join": muted ? group : undefined,
});

export interface TableHeadProps extends React.ComponentProps<"th">, MutedProps {
  wrap?: TableCellWrap;
  /**
   * A column-group heading (spans its columns via `colSpan`, `scope="colgroup"`):
   * centred, emphasised, with a primary underline under its label that
   * separates it from the column headings below.
   */
  group?: boolean;
  /** Vertical rule on the cell's leading edge — the boundary between two column groups. */
  divider?: boolean;
  /**
   * A row-group heading: the label row that starts a group of rows (e.g.
   * „Quellen in der Sidebar" in a rights matrix). `scope="rowgroup"` unless
   * set, small uppercase semibold label; its row takes no hover tint and no
   * rule. `true`: a plain label in `on-surface-variant` with space above it.
   * `"band"`: the whole row becomes a full-width `surface-container` band
   * with the label in `on-surface`.
   *
   * Span the row with `colSpan` — but a heading cell that spans a muted
   * column covers that column's band. To keep muted bands running through a
   * band row, span only the columns before the first muted one and fill the
   * rest of the row with `TableCell`s (muted ones with `muted`/`mutedJoin`):
   * the band row draws them one step darker, so the column band visibly
   * crosses the section band. Give each group its own `TableBody`, heading
   * row first — that is the row group `scope="rowgroup"` refers to.
   */
  section?: TableSection;
  /**
   * With `section`: a count after the label (e.g. the rows in the group), in
   * regular-weight `on-surface-variant` text and not uppercased. Part of the
   * heading's accessible name, separated by a comma only screen readers get
   * („Quellen in der Sidebar, 4"). Ignored without `section`.
   */
  count?: React.ReactNode;
}

/**
 * Column header. `scope="col"` is the default and is what makes the cell a
 * `columnheader` rather than a bare `cell` — override it (`scope="row"`) only
 * for a row header. A `group` heading defaults to `scope="colgroup"`.
 */
const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    {
      className, scope, wrap = "anywhere", group = false, divider = false, section = false, count,
      muted = false, mutedEdge, mutedJoin, children, ...props
    },
    ref,
  ) => {
    const compact = React.useContext(TableDensityContext) === "compact";
    return (
      <th
        ref={ref}
        scope={scope ?? (group ? "colgroup" : section ? "rowgroup" : "col")}
        data-slot={group ? "table-group-head" : section ? "table-section-head" : undefined}
        data-section={section === "band" ? "band" : undefined}
        {...mutedData(muted, mutedEdge, mutedJoin)}
        className={cn(
          "text-left align-middle font-medium text-on-surface-variant",
          compact ? "h-8 px-1.5 text-xs" : "h-10 px-2",
          wrapClass[wrap],
          group && cn("pb-0 text-center font-semibold text-on-surface", compact ? "pt-2" : "pt-3"),
          section && "h-auto text-xs font-semibold uppercase tracking-wide",
          section === true && cn("pb-1 text-on-surface-variant", compact ? "pt-3" : "pt-5"),
          section === "band" && cn("text-on-surface", compact ? "py-1.5" : "py-2"),
          divider && "border-l border-outline-variant",
          mutedClasses(muted, mutedEdge, mutedJoin),
          className,
        )}
        {...props}
      >
        {group ? (
          <span className={cn("block border-b-2 border-primary", compact ? "pb-1" : "pb-1.5")}>{children}</span>
        ) : (
          children
        )}
        {section && count !== undefined && count !== null && count !== false ? (
          <>
            {/* A comma for the accessible name only. Zero-size INLINE text, not
                `sr-only`: sr-only is absolutely positioned, i.e. blockified,
                and the name computation pads block-level boxes with spaces
                („Thema , 2"). */}
            <span className="text-[0px] select-none">,</span>{" "}
            <span
              data-slot="table-section-count"
              className="ms-1 font-normal normal-case tracking-normal text-on-surface-variant"
            >
              {count}
            </span>
          </>
        ) : null}
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

export interface TableCellProps extends React.ComponentProps<"td">, MutedProps {
  wrap?: TableCellWrap;
  /** Vertical rule on the cell's leading edge — the boundary between two column groups. */
  divider?: boolean;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, wrap = "anywhere", divider = false, muted = false, mutedEdge, mutedJoin, ...props }, ref) => {
    const compact = React.useContext(TableDensityContext) === "compact";
    return (
      <td
        ref={ref}
        {...mutedData(muted, mutedEdge, mutedJoin)}
        className={cn(
          "align-middle",
          compact ? "p-1.5 text-xs" : "p-2",
          wrapClass[wrap],
          divider && "border-l border-outline-variant",
          mutedClasses(muted, mutedEdge, mutedJoin),
          className,
        )}
        {...props}
      />
    );
  },
);
TableCell.displayName = "TableCell";

/**
 * Table caption. `<caption>` must be the **first** child of `<table>` in the
 * DOM (HTML content model); `caption-bottom` on the table renders it below.
 * It supplies the table's accessible name, so a captioned table resolves via
 * `getByRole("table", { name })`.
 */
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.ComponentProps<"caption">
>(({ className, ...props }, ref) => {
  const compact = React.useContext(TableDensityContext) === "compact";
  return (
    <caption
      ref={ref}
      className={cn(compact ? "mt-3 text-xs" : "mt-4 text-sm", "text-on-surface-variant", className)}
      {...props}
    />
  );
});
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
