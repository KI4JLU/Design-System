import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button-variants";
import {
  TOAST_DURATIONS,
  toastIconVariants,
  toastVariants,
  type ToastVariant,
} from "./toast-variants";

/**
 * Transient status message in a fixed corner of the screen, built on Radix
 * Toast. Replaces hand-rolled notification stacks (JustRAG's
 * `ToastContainer.tsx` + `Toast.css`), whose timer was a bare `setTimeout`
 * that no user could pause.
 *
 * **Three parts have to be on screen for anything to appear** — a
 * `ToastProvider` around the app, exactly one `ToastViewport` (the fixed mount
 * point), and one `Toast` per message. Verified in the installed Radix source
 * (`@radix-ui/react-toast@1.2.23`, `ToastImpl` returns `null` while
 * `context.viewport` is unset): a `Toast` **without** a mounted viewport
 * renders nothing at all and logs nothing — the single most likely way to wire
 * this up wrong.
 *
 * **This primitive owns the rendering, not the queue.** Which toasts exist,
 * how many are kept, and in what order is application state (JustRAG caps its
 * list at 5 in a reducer) and stays in the app, exactly as with every other
 * component here. The app maps its list to `Toast` children; Radix owns each
 * toast's timer.
 */

/** No default icon for `neutral` — there is no status to signal. */
const VARIANT_ICONS: Record<
  ToastVariant,
  React.ComponentType<React.SVGProps<SVGSVGElement>> | null
> = {
  neutral: null,
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
};

/**
 * App-level provider. Mount once, around everything that may raise a toast.
 *
 * `label` is **not** the viewport's accessible name — Radix prefixes it to the
 * screen-reader announcement of every toast ("Benachrichtigung: Datei
 * gespeichert"), so it is a singular noun. The viewport's own name is
 * `ToastViewport`'s `label`.
 */
const ToastProvider = ({
  label = "Benachrichtigung",
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Provider>) => (
  <ToastPrimitive.Provider label={label} {...props} />
);
ToastProvider.displayName = "ToastProvider";

/**
 * The fixed mount point. Render **once**, next to the app root — a second
 * viewport gives every toast a second home and the stack splits.
 *
 * Bottom-right on ≥ sm, full-width bottom on narrow screens, matching the
 * consumer it replaces. `flex-col-reverse` puts the **newest toast on top** of
 * the stack, which also agrees with Radix's own Tab order (verified in the
 * installed source: `getSortedTabbableCandidates` reverses the collection, so
 * Tab visits the newest toast first) — visual order and focus order match.
 *
 * `z-100` sits deliberately above the `z-50` of `Dialog` and `BottomTabBar`: a
 * toast raised from inside a modal must not disappear behind it. Radix keeps
 * the two layers from fighting (the viewport is a `DismissableLayer.Branch`,
 * so clicking a toast does not dismiss the dialog).
 *
 * Above a `BottomTabBar` (60 px, `h-15`), lift it with the layout-only
 * `className="bottom-15 sm:bottom-0"`.
 */
const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, label = "Benachrichtigungen ({hotkey})", ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    label={label}
    className={cn(
      // pointer-events-none: the viewport spans the screen width, only the
      // toasts themselves may swallow clicks (they re-enable it).
      // m-0: Radix renders the viewport as an <ol>, whose user-agent margin
      // (1em, measured in Chromium) would offset a `bottom-0` fixed box by
      // 16px in any app that reverts element margins in `@layer base`.
      "pointer-events-none fixed inset-x-0 bottom-0 z-100 m-0 flex max-h-screen flex-col-reverse gap-stack-sm p-3",
      "sm:inset-x-auto sm:right-0 sm:max-w-sm sm:p-gutter",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  /** Status the toast reports. Drives the accent edge, the icon and — unless
   * `type` is set explicitly — how urgently it is announced. */
  variant?: ToastVariant;
  /** Override the variant's status icon, or pass `false` for none. */
  icon?: React.ReactNode | false;
}

/**
 * One message. Compose it from `ToastTitle` / `ToastDescription` (+ optional
 * `ToastAction`, `ToastClose`); a one-liner is just a `ToastTitle`.
 *
 * **How it is announced.** Radix does not put a live region on the visible
 * toast: it renders a separate visually-hidden announcer (`role="status"`)
 * whose `aria-live` follows the `type` prop — `foreground` → `assertive`,
 * `background` → `polite` (verified in the installed source). We map `error`
 * to `foreground` and every other variant to `background`. An error toast says
 * that what the user just asked for did **not** happen; a polite queue may
 * hold that back until the screen reader finishes whatever it is reading, by
 * which time the toast is gone. Everything else merely confirms — not worth
 * interrupting. `type` overrides the mapping per toast.
 *
 * We therefore never write `role="alert"` by hand, and do not need to:
 * `role="alert"` is defined as `aria-live="assertive"` + `aria-atomic="true"`,
 * and that is exactly what the announcer computes to on the error path
 * (`role="status"` contributes the implicit `aria-atomic="true"`, the explicit
 * `aria-live` overrides its implicit `polite`).
 *
 * **Duration.** `duration` on this component wins; otherwise the variant's
 * default from `TOAST_DURATIONS` applies. Because we always resolve to a
 * number, `ToastProvider`'s own `duration` prop is **not** consulted for this
 * component — set timing per toast or edit `TOAST_DURATIONS`. `Infinity`
 * disables auto-dismiss; `0` does **not** (Radix resolves it with `||`, so a
 * falsy duration falls back to the provider's 5000).
 */
const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  ToastProps
>(
  (
    { className, variant = "neutral", icon, type, duration, children, ...props },
    ref,
  ) => {
    const FallbackIcon = VARIANT_ICONS[variant];
    const iconNode =
      icon === false ? null : icon !== undefined ? (
        icon
      ) : FallbackIcon ? (
        <FallbackIcon aria-hidden className={toastIconVariants({ variant })} />
      ) : null;

    return (
      <ToastPrimitive.Root
        ref={ref}
        type={type ?? (variant === "error" ? "foreground" : "background")}
        duration={duration ?? TOAST_DURATIONS[variant]}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        {iconNode}
        {children}
      </ToastPrimitive.Root>
    );
  },
);
Toast.displayName = "Toast";

/**
 * The message line. On a toast with no description this is the whole message,
 * which is why it is `font-medium` rather than bold.
 */
const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn(
      "col-start-2 min-w-0 font-medium wrap-anywhere",
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

/** Secondary line under the title — the detail, never the whole message. */
const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn(
      "col-start-2 min-w-0 wrap-anywhere",
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

/**
 * Optional follow-up action ("Rückgängig", "Erneut versuchen"). Sits on its
 * own row under the message rather than inline: the toast is at most `sm`
 * wide, and a button next to the text would shrink one of them to fit
 * (COMPONENT_GUIDELINES rule 5).
 *
 * `altText` is required by Radix and is what a screen reader hears in place of
 * the button — describe the *alternative* way to reach the action, e.g.
 * „Rückgängig über Bearbeiten > Rückgängig". Radix drops an `<Action>` with a
 * blank `altText` from the tree entirely.
 *
 * Clicking it also closes the toast. Give a toast with an action a long
 * `duration` (or `Infinity`): an action that dismisses itself after four
 * seconds cannot be used.
 */
const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline", size: "sm" }),
      "col-start-2 mt-1 justify-self-start",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

/**
 * Dismiss button. Accessible name defaults to „Schließen" (overridable via
 * `aria-label`, following `DialogContent`'s `closeLabel`). Auto-dismiss is a
 * convenience, never the only way out — the button is what makes the toast
 * dismissible for someone who needs longer than the timer.
 */
const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, children, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="Schließen"
    className={cn(
      "col-start-3 row-start-1 -mr-1 -mt-1 ml-3 shrink-0 rounded p-1",
      "text-current transition-colors hover:bg-current/10",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
      className,
    )}
    {...props}
  >
    {children ?? <X aria-hidden className="h-4 w-4" />}
  </ToastPrimitive.Close>
));
ToastClose.displayName = "ToastClose";

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
