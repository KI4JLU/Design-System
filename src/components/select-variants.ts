import { cva } from "class-variance-authority";
import { fieldVariants } from "./field-variants";

/**
 * SelectTrigger style variants (cva). The trigger speaks the form-field
 * vocabulary (fieldVariants); `size` picks its height.
 *
 * `default` — the full form-field height, like Input.
 * `sm` — compact: the same height and type as `Button size="sm"`, so a
 * select and a small button sit on one line (e.g. in a dashboard tile).
 *
 * The `sm` classes override fieldVariants' padding, so compose with `cn()`
 * (tailwind-merge), as SelectTrigger does.
 */
export const selectTriggerVariants = cva(
  [
    fieldVariants(),
    // Follows the app-wide Style like a button (one line, like Input).
    "rounded-[var(--ui-radius-control,var(--radius-field))]",
    "flex items-center justify-between gap-2 text-left",
    "data-[placeholder]:text-on-surface-variant [&>span]:line-clamp-1",
  ],
  {
    variants: {
      size: {
        default: "",
        sm: "h-8 px-3 py-0 font-label-sm text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);
