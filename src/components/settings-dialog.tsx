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

/**
 * The section's scrolling content. Its own component so the fade hook runs when
 * the dialog's content mounts (a closed Radix dialog renders none), and content
 * that scrolls under the title fades out at the edge like the section column does.
 */
function SettingsContent({ section, children }: { section: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useScrollFade(ref);
  // One scroll box serves every section, so a new section starts at its top instead of
  // inheriting where the last one was scrolled to.
  React.useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [section]);
  return (
    <div
      ref={ref}
      data-slot="settings-dialog-content"
      className="min-h-0 flex-1 overflow-y-auto px-8 pb-6 max-sm:px-4"
    >
      {/* The content's own column inside the scroller: a child with a fixed height keeps it and scrolls,
          instead of shrinking to the box as a direct flex item of the scroller would. */}
      <div className="flex flex-col">{children}</div>
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
 * the first match is shown and `onValueChange` is called with it. Radix dialog: focus trap, Escape and
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
  const visible = q
    ? sections.filter((s) => [s.label, ...(s.keywords ?? [])].some((w) => w.toLocaleLowerCase().includes(q)))
    : sections;
  const shown = visible.find((s) => s.value === current) ?? visible[0];
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
                      "m-0 shrink-0 pt-7 pb-2 pl-8 text-[17px] font-semibold text-on-surface max-sm:pl-4",
                      maximizable ? "pr-28 max-sm:pr-24" : "pr-20 max-sm:pr-16",
                    )}
                  >
                    {shown.label}
                  </h2>
                  <SettingsContent section={shown.value}>{shown.content}</SettingsContent>
                </>
              )}
            </section>
            {footer && (
              <div
                data-slot="settings-dialog-footer"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-8 py-4 max-sm:px-4"
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
          <div id={labelId} className="text-[15px] text-on-surface">{label}</div>
          {description && <p className="m-0 mt-0.5 text-sm text-on-surface-variant">{description}</p>}
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      {children}
    </div>
  ),
);
SettingsRow.displayName = "SettingsRow";

export { SettingsDialog, SettingsRow };
