import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../lib/utils";
import { alertVariants, type AlertTone } from "./alert-variants";

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

const LIVE_ROLES = {
  off: undefined,
  polite: "status",
  assertive: "alert",
} as const;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Status the alert reports: fill, text colour and default icon. */
  tone?: AlertTone;
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
 * **Icon.** Each status tone brings a lucide icon (`aria-hidden`), so the
 * status is not told by colour alone (WCAG 1.4.1); `icon` replaces it.
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

    return (
      <div
        ref={ref}
        role={LIVE_ROLES[live]}
        className={cn(alertVariants({ tone }), className)}
        {...props}
      >
        {iconNode != null && iconNode !== false ? (
          <span className="flex h-5 shrink-0 items-center [&_svg]:h-5 [&_svg]:w-5">
            {iconNode}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
        {onDismiss ? (
          <button
            type="button"
            aria-label={dismissLabel}
            onClick={onDismiss}
            className={cn(
              "-my-0.5 -mr-1 shrink-0 rounded-action p-1 text-current transition-colors hover:bg-current/10",
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
        className={cn("m-0 font-semibold wrap-anywhere", className)}
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
    className={cn("mt-2 flex flex-wrap items-center gap-2", className)}
    {...props}
  />
));
AlertAction.displayName = "AlertAction";

export { Alert, AlertAction, AlertDescription, AlertTitle };
