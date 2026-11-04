import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../lib/utils";
import { alertVariants, type AlertLayout, type AlertTone } from "./alert-variants";

/** No default icon for `neutral` — like `Toast`, there is no status to signal. */
const TONE_ICONS: Record<
  AlertTone,
  React.ComponentType<React.SVGProps<SVGSVGElement>> | null
> = {
  neutral: null,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
};

const ICON_SIZE = "[&_svg]:h-5 [&_svg]:w-5";

const LIVE_ROLES = {
  off: undefined,
  polite: "status",
  assertive: "alert",
} as const;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Status the alert reports: fill, text colour and default icon. */
  tone?: AlertTone;
  /**
   * `box` (default): a rounded block in the page. `banner`: a solid,
   * full-width, centred row of app chrome for `AppShell`'s `notice` slot
   * (outage, maintenance). `pill`: a small floating message for `AppShell`'s
   * `status` slot (reduced operation). In `banner` and `pill` the title, the
   * text and an `AlertAction` flow on one line — „**Titel** · Text Aktion" —
   * and wrap on a narrow screen.
   */
  layout?: AlertLayout;
  /**
   * Whether the alert is a live region. `off` (default): a static notice, no
   * role. `polite`: `role="status"`. `assertive`: `role="alert"`.
   */
  live?: "off" | "polite" | "assertive";
  /** Replaces the tone's icon; `null` renders none. */
  icon?: React.ReactNode;
  /** Renders a close button that calls this. */
  onDismiss?: () => void;
  /** Accessible name of the close button. Default: „Schließen" */
  dismissLabel?: string;
}

/**
 * Inline, persistent status message in the page flow — a failed load, a form
 * that did not save, a notice about the service. The transient corner message
 * is `Toast`. Compose it from `AlertTitle` / `AlertDescription` (+ optional
 * `AlertAction`); a one-liner is just an `AlertDescription`.
 *
 * **Icon.** Each status tone brings a lucide icon, so the status is not told
 * by colour alone (WCAG 1.4.1); `icon` replaces it, `icon={null}` drops it.
 * The icon slot is `aria-hidden`: the text must say everything.
 *
 * **One component.** Alert also covers the static hint („Eigentümer und Admin
 * haben immer alle Rechte."), which used to be `Notice` — now a deprecated
 * wrapper over Alert.
 *
 * **Announcing.** `live` defaults to `off`: a notice that is there when the
 * page renders needs no announcement, and `role="alert"` on every message
 * makes screen readers shout on page load. Use `assertive` for a message that
 * appears in response to what the user just did and says it failed (a form
 * that did not save) — `role="alert"` is announced when it is inserted. Use
 * `polite` for a non-urgent change; a `role="status"` region is announced
 * most reliably when it is already mounted before its text changes.
 *
 * **Dismiss.** `onDismiss` adds a close button (`dismissLabel`, default
 * „Schließen"). The alert does not hide itself — the call site unmounts it,
 * and should move focus somewhere sensible, as the focused button goes with it.
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      tone = "neutral",
      layout = "box",
      live = "off",
      icon,
      onDismiss,
      dismissLabel = "Schließen",
      children,
      ...props
    },
    ref,
  ) => {
    const FallbackIcon = TONE_ICONS[tone];
    const iconNode =
      icon !== undefined ? (
        icon
      ) : FallbackIcon ? (
        <FallbackIcon aria-hidden="true" />
      ) : null;

    const hasIcon = iconNode != null && iconNode !== false;

    return (
      <div
        ref={ref}
        role={LIVE_ROLES[live]}
        data-layout={layout}
        data-flow={layout === "box" ? undefined : "inline"}
        className={cn(
          alertVariants({ tone, layout }),
          // Symmetric room for the pinned close button keeps the text centred.
          layout === "banner" && onDismiss && "px-12",
          className,
        )}
        {...props}
      >
        {hasIcon && layout !== "banner" ? (
          <span aria-hidden="true" className={cn("flex h-5 shrink-0 items-center", ICON_SIZE)}>
            {iconNode}
          </span>
        ) : null}
        <div
          className={cn(
            "min-w-0",
            // Inline flow: title, text and action are inline boxes, so a
            // long message wraps like a sentence (and stays centred in a
            // banner) instead of breaking into columns.
            layout === "box" ? "flex flex-1 flex-col gap-1" : "block",
          )}
        >
          {/* In a banner the icon is part of the centred line: wrapped on a
              narrow screen, it stays with the text instead of at the edge. */}
          {hasIcon && layout === "banner" ? (
            <span
              aria-hidden="true"
              className={cn("mr-2 inline-flex h-5 items-center align-text-bottom", ICON_SIZE)}
            >
              {iconNode}
            </span>
          ) : null}
          {children}
        </div>
        {onDismiss ? (
          <button
            type="button"
            aria-label={dismissLabel}
            onClick={onDismiss}
            className={cn(
              "shrink-0 rounded-action p-1 text-current transition-colors hover:bg-current/10",
              layout === "banner"
                ? "absolute top-1/2 right-3 -translate-y-1/2"
                : "-my-0.5 -mr-1",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
            )}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  },
);
Alert.displayName = "Alert";

export interface AlertTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render the single child element instead of a `div` (e.g. an `<h3>`). */
  asChild?: boolean;
}

/**
 * The short headline. A `div` by default — an alert is not a section of the
 * outline; `asChild` gives it a heading level where it is one. `m-0` covers
 * that path (a heading's user-agent margin).
 */
const AlertTitle = React.forwardRef<HTMLDivElement, AlertTitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "m-0 font-semibold wrap-anywhere [[data-flow=inline]_&]:inline",
          className,
        )}
        {...props}
      />
    );
  },
);
AlertTitle.displayName = "AlertTitle";

/**
 * The message, or its detail under a title. May hold several `<p>`s; their
 * user-agent margins are reset and replaced by an 8px gap.
 */
const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "m-0 wrap-anywhere [&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0 [&_p+p]:mt-2",
      // Inline flow (banner, pill): „**Titel** · Text" — the dot only when
      // something (the title) precedes the text.
      "[[data-flow=inline]_&]:inline [[data-flow=inline]_*+&]:before:mx-1.5 [[data-flow=inline]_*+&]:before:content-['·']",
      // …and so do its paragraphs: one sentence after the other, not blocks.
      "[[data-flow=inline]_&_p]:inline [[data-flow=inline]_&_p+p]:mt-0 [[data-flow=inline]_&_p+p]:before:content-['_']",
      className,
    )}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

/**
 * Row of follow-up actions under the message — DS `Button`s, e.g.
 * „Erneut versuchen". Its own row rather than beside the text, so neither the
 * text nor a button is squeezed (COMPONENT_GUIDELINES rule 5); the buttons
 * stay in the normal tab order.
 */
const AlertAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Inline flow (banner, pill): the actions follow the text on its line.
    className={cn(
      "mt-2 flex flex-wrap items-center gap-2",
      "[[data-flow=inline]_&]:mt-0 [[data-flow=inline]_&]:ml-3 [[data-flow=inline]_&]:inline-flex [[data-flow=inline]_&]:align-baseline",
      className,
    )}
    {...props}
  />
));
AlertAction.displayName = "AlertAction";

export { Alert, AlertAction, AlertDescription, AlertTitle };
