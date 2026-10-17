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
}

const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(({ options, value, onValueChange, className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    className={cn(
      // Radius follows the app-wide Style (rounded / pill); the lowest surface
      // (white in light mode) keeps it legible on a tinted page.
      "inline-flex overflow-hidden rounded-[var(--ui-radius-control)] border border-outline-variant bg-surface-container-lowest",
      className,
    )}
    {...props}
  >
    {options.map((option) => {
      const active = option.value === value;
      const iconOnly = !!option.icon && !option.showLabel;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "font-label-sm text-label-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
            // An icon segment is SQUARE (h-9 w-9), a text one is a padded
            // pill-less box. Reusing the text padding for an icon would give a
            // wide, off-centre button — the icon has no width of its own to
            // balance the 16px sides.
            // An icon + label segment keeps the text padding and centres the
            // pair; h-9 matches the height a text segment gets from py-2.
            iconOnly
              ? "flex h-9 w-9 items-center justify-center"
              : option.icon
                ? "inline-flex h-9 items-center justify-center gap-1.5 px-4"
                : "px-4 py-2",
            active
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-high",
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
