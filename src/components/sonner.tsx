import * as React from "react";
import { CircleCheck, CircleX, Info, Loader2, TriangleAlert, X } from "lucide-react";
import { Toaster as Sonner, toast as sonnerToast, type ExternalToast, type ToasterProps } from "sonner";
import { CreatedTime } from "../lib/created-time";
import { cn } from "../lib/utils";
import { alertToneSurfaces } from "./alert-variants";
import { buttonVariants } from "./button-variants";

/**
 * Toasts — the shadcn `sonner` component (`npx shadcn add sonner`), normalised
 * to the design system. Sonner owns the queue, the timers, the stack and the
 * motion; this file only gives it the DS look and placement.
 *
 * **Mount `Toaster` once**, next to the app root. Raise toasts from anywhere
 * with `toast("…")`, `toast.success("…")`, `toast.error("…")`, … — no
 * provider, no hook.
 *
 * **One stack, top right**, `z-100`: above the shell's floating card (`z-20`),
 * its overlaid columns (`z-30`) and dialogs, drawers and sheets (`z-50`) —
 * only a full-screen loading screen, which replaces the app, hides it. Under
 * an `AppShell` it hangs 16px under the bar (the shell publishes the edge as
 * `--toast-stack-top` on `<html>`); without one, 16px from the top. 24rem
 * wide, full width on a phone.
 *
 * **macOS-style pile.** The newest toast in front, up to two older ones
 * peeking out below it; hovering or focusing the pile opens it into a list
 * and pauses every timer. Swipe right to dismiss. Under reduced motion Sonner
 * drops its transitions.
 *
 * **Normalised from the registry file:**
 * - `unstyled` + `classNames`: the same box as `Alert` (`alertToneSurfaces`,
 *   box radius, `shadow-overlay`), DS icons and an outline action button,
 *   instead of Sonner's own theme. Light and dark come from the DS tokens on
 *   `<html data-theme>`, so the registry's `next-themes` hook is gone.
 * - German defaults for the region and close labels (`containerAriaLabel`,
 *   `closeButtonAriaLabel`).
 *
 * **Announcements.** Sonner's region is `aria-live="polite"`: every toast is
 * read once the screen reader is done with what it is reading — errors too.
 *
 * **Creation time.** Every toast raised through this module's `toast`,
 * `toast.success` / `info` / `warning` / `error` / `message` / `loading` shows
 * when it was raised, at the end of its title row — `14:32` today, `25.11.,
 * 14:32` before. An update of a toast by its `id` restamps it. Formatted for
 * `<html lang>` (German without one), read out as the full date and time.
 * Not stamped: `toast.custom` (its own layout) and the toasts `toast.promise`
 * raises itself.
 *
 * **Close button** on every typed toast except `loading`; Sonner draws none
 * on a custom toast.
 */
const Toaster = ({
  className,
  style,
  toastOptions,
  ...props
}: ToasterProps) => (
  <Sonner
    position="top-right"
    closeButton
    gap={8}
    offset={{ top: "var(--toast-stack-top, 16px)", right: 16 }}
    mobileOffset={{ top: "var(--toast-stack-top, 16px)", left: 16, right: 16 }}
    containerAriaLabel="Benachrichtigungen"
    icons={{
      success: <CircleCheck aria-hidden className="size-5" />,
      info: <Info aria-hidden className="size-5" />,
      warning: <TriangleAlert aria-hidden className="size-5" />,
      error: <CircleX aria-hidden className="size-5" />,
      loading: <Loader2 aria-hidden className="size-5 animate-spin" />,
      close: <X aria-hidden className="size-4" />,
    }}
    // pointer-events-auto: a modal dialog sets `pointer-events: none` on
    // <body>, which the toaster would inherit — its toasts could not be
    // clicked or closed while a dialog is open.
    className={cn("toaster pointer-events-auto", className)}
    style={
      {
        "--width": "24rem",
        zIndex: 100,
        ...style,
      } as React.CSSProperties
    }
    toastOptions={{
      unstyled: true,
      closeButtonAriaLabel: "Schließen",
      ...toastOptions,
      classNames: {
        toast: cn(
          "group/toast flex w-(--width) items-start gap-3",
          "rounded-[var(--ui-radius-box)] border border-transparent px-4 py-3",
          // No surface here: Sonner joins class names without merging them,
          // so a fill on every toast would compete with the tone's in CSS
          // order. Each type below brings its own.
          "font-body-base text-sm shadow-overlay",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          // Behind the front toast only its edge shows (Sonner hides the
          // content only for its own styled toasts).
          "data-[expanded=false]:data-[front=false]:*:opacity-0",
        ),
        default: alertToneSurfaces.neutral,
        success: alertToneSurfaces.success,
        info: alertToneSurfaces.info,
        warning: alertToneSurfaces.warning,
        error: alertToneSurfaces.error,
        loading: alertToneSurfaces.neutral,
        // relative + size: Sonner centres its loading spinner absolutely in
        // this box, which its own styled toasts make the containing block.
        icon: "relative size-5 shrink-0 [&>svg]:size-5",
        content: "flex min-w-0 flex-1 flex-col gap-1",
        title: "font-semibold wrap-anywhere",
        description: "wrap-anywhere",
        actionButton: cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 self-center"),
        cancelButton: cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 self-center"),
        closeButton: cn(
          "order-last -mr-1 -mt-1 shrink-0 rounded p-1",
          "text-current transition-colors hover:bg-current/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        ),
        ...toastOptions?.classNames,
      },
    }}
    {...props}
  />
);
Toaster.displayName = "Toaster";

type ToastTitle = Parameters<typeof sonnerToast>[0];

/** The title row: the message, then the time it was raised. */
function TimedTitle({ title, at }: { title: ToastTitle; at: Date }) {
  return (
    <span data-slot="toast-title-row" className="flex items-baseline justify-between gap-3">
      <span className="min-w-0">{typeof title === "function" ? title() : title}</span>
      <CreatedTime at={at} />
    </span>
  );
}

type Raise = (title: ToastTitle, data?: ExternalToast) => string | number;
const stamped =
  (raise: Raise): Raise =>
  (title, data) =>
    raise(<TimedTitle title={title} at={new Date()} />, data);

/**
 * Sonner's `toast`, with the creation time in every typed toast's title row.
 * `toast.custom`, `toast.promise`, `toast.dismiss` and the rest are Sonner's
 * own — a custom toast brings its own layout.
 */
const toast = Object.assign(stamped(sonnerToast), sonnerToast, {
  success: stamped(sonnerToast.success),
  info: stamped(sonnerToast.info),
  warning: stamped(sonnerToast.warning),
  error: stamped(sonnerToast.error),
  message: stamped(sonnerToast.message),
  loading: stamped(sonnerToast.loading),
}) as typeof sonnerToast;

// `toast` sits next to its `Toaster`, as in the registry file.
// eslint-disable-next-line react-refresh/only-export-components
export { Toaster, toast, type ExternalToast, type ToasterProps };
