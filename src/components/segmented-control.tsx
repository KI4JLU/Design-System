import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Single-select segment row (e.g. the Tag/Woche/Monat chart-range switch, or an
 * icon-only card/list view toggle). Controlled: `value` + `onValueChange`. The
 * active segment is announced via `aria-pressed`; pass an `aria-label`
 * describing the choice on the container.
 *
 * Give an option an `icon` to make that segment icon-only: the icon is shown,
 * `label` goes `sr-only` and stays the accessible name. Add `showLabel` to
 * keep the label visible next to the icon. `label` is required either way, so
 * an unnamed segment is not expressible.
 * `variant="nav"` drops the track and styles the segments like `NavItem`
 * rows: the chosen one a primary tint with primary text, the others turning
 * primary on hover. For a mode choice that reads as navigation between
 * panels (e.g. a settings block's „Eingabefeld / Datei-Upload / Rolle").
 * `variant="tile"` makes each segment an equal-width framed tile with its
 * icon above its label — for a choice of a few kinds that wants the room
 * (e.g. how a chat starts: „Eingabefeld / Anweisung / Datei"). The chosen
 * tile takes a primary border and tint. Give every option an `icon`; the
 * label always shows.
 *
 * Renders raw <button> elements — this repo defines the primitives, so the
 * raw-elements rule does not apply here.
 */
export interface SegmentedControlOption {
  value: string;
  /**
   * The segment's ACCESSIBLE NAME, always. With `icon` it is also the visible
   * text; without it, it is rendered `sr-only` and the icon is what is seen.
   *
   * It stays a required string for exactly that reason: an icon-only segment
   * still has to be named, and making the name optional is how icon buttons
   * usually end up announced as „button, button, button".
   */
  label: string;
  /**
   * Shown INSTEAD of the visible label — a grid/list pair, say. The label goes
   * `sr-only`, so the control is icon-only to the eye and fully named to a
   * screen reader. With `showLabel`, shown BEFORE the visible label instead.
   */
  icon?: React.ReactNode;
  /**
   * Keep the label visible next to the `icon` (icon + text segment) instead of
   * making the segment icon-only. The accessible name is the label either
   * way; the icon should be `aria-hidden`. No effect without `icon`.
   */
  showLabel?: boolean;
}

export interface SegmentedControlProps
  extends React.HTMLAttributes<HTMLDivElement> {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** `default`: raised chip on a quiet track. `nav`: NavItem-style rows, no track. `tile`: framed tiles, icon over label. */
  variant?: "default" | "nav" | "tile";
}

const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(({ options, value, onValueChange, variant = "default", className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    data-variant={variant}
    className={cn(
      variant === "tile"
        ? // Equal columns, however long a label is.
          "grid auto-cols-fr grid-flow-col gap-2"
        : variant === "nav"
        ? "inline-flex flex-wrap gap-1"
        : // A quiet track; the chosen segment is a raised chip on it.
          "inline-flex gap-0.5 rounded-[var(--ui-radius-control)] bg-surface-container-low p-0.5",
      className,
    )}
    {...props}
  >
    {options.map((option) => {
      const active = option.value === value;
      const iconOnly = variant !== "tile" && !!option.icon && !option.showLabel;
      if (variant === "tile") {
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[var(--ui-radius-control)] border px-3 py-3 text-sm font-medium transition-colors [&_svg]:size-5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/50 hover:bg-primary/5 [&_svg]:text-on-surface-variant",
            )}
          >
            {option.icon ?? null}
            {/* Wraps rather than truncating: a control's label is never cut off. */}
            <span className="max-w-full text-center [overflow-wrap:anywhere]">{option.label}</span>
          </button>
        );
      }
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
            variant === "nav"
              ? "rounded-[var(--ui-radius-row)]"
              : "rounded-[calc(var(--ui-radius-control)-2px)]",
            // An icon segment is SQUARE (size-8), a text one is a padded box.
            // Reusing the text padding for an icon would give a wide,
            // off-centre button — the icon has no width of its own to balance
            // the 12px sides. An icon + label segment keeps the text padding
            // and centres the pair; all three are 32px tall.
            iconOnly
              ? "flex size-8 items-center justify-center [&_svg]:size-[18px]"
              : option.icon
                ? "inline-flex h-8 items-center justify-center gap-1.5 px-3"
                : "h-8 px-3",
            variant === "nav"
              ? active
                ? "bg-primary/10 font-medium text-primary"
                : "text-on-surface hover:bg-primary/5 hover:text-primary [&_svg]:text-on-surface-variant hover:[&_svg]:text-primary"
              : active
                ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant"
                : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {option.icon ?? null}
          {/* Never dropped, only hidden: the accessible name is computed from
              the contents, so removing the text would leave the button unnamed.
              Same rule `SidebarUserMenu` follows when it collapses. */}
          <span className={iconOnly ? "sr-only" : undefined}>{option.label}</span>
        </button>
      );
    })}
  </div>
));
SegmentedControl.displayName = "SegmentedControl";

export { SegmentedControl };
