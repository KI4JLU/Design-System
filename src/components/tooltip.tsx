import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../lib/utils";

/**
 * Accessible tooltip built on Radix — replaces `title=` attributes and
 * hand-rolled hover hints. APG tooltip pattern for free: the content carries
 * `role="tooltip"`, the trigger is described by it (`aria-describedby`), it
 * opens on hover AND keyboard focus, Escape dismisses, and the tooltip itself
 * never takes focus. A tooltip is a *hint* for a control that already has an
 * accessible name (e.g. an icon button's `aria-label`) — never the only place
 * where essential content or an action lives, because it cannot be reached on
 * touch. For rich, interactive floating content use Popover instead.
 *
 * shadcn's shape: every `Tooltip` mounts its own `TooltipProvider`, so no
 * app-level setup is required. Deviating delays are set per instance
 * (`delayDuration` on `Tooltip`); an app-level `TooltipProvider` is therefore
 * not consulted for these defaults.
 */
const TooltipProvider = ({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
);

const Tooltip = (props: React.ComponentProps<typeof TooltipPrimitive.Root>) => (
  <TooltipProvider>
    <TooltipPrimitive.Root {...props} />
  </TooltipProvider>
);

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-72 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-balance text-on-primary shadow-overlay",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
