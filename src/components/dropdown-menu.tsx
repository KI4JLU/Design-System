import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { menuItemVariants } from "./menu-item-variants";

/**
 * Accessible action menu built on Radix. Replaces the hand-rolled menu
 * containers (fixed-inset click-away, outside-click useEffect): Radix
 * provides Escape-to-close, arrow-key navigation, typeahead, focus return,
 * and the menu/menuitem ARIA wiring. Items speak the MenuItem vocabulary
 * (menuItemVariants) — `variant="destructive"` for dangerous actions,
 * `asChild` for links. A Button trigger shows its open state automatically
 * via `data-state="open"` (see button-variants).
 *
 * The one look: a white card on the box radius (16px) with a 6px inset;
 * 36px rows on the row radius with 18px icons and a quiet hover fill;
 * destructive rows tint red on hover. `DropdownMenuSub` + `SubTrigger` +
 * `SubContent` nest a menu (the trigger draws its own trailing chevron;
 * ArrowRight / ArrowLeft open and close it).
 */

const contentClass =
  "z-50 min-w-40 overflow-hidden rounded-[var(--ui-radius-box)] border border-outline-variant bg-surface-container-lowest p-1.5 text-on-surface shadow-overlay";

const itemClass = [
  "cursor-default rounded-[var(--ui-radius-row)] no-underline select-none [&_svg]:size-[18px]",
  // The highlight fill is the focus indicator, so no ring on top of it.
  "data-[highlighted]:bg-surface-container-low data-[highlighted]:outline-none focus-visible:ring-0",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-60",
];
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(contentClass, className)}
      {...props}
    />
  </DropdownMenuPortal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>,
    Pick<VariantProps<typeof menuItemVariants>, "variant" | "selected"> {}

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, variant, selected, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      menuItemVariants({ variant, selected }),
      itemClass,
      variant === "destructive" && "data-[highlighted]:bg-error/10",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-3 py-2 text-xs font-semibold text-on-surface-variant", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("mx-2.5 my-1.5 h-px bg-outline-variant", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/** A row that opens a nested menu; renders its own trailing chevron. */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      menuItemVariants(),
      itemClass,
      "data-[state=open]:bg-surface-container-low",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight aria-hidden="true" className="ml-auto !size-4 text-on-surface-variant" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      sideOffset={sideOffset}
      className={cn(contentClass, className)}
      {...props}
    />
  </DropdownMenuPortal>
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
