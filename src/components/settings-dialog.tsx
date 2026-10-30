import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Maximize2, Minimize2, Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useElementBox } from "../lib/use-element-box";
import { useScrollFade } from "../lib/use-scroll-fade";
import { Button } from "./button";
import { Input } from "./input";
import { NavItem } from "./nav-item";
import { SidebarPanel } from "./sidebar-panel";
import { SettingsSearchContext } from "./settings-search-context";

export interface SettingsSection {
  /** Stable id; also the controlled `value`. */
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** Extra words the search matches (the rows' labels, synonyms). */
  keywords?: string[];
  /**
   * Label of the group this section belongs to, shown as a small grey heading
   * over its row in the section column. A heading leads each run of
   * consecutive sections with the same `group`, so keep a group's sections
   * together in `sections`; a section without one sits loose, no heading. A
   * search that matches nothing in a group drops its heading with it. With any
   * group the column shows no title of its own — the group headings label it —
   * and `title` stays the dialog's accessible name.
   */
  group?: string;
  content: React.ReactNode;
}

export interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SettingsSection[];
  /** Controlled section; omit for uncontrolled (starts on the first). */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name of the dialog. Default "Einstellungen". */
  title?: string;
  closeLabel?: string;
  searchPlaceholder?: string;
  /** Shown when the search matches no section. */
  emptyLabel?: string;
  /**
   * `default`: a fixed 900×640 window for quick preferences that apply as
   * they change. `xl`: a workspace for editors — full screen below `sm`, from
   * `sm` the box of `fitTo` (1rem inside it, at least 960px wide) or, without
   * one, 1120×860; either way capped by the viewport.
   */
  size?: "default" | "xl";
  /**
   * With `size="xl"`: the element whose box the dialog covers from `sm` —
   * typically the page's content area, so the dialog spans exactly that region
   * while the overlay still dims and disables the whole page. A box narrower
   * than 960px (a content column between two sidebars on a smaller screen) is
   * outgrown: the dialog is 960px wide, centred on the box, kept inside the
   * window. Followed when the box or the window resizes.
   */
  fitTo?: React.RefObject<HTMLElement | null>;
  /**
   * Actions under the section pane, outside its scroll — for settings that are
   * saved explicitly (status on the left, Abbrechen/Speichern on the right).
   * Omit it for settings that apply as they change.
   */
  footer?: React.ReactNode;
  /**
   * Shows a maximize toggle next to the close button: maximized, the dialog
   * fills the window (1rem inside it from `sm`, full screen below), whatever
   * `size` and `fitTo` say. For editors with long forms or wide tables.
   */
  maximizable?: boolean;
  /** Controlled maximized state; omit for uncontrolled (starts restored). */
  maximized?: boolean;
  onMaximizedChange?: (maximized: boolean) => void;
  maximizeLabel?: string;
  restoreLabel?: string;
}

const xlClasses = cn(
  "top-0 left-0 h-dvh w-full",
  "sm:top-1/2 sm:left-1/2 sm:h-[min(860px,92dvh)] sm:w-[min(1120px,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border",
);

// From `sm` the fitted dialog takes the geometry `fitGeometry` computed.
const fittedClasses = cn(
  "sm:top-[var(--settings-fit-top)] sm:left-[var(--settings-fit-left)]",
  "sm:h-[var(--settings-fit-height)] sm:w-[var(--settings-fit-width)]",
  "sm:translate-x-0 sm:translate-y-0",
);

// Maximized: the window, 1rem inside it from `sm` (FIT_GUTTER), full screen below.
const maximizedClasses = cn(
  "top-0 left-0 h-dvh w-full",
  "sm:top-4 sm:left-4 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:border",
);

/** Gap between a fitted dialog and the edges of its box (and the window). */
const FIT_GUTTER = 16;
/** A fitted dialog is never narrower than this (or the window, less its gutters). */
const FIT_MIN_WIDTH = 960;

/**
 * Where a fitted dialog goes: `box` inset by the gutter. A box narrower than
 * FIT_MIN_WIDTH — the content column on a smaller screen, between its two
 * sidebars — would cramp the dialog, so it then grows past the box, centred on
 * it. Whatever the box, the dialog stays inside the window, gutter included,
 * on all four sides: the page behind a modal cannot scroll, so a footer pushed
 * past an edge would be unreachable.
 */
function fitGeometry(
  box: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
) {
  const maxWidth = viewport.width - 2 * FIT_GUTTER;
  const width = Math.min(maxWidth, Math.max(box.width - 2 * FIT_GUTTER, Math.min(FIT_MIN_WIDTH, maxWidth)));
  const centred = box.left + box.width / 2 - width / 2;
  const left = Math.min(Math.max(centred, FIT_GUTTER), Math.max(FIT_GUTTER, viewport.width - width - FIT_GUTTER));
  const top = Math.max(box.top + FIT_GUTTER, FIT_GUTTER);
  const bottom = Math.min(box.top + box.height - FIT_GUTTER, viewport.height - FIT_GUTTER);
  return { left, top, width, height: Math.max(0, bottom - top) };
}

const HIGHLIGHT = "settings-search";
/** How long a section without a matching row may take to render more before it counts as a miss. */
const MISS_SETTLE_MS = 400;


/** Ranges of every occurrence of `q` (lower-cased) in the text nodes under `el`. */
function matchRanges(el: Element, q: string): Range[] {
  const ranges: Range[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const raw = node.textContent ?? "";
    const text = raw.toLocaleLowerCase();
    // Lower-casing that changes the length (e.g. „İ") would shift the offsets: skip that node.
    if (text.length !== raw.length) continue;
    for (let i = text.indexOf(q); i !== -1; i = text.indexOf(q, i + q.length)) {
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + q.length);
      ranges.push(range);
    }
  }
  return ranges;
}

/**
 * Matches the section's SettingsRows against the search (label + description) and marks
 * them on the DOM: `data-search-miss` on a row without the query, `data-filtering` on the
 * scroller while misses are to be hidden (tokens.css hides them, and whatever else holds
 * no matching row). A section without a single matching row is left whole rather than
 * blanked. Every occurrence in the section's text is highlighted — rows, but also lists,
 * tables and headings — with the CSS Custom Highlight API where the browser has it.
 * Returns the hits that keep the section listed: matching rows, or else text occurrences.
 */
function applySearch(root: HTMLElement, q: string, filter: boolean): number {
  // A section counts as a hit through any visible text, not only its rows: content without
  // SettingsRows (a list, a table, a history) keeps the section listed too.
  let hits = 0;
  for (const row of root.querySelectorAll<HTMLElement>('[data-slot="settings-row"]')) {
    const parts = row.querySelectorAll('[data-slot="settings-row-label"], [data-slot="settings-row-description"]');
    const hit = Boolean(q) && [...parts].some((part) => (part.textContent ?? "").toLocaleLowerCase().includes(q));
    row.toggleAttribute("data-search-miss", Boolean(q) && !hit);
    if (hit) hits++;
  }
  root.toggleAttribute("data-filtering", Boolean(q) && filter && hits > 0);
  const ranges = q ? matchRanges(root, q) : [];
  if (typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined") {
    if (ranges.length) CSS.highlights.set(HIGHLIGHT, new Highlight(...ranges));
    else CSS.highlights.delete(HIGHLIGHT);
  }
  // Only text the reader can see counts (not a `hidden` note, not a native select's options);
  // without `checkVisibility` (jsdom) every text counts.
  const seen = ranges.filter((r) => {
    const el = r.startContainer.parentElement;
    return !el || typeof el.checkVisibility !== "function" || el.checkVisibility();
  });
  return Math.max(hits, seen.length);
}

/**
 * The section's scrolling content. Its own component so the fade hook runs when
 * the dialog's content mounts (a closed Radix dialog renders none), and content
 * that scrolls under the title fades out at the edge like the section column does.
 * It also applies the search to the section's rows (`applySearch`), again whenever
 * the section's content changes.
 */
function SettingsContent({
  section,
  inset,
  query,
  filter,
  onHits,
  children,
}: {
  section: string;
  inset: string;
  /** The search, trimmed and lower-cased; empty for none. */
  query: string;
  /** False while the query names the section itself: then every row stays. */
  filter: boolean;
  /** How many rows hold the query, after every search. */
  onHits: (hits: number) => void;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const filtering = Boolean(query) && filter;
  const search = React.useMemo(() => ({ query, filtering }), [query, filtering]);
  // The latest callback, read when a search runs: the search itself reruns only for its own inputs.
  const onHitsRef = React.useRef(onHits);
  React.useLayoutEffect(() => {
    onHitsRef.current = onHits;
  });
  useScrollFade(ref);
  // One scroll box serves every section, so a new section starts at its top instead of
  // inheriting where the last one was scrolled to.
  React.useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [section]);
  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    // A hit is reported at once; a miss only once the section has had MISS_SETTLE_MS to
    // settle — content that opens parts for the search (useSettingsSearch) or loads its rows
    // renders them after this first pass, and a miss reported now would drop the section first.
    let settle = 0;
    const run = () => {
      const hits = applySearch(root, query, filter);
      window.clearTimeout(settle);
      if (hits > 0 || !query) onHitsRef.current(hits);
      else settle = window.setTimeout(() => onHitsRef.current(applySearch(root, query, filter)), MISS_SETTLE_MS);
    };
    run();
    // Rows that load or change after the first paint (a section fetching its data). Only
    // text and structure: the attributes applySearch sets would otherwise re-trigger it.
    const observer = typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(run);
    observer?.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      window.clearTimeout(settle);
      observer?.disconnect();
      if (typeof CSS !== "undefined" && "highlights" in CSS) CSS.highlights.delete(HIGHLIGHT);
    };
  }, [query, filter, section]);
  return (
    <div
      ref={ref}
      data-slot="settings-dialog-content"
      className={cn("min-h-0 flex-1 overflow-y-auto pb-6 max-sm:px-4", inset)}
    >
      {/* The content's own column inside the scroller: a child with a fixed height keeps it and scrolls,
          instead of shrinking to the box as a direct flex item of the scroller would. */}
      <div className="flex flex-col">
        <SettingsSearchContext.Provider value={search}>{children}</SettingsSearchContext.Provider>
      </div>
    </div>
  );
}

/** Consecutive sections with the same `group`; ungrouped ones form runs without a label. */
function groupRuns(sections: SettingsSection[]) {
  const runs: { group?: string; sections: SettingsSection[] }[] = [];
  for (const s of sections) {
    const last = runs[runs.length - 1];
    if (last && last.group === s.group) last.sections.push(s);
    else runs.push({ group: s.group, sections: [s] });
  }
  return runs;
}

/**
 * The settings window: a left column with search and one row per section,
 * the chosen section on the right under its title, and the close button in
 * the top-right corner like every Dialog. Content is
 * the consumer's — build it from `SettingsRow`s.
 *
 * Sections with a `group` sit under a small grey heading for it. Search
 * filters the sections by label and `keywords`; if the open section drops out,
 * the first match is shown and `onValueChange` is called with it. Inside the
 * open section it finds the `SettingsRow`s whose label or description holds
 * the query: every occurrence in the section is highlighted, and — unless the
 * query names the section itself — everything but the matching rows is hidden. Radix dialog: focus trap, Escape and
 * scroll lock included. Corner radius follows the app-wide Style.
 */
function SettingsDialog({
  open,
  onOpenChange,
  sections,
  value: valueProp,
  onValueChange,
  title = "Einstellungen",
  closeLabel = "Schließen",
  searchPlaceholder = "Einstellungen suchen",
  emptyLabel = "Keine Treffer",
  size = "default",
  fitTo,
  footer,
  maximizable = false,
  maximized: maximizedProp,
  onMaximizedChange,
  maximizeLabel = "Maximieren",
  restoreLabel = "Wiederherstellen",
}: SettingsDialogProps) {
  const [innerMaximized, setInnerMaximized] = React.useState(false);
  const maximized = maximizable && (maximizedProp ?? innerMaximized);
  const toggleMaximized = () => {
    setInnerMaximized(!maximized);
    onMaximizedChange?.(!maximized);
  };
  // The section pane's side inset — title, content and footer share it. Maximized, the pane is as wide as
  // the window, so it grows with it (64px from `lg`, 192px from `xl`); rows would otherwise run from the
  // column's edge to the window's. Below `lg` the 240px column and a wide inset leave no room for the rows.
  const inset = maximized ? "px-8 lg:px-16 xl:px-48" : "px-8";
  const titleInset = maximized ? "pl-8 lg:pl-16 xl:pl-48" : "pl-8";
  // Measured only while open: a dialog mounted closed would otherwise keep the
  // box from mount time, wherever the page has scrolled since.
  const box = useElementBox(open && size === "xl" && !maximized ? fitTo : undefined);
  // Re-rendered on every re-measure, which a window resize triggers too.
  const fit = box && fitGeometry(box, { width: window.innerWidth, height: window.innerHeight });
  // The box radius; full screen below `sm` has no corners.
  const radius = "rounded-[var(--ui-radius-box)]";
  const smRadius = "sm:rounded-[var(--ui-radius-box)]";
  const [inner, setInner] = React.useState(sections[0]?.value);
  const [query, setQuery] = React.useState("");
  const groupId = React.useId();
  // With groups the headings label the column, so it carries no title of its
  // own; without, `title` is the grey list label over the rows.
  const grouped = sections.some((s) => s.group);
  const current = valueProp ?? inner;
  const select = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };

  const q = query.trim().toLocaleLowerCase();
  // The open section whose rows were searched for `q` and hold none of it. Until then the open
  // section stays in the list even when its label and keywords miss: its rows may still match
  // (a word in a description), and only the mounted section can tell.
  const [rowMiss, setRowMiss] = React.useState<{ section: string; q: string } | null>(null);
  // A verdict holds for one search only: cleared with the query or the dialog, a repeated search
  // looks at the section's rows afresh (they may have changed meanwhile).
  if ((!q || !open) && rowMiss !== null) setRowMiss(null);
  const visible = q
    ? sections.filter(
        (s) =>
          [s.label, ...(s.keywords ?? [])].some((w) => w.toLocaleLowerCase().includes(q)) ||
          (s.value === current && !(rowMiss?.section === s.value && rowMiss.q === q)),
      )
    : sections;
  const shown = visible.find((s) => s.value === current) ?? visible[0];
  const shownSection = shown?.value;
  const onHits = (hits: number) => {
    // Only the open section's verdict counts: a section shown as a fallback is listed by its
    // label or keywords anyway, and recording it would put the open one back (and loop).
    if (!q || hits > 0 || shownSection !== current) return;
    setRowMiss((prev) => (prev?.section === current && prev.q === q ? prev : { section: current, q }));
  };
  // A search that drops the open section shows the first match; tell the caller, or it keeps working with
  // the section that is no longer on screen (its data, its footer, its URL).
  const shownValue = shown?.value;
  React.useEffect(() => {
    if (shownValue !== undefined && shownValue !== current) onValueChange?.(shownValue);
  }, [shownValue, current, onValueChange]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          data-slot="settings-dialog"
          data-size={size}
          data-fitted={fit ? "" : undefined}
          data-maximized={maximized ? "" : undefined}
          aria-describedby={undefined}
          style={
            fit
              ? ({
                  "--settings-fit-top": `${fit.top}px`,
                  "--settings-fit-left": `${fit.left}px`,
                  "--settings-fit-width": `${fit.width}px`,
                  "--settings-fit-height": `${fit.height}px`,
                } as React.CSSProperties)
              : undefined
          }
          className={cn(
            "fixed z-50 flex overflow-hidden border-outline-variant bg-surface-container-lowest text-on-surface shadow-modal focus:outline-none",
            maximized
              ? cn(maximizedClasses, smRadius)
              : size === "xl"
              ? cn(xlClasses, fit && fittedClasses, smRadius)
              : cn("top-1/2 left-1/2 h-[min(640px,88dvh)] w-[min(900px,94vw)] -translate-x-1/2 -translate-y-1/2 border", radius),
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {/* The section column is the same SidebarPanel frame as every side
              column: search fixed on top, the rows below scroll. */}
          <nav
            aria-label={title}
            // A shade off the content pane (surface vs. lowest), plus the rule.
            className="w-60 shrink-0 border-r border-outline-variant bg-surface max-sm:w-auto"
          >
            {/* The column title is the dialog's own title, as the grey label over
                the section rows (SidebarPanel's list label); with groups the
                headings do that job and there is none. */}
            <SidebarPanel
              fade={0}
              title={grouped ? undefined : title}
              head={(
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  leadingIcon={<Search aria-hidden="true" />}
                  // The nav column's search matches its 14px rows; Input has no small size yet.
                  // eslint-disable-next-line design-system/layout-only-classname -- row-sized field in the settings nav, reasoned above
                  className="h-9 py-0 text-sm"
                />
              )}
            >
              <div className="flex flex-col gap-0.5">
                {groupRuns(visible).map((run, i) => {
                  const rows = run.sections.map((s) => (
                    <NavItem
                      key={s.value}
                      type="button"
                      active={s.value === shown?.value}
                      onClick={() => select(s.value)}
                    >
                      {s.icon}
                      <span>{s.label}</span>
                    </NavItem>
                  ));
                  if (!run.group) return <React.Fragment key={run.sections[0].value}>{rows}</React.Fragment>;
                  const labelId = `${groupId}-${i}`;
                  return (
                    <div
                      key={run.sections[0].value}
                      role="group"
                      aria-labelledby={labelId}
                      // Same label as SidebarPanel's list title (size, grey, inset). The first
                      // group stands off the search by 16px; later groups, 10px (the title's margin).
                      className="mt-4 flex flex-col gap-0.5 [&:not(:first-child)]:mt-2.5"
                    >
                      <div id={labelId} className="flex min-h-6 items-center px-2.5 text-[13px] font-medium text-outline">
                        {run.group}
                      </div>
                      {rows}
                    </div>
                  );
                })}
                {visible.length === 0 && (
                  <p className="px-3 py-2 text-sm text-on-surface-variant">{emptyLabel}</p>
                )}
              </div>
            </SidebarPanel>
          </nav>
          <div className="flex min-w-0 flex-1 flex-col">
            {/* The title stays put and only the content scrolls, so the scrollbar starts
                under the title row (and the close button) instead of running up to the
                dialog's top edge. The right padding keeps the title clear of the close button. */}
            <section
              aria-labelledby={shown ? `settings-section-${shown.value}` : undefined}
              className="flex min-h-0 flex-1 flex-col"
            >
              {shown && (
                <>
                  <h2
                    id={`settings-section-${shown.value}`}
                    className={cn(
                      "m-0 shrink-0 pt-7 pb-2 text-[17px] font-semibold text-on-surface max-sm:pl-4",
                      titleInset,
                      maximizable ? "pr-28 max-sm:pr-24" : "pr-20 max-sm:pr-16",
                    )}
                  >
                    {shown.label}
                  </h2>
                  <SettingsContent
                    section={shown.value}
                    inset={inset}
                    query={q}
                    filter={!shown.label.toLocaleLowerCase().includes(q)}
                    onHits={onHits}
                  >{shown.content}</SettingsContent>
                </>
              )}
            </section>
            {footer && (
              <div
                data-slot="settings-dialog-footer"
                className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant py-4 max-sm:px-4", inset)}
              >
                {footer}
              </div>
            )}
          </div>
          {/* Top-right, like every Dialog's close; the maximize toggle sits just before it. */}
          <div className="absolute top-4 right-4 flex items-center gap-1">
            {maximizable && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={maximized ? restoreLabel : maximizeLabel}
                title={maximized ? restoreLabel : maximizeLabel}
                onClick={toggleMaximized}
              >
                {maximized
                  ? <Minimize2 aria-hidden="true" className="size-5" />
                  : <Maximize2 aria-hidden="true" className="size-5" />}
              </Button>
            )}
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label={closeLabel} title={closeLabel}>
                <X aria-hidden="true" className="size-5" />
              </Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export interface SettingsRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** The control on the right (Select, Switch, Button) — or a read-only value. */
  control?: React.ReactNode;
  /** Id for the label, so the control can point `aria-labelledby` at it. */
  labelId?: string;
}

/** One line of a settings section: label (+ description) left, control right, a rule below. */
const SettingsRow = React.forwardRef<HTMLDivElement, SettingsRowProps>(
  ({ label, description, control, labelId, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="settings-row"
      className={cn("flex flex-col gap-3 border-b border-outline-variant py-4 last:border-b-0", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div id={labelId} data-slot="settings-row-label" className="text-[15px] text-on-surface">{label}</div>
          {description && (
            <p data-slot="settings-row-description" className="m-0 mt-0.5 text-sm text-on-surface-variant">{description}</p>
          )}
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      {children}
    </div>
  ),
);
SettingsRow.displayName = "SettingsRow";

export { SettingsDialog, SettingsRow };
