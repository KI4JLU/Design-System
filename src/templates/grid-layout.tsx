import * as React from "react";
import { cn } from "../lib/utils";
import { headingTag, nextHeadingLevel, type HeadingLevel } from "../lib/heading-level";
import { Container } from "../components/container";
import { Grid } from "../components/grid";
import { PageHeader } from "../components/page-header";

/** One run of cells under a small heading — „Favoriten", „Weitere Themen". */
export interface GridLayoutGroup {
  /** Stable id: the React key and `renderGroup`'s second argument. */
  id: string;
  /**
   * The group's heading. Shown only while **two or more** groups have cells:
   * a heading over the only group would name the whole page a second time.
   */
  label: React.ReactNode;
  /** The group's cells, each with a `key`. */
  items: React.ReactNode[];
}

export interface GridLayoutProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Accessible name of the template's `region` landmark. Required: the
   * template is page content inside `AppShellLayout`'s `<main>`, and an
   * unnamed `<section>` is no landmark. Usually the page title's text.
   */
  label: string;
  /** The page title (`PageHeader`). Omit it when the title lives elsewhere. */
  title?: React.ReactNode;
  /**
   * Where the page title sits in the document outline, default `1`. Group
   * headings take the next level. The same dial as `SectionedGridLayout`'s.
   */
  headingLevel?: HeadingLevel;
  /** Muted line under the title. */
  description?: React.ReactNode;
  /**
   * The row between the header and the grid, start side: what narrows the
   * list — typically `FilterChips`. Wraps on a narrow screen.
   */
  filters?: React.ReactNode;
  /**
   * The same row, end side: what acts on the page — the view switch
   * (`SegmentedControl`) and the primary action („Neues Thema").
   */
  toolbarActions?: React.ReactNode;
  /**
   * `cards` (default): as many columns as fit the content width
   * (`Grid cols="auto"`, cells at least 17.5rem), so the count follows the
   * width — also when the shell's column collapses. `list`: one column of
   * rows at every width, closer together.
   *
   * A column count, not a different cell: pass rows in `list` and cards in
   * `cards`; the template does not swap them.
   */
  view?: "cards" | "list";
  /** `list` only: the rows' column labels, over the first group. */
  listHeader?: React.ReactNode;
  /**
   * `cards` only: every row as tall as the tallest one, so one card with more
   * content does not make its row stand out. Each cell is stretched to its
   * row; a card that should fill it needs `h-full`.
   */
  uniformRows?: boolean;
  /**
   * The cells of a page without groups. Ignored when `groups` is given. Each
   * cell needs a `key`, as in any list.
   */
  items?: React.ReactNode[];
  /** The cells in groups, in order. Groups without cells are left out. */
  groups?: GridLayoutGroup[];
  /** Shown instead of the grid when there is no cell at all. */
  emptyState?: React.ReactNode;
  /**
   * Wraps a group's grid — e.g. in a `SortableGroup asChild` to make its
   * cells sortable. Receives the rendered grid and the group (`id: "items"`
   * for a page without groups). Default: the grid as is.
   */
  renderGroup?: (grid: React.ReactElement, group: Pick<GridLayoutGroup, "id">) => React.ReactNode;
}

/**
 * Template „Grid": a page that is **one grid of cards, or one list of rows**
 * — the overview of a user's items („Mein Wissen", „Geteiltes Wissen",
 * „Werkzeuge"). `PageHeader` on top, a toolbar row (filters at the start, the
 * view switch and the primary action at the end), then the cells: flat, or in
 * groups under small headings („Favoriten" / „Weitere Themen").
 *
 * **Why not `SectionedGridLayout`.** That template's sections are
 * disclosures — every section has a chevron and opens and closes. This page
 * has no disclosure: its groups are plain headings that appear only while
 * there is more than one group. JLURAG built exactly this page itself
 * (`TopicGridPage.tsx`) for three views; this template is that page, moved
 * into the design system.
 *
 * Composes `Container` + `PageHeader` + `Grid`. Page **content**: hang it into
 * `AppShellLayout` as `children`.
 *
 * **Composition only.** No state, no data: which view is active, what the
 * filters hide and which cells are favourites are the app's. Drag-and-drop
 * reordering stays the app's too — `renderGroup` wraps each grid for it.
 *
 * **Responsive behaviour is CSS.** The column count is `Grid`'s `auto`, the
 * header stacks in `PageHeader`, and the toolbar row wraps.
 */
const GridLayout = React.forwardRef<HTMLElement, GridLayoutProps>(
  (
    {
      className,
      label,
      title,
      headingLevel = 1,
      description,
      filters,
      toolbarActions,
      view = "cards",
      listHeader,
      uniformRows = false,
      items,
      groups,
      emptyState,
      renderGroup,
      ...props
    },
    ref,
  ) => {
    const GroupHeading = headingTag(nextHeadingLevel(headingLevel));
    const shown = (groups ?? [{ id: "items", label: null, items: items ?? [] }]).filter(
      (group) => group.items.length > 0,
    );
    const isEmpty = shown.length === 0;
    const labelled = shown.length > 1;

    const grid = (cells: React.ReactNode[]) => (
      <Grid
        data-slot="grid-layout-grid"
        cols={view === "list" ? 1 : "auto"}
        // Cards need the gutter to read as separate objects; stacked rows
        // read as one list closer together.
        gap={view === "list" ? "sm" : "gutter"}
        className={cn(view === "cards" && uniformRows && "auto-rows-fr")}
      >
        {cells}
      </Grid>
    );

    return (
      <section
        ref={ref}
        aria-label={label}
        data-slot="grid-layout"
        data-view={view}
        className={cn("flex flex-col", className)}
        {...props}
      >
        <Container className="flex flex-col gap-stack-lg py-gutter md:py-margin-page">
          {title !== undefined && (
            <PageHeader title={title} headingLevel={headingLevel} description={description} />
          )}
          {(filters || toolbarActions) && (
            // The filters keep a usable width (20rem, or the whole row where
            // the row is narrower): rather than squeezing them, the actions
            // wrap onto the next line — and wrap inside themselves, so they
            // never stick out of a narrow page.
            <div data-slot="grid-layout-toolbar" className="flex flex-wrap items-center gap-stack-md">
              {filters && (
                <div data-slot="grid-layout-filters" className="min-w-[min(100%,20rem)] flex-1">
                  {filters}
                </div>
              )}
              {toolbarActions && (
                <div
                  data-slot="grid-layout-actions"
                  className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-stack-md"
                >
                  {toolbarActions}
                </div>
              )}
            </div>
          )}
          {isEmpty ? (
            emptyState
          ) : (
            <>
              {view === "list" && listHeader && (
                // Pulled toward the rows: it labels their columns.
                <div data-slot="grid-layout-list-header" className="-mb-stack-md">
                  {listHeader}
                </div>
              )}
              {shown.map((group) => {
                const rendered = renderGroup ? renderGroup(grid(group.items), group) : grid(group.items);
                return labelled ? (
                  <div key={group.id} className="flex flex-col gap-stack-sm">
                    <GroupHeading className="m-0 text-sm font-semibold text-on-surface-variant">
                      {group.label}
                    </GroupHeading>
                    {rendered}
                  </div>
                ) : (
                  <React.Fragment key={group.id}>{rendered}</React.Fragment>
                );
              })}
            </>
          )}
        </Container>
      </section>
    );
  },
);
GridLayout.displayName = "GridLayout";

export { GridLayout };
