import * as React from "react";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";
import { sidebarRowInsetX } from "./sidebar-card-variants";

export type SidebarActionProps = ButtonProps & {
  /** Leading icon, 18px, on the same axis as the rows' icons below it. */
  icon: React.ReactNode;
};

/**
 * A side panel's primary action row ("Neuer Chat"): a flat, full-width 38px
 * row — not a filled button — whose label is left-aligned and whose icon sits
 * on the same vertical axis as the SidebarCards' icons below it (same 10px
 * inset, sidebarRowInsetX). Quiet fill on hover, row radius. `variant`
 * defaults to `ghost`; pass another to override.
 */
const SidebarAction = React.forwardRef<HTMLButtonElement, SidebarActionProps>(
  ({ icon, variant = "ghost", className, children, ...props }, ref) => (
    <Button
      ref={ref}
      data-slot="sidebar-action"
      variant={variant}
      className={cn(
        "h-[38px] w-full justify-start py-0 text-left font-body-base text-sm font-normal",
        "rounded-[var(--ui-radius-row)] active:scale-100",
        // The row colours belong to the ghost row only; another variant keeps its own.
        variant === "ghost" && "text-on-surface hover:bg-surface-container-low",
        sidebarRowInsetX,
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="flex size-[18px] shrink-0 items-center justify-center [&>svg]:size-[18px]">
        {icon}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </Button>
  ),
);
SidebarAction.displayName = "SidebarAction";

export { SidebarAction };
