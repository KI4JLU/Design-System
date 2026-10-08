import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Keyboard key hint ("⌘ K", "Esc"). The shadcn `Kbd`
 * (https://ui.shadcn.com/docs/components/base/kbd) on this library's tokens.
 * Decorative and non-interactive (`pointer-events-none`, `select-none`); the
 * control it annotates carries the accessible name, e.g. via
 * `aria-keyshortcuts`. Inside `TooltipContent` it switches to the tooltip's
 * on-primary colors.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded bg-surface-container-high px-1 font-sans text-xs font-medium text-on-surface-variant select-none [&_svg:not([class*='size-'])]:size-3",
        "in-data-[slot=tooltip-content]:bg-on-primary/20 in-data-[slot=tooltip-content]:text-on-primary",
        className,
      )}
      {...props}
    />
  );
}

/** Groups several `Kbd` into one chord ("⌘" "K"). */
function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
