import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Standalone hairline in the divider token (`outline-variant`), for rules
 * outside a Radix menu: between list rows, card parts, toolbar groups.
 * `DropdownMenuSeparator` / `SelectSeparator` / `CommandSeparator` stay bound
 * to their own primitives; this one needs no Radix (it has no behaviour).
 *
 * `orientation="vertical"` is a 1px column that stretches to the height of the
 * flex row it sits in (`self-stretch`); give it a height via `className` when
 * the row should not set it.
 *
 * `decorative` (default `true`) keeps the line out of the accessibility tree
 * (`role="none"`), which is right for a visual rhythm between groups that are
 * already announced as groups. Set it to `false` when the line really
 * separates content: it then becomes `role="separator"` with
 * `aria-orientation`.
 */
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Direction of the line. Default `horizontal`. */
  orientation?: "horizontal" | "vertical";
  /** Purely visual (no role) or a semantic `separator`. Default `true`. */
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref,
  ) => {
    const semantic = decorative
      ? { role: "none" as const }
      : {
          role: "separator" as const,
          "aria-orientation": orientation,
        };
    return (
      <div
        ref={ref}
        data-orientation={orientation}
        {...semantic}
        className={cn(
          "shrink-0 bg-outline-variant",
          orientation === "vertical" ? "w-px self-stretch" : "h-px w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
Separator.displayName = "Separator";

export { Separator };
