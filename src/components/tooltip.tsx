import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { TITLEBAR_HEIGHT, useTitlebar } from "../lib/use-titlebar";
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

/** `data-slot` lets `TitleTooltips` skip titles inside an explicit trigger. */
const TooltipTrigger = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>((props, ref) => <TooltipPrimitive.Trigger ref={ref} data-slot="tooltip-trigger" {...props} />);
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /**
   * Where the tooltip is portalled. Default: `document.body`. Pass the
   * fullscreen element while one is active — the browser paints only the
   * fullscreen subtree, so a tooltip portalled to the body is invisible.
   */
  container?: HTMLElement | null;
}

type CollisionPadding = TooltipContentProps["collisionPadding"];

/** The call site's padding with its top raised to at least `top`. */
function withTop(padding: CollisionPadding, top: number): CollisionPadding {
  if (typeof padding === "number") {
    return { top: Math.max(padding, top), right: padding, bottom: padding, left: padding };
  }
  return { ...padding, top: Math.max(padding?.top ?? 0, top) };
}

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 6, container, collisionPadding, ...props }, ref) => {
  /*
    Under a hidden title bar (`<html data-titlebar>`, Storybook „Native
    shell") the window's top row holds the window controls and drags the
    window: a hint that lands there covers the controls and cannot be told
    from chrome. So that row counts as outside the viewport for every tooltip
    — Radix flips or shifts the hint out of it — whatever side the call site
    asked for. Enforced here, in the one component every tooltip renders
    through (`TitleTooltips` included), so no call site has to remember it.
  */
  const titlebar = useTitlebar() !== null;
  const padding = titlebar ? withTop(collisionPadding, TITLEBAR_HEIGHT) : collisionPadding;
  return (
  <TooltipPrimitive.Portal container={container ?? undefined}>
    <TooltipPrimitive.Content
      ref={ref}
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      collisionPadding={padding}
      className={cn(
        "z-50 max-w-72 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-balance text-on-primary shadow-overlay",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
