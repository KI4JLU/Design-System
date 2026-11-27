/**
 * Radix `onInteractOutside` guard for modal overlays: a press or focus on a
 * floating message above the dialog — a toast (`Toaster`) or `AppShell`'s
 * status layer, both portaled outside the dialog — is not an interaction
 * outside the dialog. Without it, closing such a message while a dialog is
 * open closes the dialog too.
 *
 * Pointer only: the dialog's focus trap still keeps keyboard focus inside, so
 * a message's controls cannot be reached by Tab while a modal is open (as
 * with the Radix toasts before).
 */
export function keepOpenOnToast<E extends CustomEvent<{ originalEvent: Event }>>(
  handler?: (event: E) => void,
) {
  return (event: E) => {
    const target = event.detail.originalEvent.target;
    if (target instanceof Element && target.closest("[data-sonner-toaster], [data-slot='app-shell-status']")) {
      event.preventDefault();
    }
    handler?.(event);
  };
}
