import * as React from "react";
import { cn } from "../lib/utils";
import { ActionMenu, type ActionMenuItem } from "./action-menu";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
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
   * What the selection is for. `destructive` = a delete selection: a ticked
   * card and its checkbox take the error colour instead of primary, so the
   * user sees what is about to go. Only matters in `selectionMode`.
   */
  selectionTone?: SidebarSelectionTone;
  titleTestId?: string;
}

const titleClass = "block w-full truncate text-left text-sm text-on-surface";
/** The same strength as a muted SidebarRailItem, so card and rail agree. */
const mutedClass = "opacity-50";

/** The row's ⋯ trigger: 26px, quiet, shown on hover / focus / open, always without hover. */
const revealOnHover = cn(
  "size-[26px] rounded-md text-on-surface-variant hover:text-on-surface",
  "opacity-0 group-hover/sidebar-card:opacity-100 group-focus-within/sidebar-card:opacity-100",
  "data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100",
  // Open: no tinted box on the trigger — the ROW shows that its menu is open.
  "data-[state=open]:bg-transparent data-[state=open]:text-on-surface",
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
      selectionMode, muted, selectionTone = "default", titleTestId, className, onClick, ...rest
    },
    ref,
  ) => {
    const toggles = !!selectionMode && !!onSelectedChange;
    const activate = () => (toggles ? onSelectedChange?.(!selected) : onOpen?.());
    // Display-only: nothing happens on a click, so nothing may look clickable.
    const interactive = toggles || !!onOpen;
    // The title is the keyboard path unless the checkbox already is one.
    const titleIsButton = !!onOpen || (toggles && !selectable);
    const planeClick = (e: React.MouseEvent<HTMLLIElement>) => {
      onClick?.(e);
      if (!interactive || e.defaultPrevented || isControlClick(e)) return;
      activate();
    };

    return (
      // Whole-plane click is a pointer convenience; the title button is the keyboard path.
      <li
        ref={ref}
        data-slot="sidebar-card"
        data-static={onOpen ? undefined : ""}
        data-muted={muted ? "" : undefined}
        className={cn(
          sidebarCardVariants({
            state: selectionMode && selected
              ? (selectionTone === "destructive" ? "marked" : "active")
              : active ? "active" : "idle",
            interactive,
          }),
          className,
        )}
        onClick={planeClick}
        {...rest}
      >
        <span aria-hidden="true" className={cn(sidebarIconTileVariants({ kind: iconText ? "text" : "icon" }), muted && mutedClass)}>
          {iconText ?? icon}
        </span>
        <div className={cn("min-w-0 flex-1", muted && mutedClass)}>
          {titleIsButton ? (
            <button
              type="button"
              data-testid={titleTestId}
              onClick={activate}
              title={title}
              aria-current={active ? "true" : undefined}
              className={cn(titleClass, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring")}
            >
              {title}
            </button>
          ) : (
            <span
              data-testid={titleTestId}
              title={title}
              aria-current={active ? "true" : undefined}
              className={titleClass}
            >
              {title}
            </span>
          )}
          <div data-slot="sidebar-card-meta">{meta}</div>
        </div>
        {!selectionMode && extra}
        {selectable && (
          <Checkbox
            className="size-4 rounded-[4px]"
            tone={selectionMode ? selectionTone : "default"}
            checked={selected}
            onCheckedChange={(c) => onSelectedChange?.(c === true)}
            aria-label={selectLabel ? `${selectLabel} ${title}` : title}
          />
        )}
        {!selectionMode && actions && actions.length > 0 && (
          <ActionMenu
            actions={actions}
            label={actionsLabel ? `${actionsLabel} ${title}` : title}
            triggerClassName={revealOnHover}
          />
        )}
      </li>
    );
  },
);
SidebarCard.displayName = "SidebarCard";

export interface SidebarSelectionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** e.g. "3 ausgewählt" */
  countLabel: string;
  onCancel: () => void;
  cancelLabel?: string;
  /** Batch actions, right-aligned (icon buttons). */
  children?: React.ReactNode;
}

/** The bar a side panel shows while its cards are in selection mode. */
const SidebarSelectionBar = React.forwardRef<HTMLDivElement, SidebarSelectionBarProps>(
  ({ countLabel, onCancel, cancelLabel = "Abbrechen", children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="toolbar"
        className={cn(
          "flex items-center gap-1 rounded-[var(--ui-radius-row)] bg-surface-container-low px-1 py-0.5",
          className,
        )}
        {...props}
      >
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label={cancelLabel} title={cancelLabel}>
          <span aria-hidden="true" className="text-base leading-none">×</span>
        </Button>
        <span className="flex-1 text-sm text-on-surface-variant" aria-live="polite">{countLabel}</span>
        {children}
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

/** The `<ul>` for SidebarCards: flat rows, 1px apart. */
const SidebarCardList = React.forwardRef<HTMLUListElement, SidebarCardListProps>(
  ({ iconSlot = "icon", className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="sidebar-card-list"
      data-icon-slot={iconSlot}
      className={cn("m-0 flex list-none flex-col gap-px p-0", className)}
      {...props}
    />
  ),
);
SidebarCardList.displayName = "SidebarCardList";

export { SidebarCard, SidebarCardList, SidebarSelectionBar };
