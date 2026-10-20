import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useElementBox } from "../lib/use-element-box";
import { Button } from "./button";
import { Input } from "./input";
import { NavItem } from "./nav-item";
import { SidebarPanel } from "./sidebar-panel";
import { useUiShape } from "./ui-shape-context";

export interface SettingsSection {
  /** Stable id; also the controlled `value`. */
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** Extra words the search matches (the rows' labels, synonyms). */
  keywords?: string[];
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
 * The settings window: a left column with search and one row per section,
 * the chosen section on the right under its title, and the close button in
 * the top-right corner like every Dialog. Content is
 * the consumer's — build it from `SettingsRow`s.
 *
 * Search filters the sections by label and `keywords`; if the open section
 * drops out, the first match is shown. Radix dialog: focus trap, Escape and
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
}: SettingsDialogProps) {
  const { shape } = useUiShape();
  // Measured only while open: a dialog mounted closed would otherwise keep the
  // box from mount time, wherever the page has scrolled since.
  const box = useElementBox(open && size === "xl" ? fitTo : undefined);
  // Re-rendered on every re-measure, which a window resize triggers too.
  const fit = box && fitGeometry(box, { width: window.innerWidth, height: window.innerHeight });
  const radius = shape === "pill" ? "rounded-3xl" : "rounded-xl";
  // Full screen below `sm` has no corners; literal classes, so Tailwind sees them.
  const smRadius = shape === "pill" ? "sm:rounded-3xl" : "sm:rounded-xl";
  const [inner, setInner] = React.useState(sections[0]?.value);
  const [query, setQuery] = React.useState("");
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

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          data-slot="settings-dialog"
          data-size={size}
          data-fitted={fit ? "" : undefined}
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
            size === "xl"
              ? cn(xlClasses, fit && fittedClasses, smRadius)
              : cn("top-1/2 left-1/2 h-[min(640px,88dvh)] w-[min(900px,94vw)] -translate-x-1/2 -translate-y-1/2 border", radius),
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {/* The section column is the same SidebarPanel frame as every side
              column: search fixed on top, the rows below scroll. */}
          <nav
            aria-label={title}
            className="w-60 shrink-0 border-r border-outline-variant bg-surface-container-low max-sm:w-auto"
          >
            <SidebarPanel
              fade={0}
              head={(
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  leadingIcon={<Search aria-hidden="true" />}
                />
              )}
            >
              <div className="flex flex-col gap-1">
                {visible.map((s) => (
                  <NavItem
                    key={s.value}
                    type="button"
                    active={s.value === shown?.value}
                    onClick={() => select(s.value)}
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </NavItem>
                ))}
                {visible.length === 0 && (
                  <p className="px-3 py-2 text-sm text-on-surface-variant">{emptyLabel}</p>
                )}
              </div>
            </SidebarPanel>
          </nav>
          <div className="flex min-w-0 flex-1 flex-col">
            <section
              aria-labelledby={shown ? `settings-section-${shown.value}` : undefined}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-6 max-sm:px-4"
            >
              {shown && (
                <>
                  <h2
                    id={`settings-section-${shown.value}`}
                    className="m-0 border-b border-outline-variant pr-12 pb-5 text-2xl font-semibold text-on-surface"
                  >
                    {shown.label}
                  </h2>
                  <div className="flex flex-col">{shown.content}</div>
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
          {/* Top-right, like every Dialog's close. */}
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" aria-label={closeLabel} title={closeLabel}>
              <X aria-hidden="true" className="size-5" />
            </Button>
          </DialogPrimitive.Close>
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
      className={cn("flex flex-col gap-3 border-b border-outline-variant py-5 last:border-b-0", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div id={labelId} className="text-base text-on-surface">{label}</div>
          {description && <p className="m-0 mt-1 text-sm text-on-surface-variant">{description}</p>}
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      {children}
    </div>
  ),
);
SettingsRow.displayName = "SettingsRow";

export { SettingsDialog, SettingsRow };
