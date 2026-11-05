import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../lib/utils";
import { cardAccentStyle } from "./card-variants";
import { selectableCardClassName } from "./selectable-card-variants";

/**
 * A card the user picks. The whole card is one button; selected, it takes a
 * primary border, a 1px primary ring and a primary tint (see
 * `selectableCardClassName`). The `Card` parts work inside it — a hairline
 * card's `CardBand` and `CardHairline` take its `accentColor` as in a `Card` —
 * but keep their content phrasing (text, spans, icons): it sits inside a
 * `<button>`, so no links, buttons or fields in it.
 *
 * Two semantics, picked by where the card sits:
 *
 * - Inside a `SelectableCardGroup` the cards form ONE choice: each card is a
 *   radio (`value`), the group is one tab stop and the arrow keys move the
 *   choice (Radix RadioGroup). Name the group with `aria-label` or
 *   `aria-labelledby`.
 * - On its own the card is a toggle (`selected` + `onSelectedChange`,
 *   announced via `aria-pressed`).
 *
 * `action` is a slot for the card's own controls — an `ActionMenu`, a
 * split button — placed in the top-right corner as a SIBLING of the pick
 * target, never inside it: clicking it does not pick the card, and it is its
 * own tab stop after the card. Leave the card's content room for it.
 * `footerAction` is the same for a control centred at the card's foot (e.g.
 * a primary „Use" shown on hover); it lies over the card too, so leave room
 * at the foot or show it in place of what is there.
 *
 * `selectedLook`: "fill" (default) — the tinted pick; "outline" — a dotted
 * border only, for a pick that previews rather than chooses.
 */
export type SelectableCardGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

const SelectableCardGroupContext = React.createContext(false);

const SelectableCardGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  SelectableCardGroupProps
>(({ className, ...props }, ref) => (
  <SelectableCardGroupContext.Provider value={true}>
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="selectable-card-group"
      className={cn("grid gap-4", className)}
      {...props}
    />
  </SelectableCardGroupContext.Provider>
));
SelectableCardGroup.displayName = "SelectableCardGroup";

interface SelectableCardBaseProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "value" | "onChange"> {
  /** The card's colour for a hairline card's band and rule, as on `Card`. */
  accentColor?: string;
  /** The card's own controls (e.g. an `ActionMenu`), top-right, outside the pick target. */
  action?: React.ReactNode;
  /**
   * A control centred at the card's foot, outside the pick target. It lies over
   * the card, like `action`: leave the card's content room for it at the foot.
   */
  footerAction?: React.ReactNode;
  /** How the selected card shows: tinted with a ring ("fill", default) or a dotted border only ("outline"). */
  selectedLook?: "fill" | "outline";
  /**
   * Classes for the wrapper that holds the card and its controls (only
   * rendered with `action` or `footerAction`). The controls sit in the
   * wrapper's corner and foot, so size such a card here, not on the card.
   */
  wrapperClassName?: string;
}

export interface SelectableCardProps extends SelectableCardBaseProps {
  /** In a `SelectableCardGroup`: the value this card stands for. */
  value?: string;
  /** Standalone: whether the card is picked. */
  selected?: boolean;
  /** Standalone: called with the new state when the card is clicked. */
  onSelectedChange?: (selected: boolean) => void;
}

const SelectableCard = React.forwardRef<HTMLButtonElement, SelectableCardProps>(
  (
    {
      className,
      wrapperClassName,
      accentColor,
      style,
      action,
      footerAction,
      selectedLook = "fill",
      value,
      selected,
      onSelectedChange,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    const inGroup = React.useContext(SelectableCardGroupContext);
    const classes = cn(selectableCardClassName, className);
    const card = inGroup ? (
      <RadioGroupPrimitive.Item
        ref={ref}
        value={value ?? ""}
        data-slot="selectable-card"
        data-look={selectedLook}
        style={cardAccentStyle(accentColor, style)}
        className={classes}
        onClick={onClick}
        {...props}
      >
        {children}
      </RadioGroupPrimitive.Item>
    ) : (
      <button
        ref={ref}
        type="button"
        aria-pressed={!!selected}
        data-slot="selectable-card"
        data-look={selectedLook}
        style={cardAccentStyle(accentColor, style)}
        className={classes}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onSelectedChange?.(!selected);
        }}
        {...props}
      >
        {children}
      </button>
    );
    if (!action && !footerAction) return card;
    return (
      <div data-slot="selectable-card-wrapper" className={cn("relative flex", wrapperClassName)}>
        {card}
        {action && (
          <div data-slot="selectable-card-action" className="absolute top-2 right-2 flex items-center">
            {action}
          </div>
        )}
        {footerAction && (
          <div data-slot="selectable-card-footer-action" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="pointer-events-auto">{footerAction}</div>
          </div>
        )}
      </div>
    );
  },
);
SelectableCard.displayName = "SelectableCard";

export { SelectableCard, SelectableCardGroup };
