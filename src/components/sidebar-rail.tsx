import * as React from "react";
import { cn } from "../lib/utils";
import { useUiShape, type UiShape } from "./ui-shape-context";

/**
 * The collapsed 60px rail of a side panel: a column of icon entries (one per
 * chat, per source). Use it as the panel's `collapsedPreview`.
 */
const SidebarRail = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="sidebar-rail"
      className={cn("m-0 flex w-full list-none flex-col items-center gap-1 p-0", className)}
      {...props}
    />
  ),
);
SidebarRail.displayName = "SidebarRail";

export interface SidebarRailItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The open entry: primary fill. */
  active?: boolean;
  /** An entry that is switched off (e.g. a source excluded from answers). */
  muted?: boolean;
  /** `action` = the rail's leading filled button (new chat, add source). */
  variant?: "item" | "action";
  /** A short type label instead of an icon child ("PDF"). */
  iconText?: string;
  /** Default: the app-wide Style (`useUiShape`). */
  shape?: UiShape;
  /**
   * `false` renders a display-only entry (e.g. a source the user may see but
   * not open): a `<span>` instead of a button — no button role, not
   * focusable, no hover or focus fill. An `aria-label` then names it as an
   * image (`role="img"`). Tooltip/HoverCard `asChild` wrappers still work
   * (on hover; the ref then receives the `<span>`). Default `true`.
   *
   * An explicit flag rather than "no `onClick`": a Tooltip trigger injects
   * its own `onClick` through `asChild`, so the handler's presence cannot
   * tell an openable entry from a display-only one.
   */
  interactive?: boolean;
}

/** Button-only attributes that mean nothing on the display-only `<span>`. */
const BUTTON_ONLY = [
  "type", "disabled", "form", "formAction", "formEncType", "formMethod", "formNoValidate",
  "formTarget", "name", "value", "aria-pressed", "aria-expanded",
] as const;

/**
 * One rail entry: a 36px icon button on the tinted tile, primary on hover,
 * focus and while active. Name it with `aria-label`; wrap it in a Tooltip or
 * a HoverCard for the full title — it forwards ref and props for `asChild`.
 * `interactive={false}` makes it a display-only tile (see the prop).
 */
const SidebarRailItem = React.forwardRef<HTMLButtonElement, SidebarRailItemProps>(
  ({ active, muted, variant = "item", iconText, shape: shapeProp, interactive = true, className, children, ...props }, ref) => {
    const uiShape = useUiShape().shape;
    const shape = shapeProp ?? uiShape;
    const content = iconText ? (
      <span aria-hidden="true" className="text-[9px] font-bold tracking-wide">{iconText}</span>
    ) : (
      children
    );

    if (!interactive) {
      const spanProps: Record<string, unknown> = { ...props };
      for (const key of BUTTON_ONLY) delete spanProps[key];
      const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
      return (
        <span
          ref={ref as unknown as React.Ref<HTMLSpanElement>}
          role={named ? "img" : undefined}
          data-slot="sidebar-rail-item"
          data-static=""
          aria-current={active ? "true" : undefined}
          {...(spanProps as React.HTMLAttributes<HTMLSpanElement>)}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center text-[15px] leading-none [&>svg]:size-[18px]",
            variant === "action"
              ? cn("bg-primary text-on-primary [&>svg]:size-4", shape === "pill" ? "rounded-full" : "rounded-action")
              : cn(
                  shape === "pill" ? "rounded-full" : "rounded-lg",
                  active ? "bg-primary text-on-primary" : "bg-secondary-container text-primary",
                ),
            muted && "opacity-50",
            className,
          )}
        >
          {content}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        data-slot="sidebar-rail-item"
        aria-current={active ? "true" : undefined}
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center text-[15px] leading-none transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
          "[&>svg]:size-[18px]",
          variant === "action"
            ? cn("bg-primary text-on-primary hover:brightness-110 [&>svg]:size-4", shape === "pill" ? "rounded-full" : "rounded-action")
            : cn(
                shape === "pill" ? "rounded-full" : "rounded-lg",
                active
                  ? "bg-primary text-on-primary"
                  : "bg-secondary-container text-primary hover:bg-primary hover:text-on-primary focus-visible:bg-primary focus-visible:text-on-primary",
              ),
          muted && "opacity-50",
          className,
        )}
        {...props}
      >
        {content}
      </button>
    );
  },
);
SidebarRailItem.displayName = "SidebarRailItem";

export { SidebarRail, SidebarRailItem };
