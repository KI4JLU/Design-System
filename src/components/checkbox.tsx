import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Accessible checkbox built on Radix (role="checkbox", keyboard toggle,
 * form association, `checked="indeterminate"` support). Token styling
 * analogous to Switch: checked fills with primary, unchecked shows the
 * outline. Pair it with <Label htmlFor> or FormControl for the
 * accessible name.
 */
export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /**
   * A value that is shown but cannot be changed here — fixed by something
   * else (a role, a policy). Not the faded look of `disabled` (which reads as
   * "unavailable right now") but a neutral grey box; the checkbox is not
   * interactive and is announced as disabled. Give it an accessible name that
   * says why it is fixed.
   */
  locked?: boolean;
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, locked = false, disabled, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    disabled={locked || disabled}
    data-locked={locked ? "" : undefined}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded border border-outline bg-surface transition-colors",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-on-primary",
      "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-on-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      "disabled:cursor-not-allowed disabled:opacity-60",
      locked && [
        "border-transparent bg-surface-container-high text-on-surface disabled:cursor-default disabled:opacity-100",
        "data-[state=checked]:border-transparent data-[state=checked]:bg-surface-container-high data-[state=checked]:text-on-surface",
        "data-[state=indeterminate]:border-transparent data-[state=indeterminate]:bg-surface-container-high data-[state=indeterminate]:text-on-surface",
      ],
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      {props.checked === "indeterminate" ? (
        <Minus aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
      ) : (
        <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
