import { cva } from "class-variance-authority";

/**
 * MenuItem style variants (cva). One standard row for dropdown menus,
 * comboboxes, and popover menus: left-aligned, full-width, quiet hover.
 * `selected` marks the chosen option (color + weight, caller adds the Check
 * icon), `highlighted` mirrors keyboard focus in listbox/combobox patterns
 * (same surface as hover). `destructive` for dangerous actions (Abmelden,
 * Löschen).
 */
export const menuItemVariants = cva(
  "flex min-h-9 w-full items-center gap-2.5 px-2.5 py-1.5 text-left font-body-base text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-on-surface hover:bg-surface-container-low",
        destructive: "text-error hover:bg-error/10",
      },
      selected: {
        true: "text-primary font-medium",
        false: "",
      },
      highlighted: {
        true: "bg-surface-container-low",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      selected: false,
      highlighted: false,
    },
  },
);
