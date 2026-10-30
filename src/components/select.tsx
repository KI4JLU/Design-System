import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { fieldVariants } from "./field-variants";
import { menuItemVariants } from "./menu-item-variants";

/**
 * Accessible single-select built on Radix — replaces the hand-built
 * dropdown internals (custom listboxes without Escape/arrow keys/typeahead).
 * The trigger speaks the form-field vocabulary (fieldVariants, incl.
 * `aria-invalid` error look via FormControl), items speak the MenuItem
 * vocabulary. For a *filterable* list (a text field with suggestions) use
 * `Combobox` instead.
 */
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  /**
   * `field` (default): the framed form field. `ghost`: no frame — the value
   * and a chevron, a quiet fill on hover — for a settings row, where the row
   * already says what the control is and a framed box would be noise.
   * `editable`: edit in place, as `Input`/`Textarea` `variant="editable"` —
   * the value keeps the look of the text around it (font, size, colour are
   * inherited), a dashed `currentColor` outline marks it as editable, and the
   * chevron scales with the text. For a pick inside a heading block or on a
   * gradient (e.g. a category under a title).
   */
  variant?: "field" | "ghost" | "editable";
}

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, variant = "field", ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-variant={variant}
    className={cn(
      variant === "field"
        ? fieldVariants()
        : variant === "editable"
          ? [
              // The text outline of fieldVariants' `editable`, on a button.
              "w-auto p-0 text-inherit transition-[outline-color]",
              "outline-1 outline-offset-4 outline-dashed outline-current/30 hover:outline-current/60",
              "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-current data-[state=open]:outline-solid data-[state=open]:outline-current",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:outline-transparent",
            ]
          : [
              "h-9 w-auto px-2.5 text-sm text-on-surface outline-none transition-colors",
              "hover:bg-surface-container-low data-[state=open]:bg-surface-container-low",
              "focus-visible:ring-2 focus-visible:ring-focus-ring",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ],
      "rounded-[var(--ui-radius-control)]",
      variant === "editable"
        ? "inline-flex items-center gap-1 text-left data-[placeholder]:opacity-60 [&>span]:line-clamp-1"
        : "flex items-center justify-between gap-2 text-left data-[placeholder]:text-on-surface-variant [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        aria-hidden
        className={
          variant === "editable" ? "size-[1em] shrink-0" : "h-4 w-4 shrink-0 text-on-surface-variant"
        }
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "z-50 max-h-96 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--ui-radius-box)] border border-outline-variant bg-surface-container-lowest text-on-surface shadow-overlay",
        position === "popper" && "translate-y-1",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-3 py-2 text-xs font-semibold text-on-surface-variant", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      menuItemVariants(),
      "cursor-default justify-between rounded-[var(--ui-radius-row)] select-none",
      // The highlight fill is the focus indicator (as in DropdownMenu), so no ring.
      "data-[highlighted]:bg-surface-container-low data-[highlighted]:outline-none focus-visible:ring-0",
      "data-[state=checked]:font-medium data-[state=checked]:text-primary",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-60",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator asChild>
      <Check aria-hidden className="h-4 w-4 shrink-0" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("mx-2.5 my-1.5 h-px bg-outline-variant", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
