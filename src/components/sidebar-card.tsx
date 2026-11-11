import * as React from "react";
import { Loader2 } from "lucide-react";
import { useRovingRows } from "../lib/use-roving-rows";
import { cn } from "../lib/utils";
import { ActionMenu, type ActionMenuItem } from "./action-menu";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { sidebarCardVariants, sidebarIconTileVariants } from "./sidebar-card-variants";

export type SidebarCardAction = ActionMenuItem;
export type SidebarSelectionTone = "default" | "destructive";

export interface SidebarCardProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
  /** Leading glyph (an svg, or an emoji string), shown small and grey. */
  icon?: React.ReactNode;
  /** A short type label instead of a glyph ("PDF", "DOCX"), shown as a grey badge. Wins over `icon`. */
  iconText?: string;
  title: string;
  /**
   * Opens the item: the title button and a click anywhere on the card.
   * Without it the card is not openable (e.g. a source the user may see but
   * not download): the title is plain text — no button, not focusable — and
   * the card has no pointer cursor or hover fill. Checkbox, extras and the
   * actions menu stay as they are; in `selectionMode` a click on the card
   * still toggles the selection. The checkbox is the keyboard path there —
   * without `selectable` the title stays a button that toggles, so a
   * toggling card is never pointer-only.
   */
  onOpen?: () => void;
  /** Secondary lines under the title (status, errors, progress). */
  meta?: React.ReactNode;
  /** Inline controls before the checkbox (e.g. retry). */
  extra?: React.ReactNode;
  actions?: SidebarCardAction[];
  /** Accessible name prefix of the actions trigger: `${actionsLabel} ${title}`. */
  actionsLabel?: string;
  active?: boolean;
  /** Show the selection checkbox. */
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Accessible name prefix of the checkbox: `${selectLabel} ${title}`. */
  selectLabel?: string;
  /** Batch mode: a click toggles the selection instead of opening; menu and extras hide. */
  selectionMode?: boolean;
  /**
   * Greyed out: the item is there and fully usable, but currently left out of
   * something (a source excluded from the chat). Dims the tile, title and
   * meta; the checkbox, extras and actions menu keep full strength, since they
   * still work. Not a disabled state — clicks, focus and the menu behave as
   * without it.
   */
  muted?: boolean;
  /**
   * A failure on this row (an ingest that failed): the row is tinted in the
   * error colour and the message is its tooltip and accessible description —
   * no extra line, so the row stays one line. A selection tint wins.
   */
  error?: string;
  /**
   * Work in progress on this row (an ingest running or queued): the leading
   * tile becomes a spinner, and the text is its tooltip and accessible
   * description — no status line. An `error` wins.
   */
  busy?: string;
  /**
   * What the selection is for. `destructive` = a delete selection: a ticked
   * card and its checkbox take the error colour instead of primary, so the
   * user sees what is about to go. Only matters in `selectionMode`.
   */
  selectionTone?: SidebarSelectionTone;
  titleTestId?: string;
}

const titleClass = "block w-full truncate text-left text-sm text-on-surface";
/** The current row's title: primary text, medium weight — as an active NavItem. */
const activeTextClass = "font-medium text-primary";
/** The same strength as a muted SidebarRailItem, so card and rail agree. */
const mutedClass = "opacity-50";

/**
 * The row's trailing column: every trailing control — the ⋯ trigger, an
 * `extra` button, the checkbox in its 32px box — and the selection bar's
 * buttons are 32px wide, on the row's 4px end inset, so they share one centre
 * line 20px from the edge.
 */
const trailingBox = "flex size-8 shrink-0 items-center justify-center";

/** The row's ⋯ trigger: quiet, shown on hover / focus / open, always without hover. */
const revealOnHover = cn(
  // No fill of its own on hover: the row is already tinted, the glyph darkens.
  "size-8 rounded-md text-on-surface-variant hover:bg-transparent hover:text-on-surface",
  "opacity-0 group-hover/sidebar-card:opacity-100 group-focus-within/sidebar-card:opacity-100",
  "data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100",
  // Open: no tinted box on the trigger — the ROW shows that its menu is open.
  "data-[state=open]:bg-transparent data-[state=open]:text-on-surface",
);

/**
 * The ⋯ trigger of a row with nothing else trailing: out of the flow, over
 * the end of the title, so a hidden control reserves no room and the title
 * runs to the row's edge. It has no fill of its own — the title fades out
 * under it instead (`titleFadesUnderMenu`) — and takes one only while the
 * pointer is on it or its menu is open. Same place as in the flow: 32px wide
 * on the row's 4px end inset. Without hover (touch) the trigger is always
 * visible, so it stays in the flow there and the title ends before it.
 */
const overTitle = cn(
  "absolute top-1/2 right-1 -translate-y-1/2",
  // On a hovered row, which has the hover tone itself: the raised hover.
  "hover:bg-hover-raised data-[state=open]:bg-hover-raised",
  "[@media(hover:none)]:static [@media(hover:none)]:translate-y-0",
);

/**
 * The title of such a row, while its ⋯ trigger shows (row hovered, focus
 * inside it, menu open): it fades to nothing over the stretch the trigger
 * stands on, so the glyph never sits on text. A mask, so it works on any row
 * colour. Only where there is hover — on touch the trigger is in the flow.
 */
// Written out in full three times: Tailwind finds class names by scanning the
// source text, so a name assembled from parts would compile to nothing.
const titleFadesUnderMenu = cn(
  "[@media(hover:hover)]:group-hover/sidebar-card:[mask-image:linear-gradient(to_right,#000_calc(100%_-_3.75rem),transparent_calc(100%_-_2rem))]",
  "[@media(hover:hover)]:group-focus-within/sidebar-card:[mask-image:linear-gradient(to_right,#000_calc(100%_-_3.75rem),transparent_calc(100%_-_2rem))]",
  "[@media(hover:hover)]:group-has-[>button[data-state=open]]/sidebar-card:[mask-image:linear-gradient(to_right,#000_calc(100%_-_3.75rem),transparent_calc(100%_-_2rem))]",
);

/** A click that landed on one of the card's own controls — or on its portaled
 *  menu, whose React events still bubble through the card. */
const isControlClick = (e: React.MouseEvent) =>
  (e.target as HTMLElement).closest(
    'button, a, input, [role="checkbox"], [role="menu"], [role="menuitem"]',
  ) !== null;

/**
 * The row of a side panel — a chat in a history list, a source in a sources
 * list. Icon · title (+ meta) · extra · checkbox · actions menu. A flat row:
 * no border or shadow, a quiet fill on hover, a primary tint while active.
 * The ⋯ menu stays out of sight until the row is hovered, holds keyboard
 * focus or has the menu open — and is always shown where there is no hover
 * (touch).
 *
 * The whole card is the pointer target; the title button is the keyboard
 * path, and clicks on the card's own controls are left to them. Without
 * `onOpen` the card is display-only (see the prop). Forwards ref
 * and props to the `<li>`, so it can be a Radix `asChild` trigger (a hover
 * preview). Render it inside a `<ul>`.
 */
const SidebarCard = React.forwardRef<HTMLLIElement, SidebarCardProps>(
  (
    {
      icon, iconText, title, onOpen, meta, extra, actions, actionsLabel,
      active, selectable, selected = false, onSelectedChange, selectLabel,
      selectionMode, muted, error, busy, selectionTone = "default", titleTestId, className, onClick, ...rest
    },
    ref,
  ) => {
    const toggles = !!selectionMode && !!onSelectedChange;
    const activate = () => (toggles ? onSelectedChange?.(!selected) : onOpen?.());
    // Display-only: nothing happens on a click, so nothing may look clickable.
    const interactive = toggles || !!onOpen;
    // The title is the keyboard path unless the checkbox already is one.
    const titleIsButton = !!onOpen || (toggles && !selectable);
    // The error message describes the row's focusable controls (title, checkbox).
    const errorId = React.useId();
    const status = error ?? busy;
    const describedBy = status ? errorId : undefined;
    const spinning = !error && !!busy;
    const planeClick = (e: React.MouseEvent<HTMLLIElement>) => {
      onClick?.(e);
      if (!interactive || e.defaultPrevented || isControlClick(e)) return;
      activate();
    };

    // The ⋯ alone at the row's end lies over the title (see `overTitle`);
    // beside a checkbox or an `extra` it keeps its place in the trailing column.
    const menuOverTitle = !selectionMode && !!actions?.length && !extra && !selectable;
    const row = (
      // Whole-plane click is a pointer convenience; the title button is the keyboard path.
      <li
        ref={ref}
        data-slot="sidebar-card"
        data-menu={menuOverTitle ? "over-title" : undefined}
        data-static={onOpen ? undefined : ""}
        data-muted={muted ? "" : undefined}
        data-error={error ? "" : undefined}
        aria-busy={spinning || undefined}
        className={cn(
          sidebarCardVariants({
            state: selectionMode && selected
              ? (selectionTone === "destructive" ? "marked" : "active")
              : active ? "active" : error ? "marked" : "idle",
            interactive,
          }),
          menuOverTitle && "relative",
          className,
        )}
        onClick={planeClick}
        {...rest}
      >
        <span aria-hidden="true" className={cn(sidebarIconTileVariants({ kind: iconText && !spinning ? "text" : "icon" }), active && "text-primary", interactive && "group-hover/sidebar-card:text-primary", muted && mutedClass)}>
          {spinning ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : (iconText ?? icon)}
        </span>
        <div className={cn("min-w-0 flex-1", muted && mutedClass)}>
          {titleIsButton ? (
            <button
              type="button"
              data-testid={titleTestId}
              onClick={activate}
              aria-current={active ? "true" : undefined}
              aria-describedby={describedBy}
              className={cn(titleClass, active && activeTextClass, menuOverTitle && titleFadesUnderMenu, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring")}
            >
              {title}
            </button>
          ) : (
            <span
              data-testid={titleTestId}
              aria-current={active ? "true" : undefined}
              className={cn(titleClass, active && activeTextClass, menuOverTitle && titleFadesUnderMenu)}
            >
              {title}
            </span>
          )}
          {status && <span id={errorId} className="sr-only">{status}</span>}
          <div data-slot="sidebar-card-meta">{meta}</div>
        </div>
        {selectable && (
          <span className={trailingBox}>
            <Checkbox
              className="size-4 rounded-[4px]"
              tone={selectionMode ? selectionTone : "default"}
              checked={selected}
              onCheckedChange={(c) => onSelectedChange?.(c === true)}
              aria-label={selectLabel ? `${selectLabel} ${title}` : title}
              aria-describedby={describedBy}
            />
          </span>
        )}
        {!selectionMode && actions && actions.length > 0 && (
          <ActionMenu
            actions={actions}
            label={actionsLabel ? `${actionsLabel} ${title}` : title}
            triggerClassName={cn(revealOnHover, menuOverTitle && overTitle)}
          />
        )}
        {/* Last: a visible extra (retry) holds the trailing column the
            checkbox takes in selection mode, the hover-only ⋯ to its left. */}
        {!selectionMode && extra}
      </li>
    );
    // An error or a running job: the DS Tooltip on the row (the sr-only text
    // above carries it for assistive tech; the tooltip is for the pointer).
    // Always wrapped, closed while there is no status, so a job starting or
    // finishing never remounts the row (focus, an open menu would be lost).
    return (
      <Tooltip open={status ? undefined : false}>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        {status && <TooltipContent side="bottom" align="start">{status}</TooltipContent>}
      </Tooltip>
    );
  },
);
SidebarCard.displayName = "SidebarCard";

export interface SidebarSelectionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** e.g. "3 ausgewählt" */
  countLabel: string;
  /** The list's `iconSlot`, so the ✕ sits on the cards' leading column and the count on their titles. */
  iconSlot?: "icon" | "badge";
  onCancel: () => void;
  cancelLabel?: string;
  /** Batch actions, right-aligned (icon buttons). */
  children?: React.ReactNode;
}

/** The bar a side panel shows while its cards are in selection mode. */
const SidebarSelectionBar = React.forwardRef<HTMLDivElement, SidebarSelectionBarProps>(
  ({ countLabel, onCancel, cancelLabel = "Abbrechen", iconSlot = "icon", children, className, ...props }, ref) => {
    // The cards' geometry (sidebarCardVariants): 10px start inset, the icon
    // slot, a 10px gap, the title; trailing 32px controls on the 4px end
    // inset — so ✕, count and batch buttons line up with tile, title and
    // checkbox of the rows below.
    return (
      <div
        ref={ref}
        role="toolbar"
        data-icon-slot={iconSlot}
        className={cn(
          "flex min-h-9 items-center gap-2.5 rounded-[var(--ui-radius-row)] bg-surface-container-low py-0.5 pr-1 pl-2.5",
          className,
        )}
        {...props}
      >
        <Button
          variant="ghost"
          size="icon"
          data-slot="sidebar-selection-cancel"
          onClick={onCancel}
          aria-label={cancelLabel}
          title={cancelLabel}
          className="-my-1 h-7 w-4 shrink-0 p-0 in-data-[icon-slot=badge]:w-[30px]"
        >
          <span aria-hidden="true" className="text-base leading-none">×</span>
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm text-on-surface-variant" aria-live="polite">{countLabel}</span>
        <span className="flex shrink-0 items-center gap-0.5 [&>button]:size-8 [&>button]:p-0">{children}</span>
      </div>
    );
  },
);
SidebarSelectionBar.displayName = "SidebarSelectionBar";

export interface SidebarCardListProps extends React.HTMLAttributes<HTMLUListElement> {
  /**
   * `badge`: every card's leading slot is as wide as a type badge (30px), so a
   * list that mixes badges ("PDF") and glyphs (a feed icon) keeps its titles
   * on one line. Default `icon`: the slot fits a 16px glyph.
   */
  iconSlot?: "icon" | "badge";
}

/**
 * The `<ul>` for SidebarCards: flat rows, 1px apart.
 *
 * **One Tab stop, arrow keys inside** (`useRovingRows`): `↑`/`↓` move between
 * the rows, `←`/`→` between a row's own controls, `Home`/`End` to the ends,
 * `Tab` leaves the list. Several lists that read as one (a history grouped by
 * day) sit inside an element marked `data-sidebar-card-groups`: the whole is
 * then one Tab stop and `↑`/`↓` run across all of them.
 */
const SidebarCardList = React.forwardRef<HTMLUListElement, SidebarCardListProps>(
  ({ iconSlot = "icon", className, onFocus, onKeyDown, ...props }, ref) => {
    const roving = useRovingRows<HTMLUListElement>();
    React.useImperativeHandle(ref, () => roving.ref.current as HTMLUListElement, [roving.ref]);
    return (
      <ul
        ref={roving.ref}
        data-slot="sidebar-card-list"
        data-icon-slot={iconSlot}
        className={cn("m-0 flex list-none flex-col gap-px p-0", className)}
        onFocus={(e) => {
          onFocus?.(e);
          roving.onFocus(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          roving.onKeyDown(e);
        }}
        {...props}
      />
    );
  },
);
SidebarCardList.displayName = "SidebarCardList";


export { SidebarCard, SidebarCardList, SidebarSelectionBar };
