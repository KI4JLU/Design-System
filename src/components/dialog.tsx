import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { dialogContentVariants } from "./dialog-variants";

/**
 * Accessible modal dialog built on Radix. Provides focus trap, Escape-to-close,
 * scroll lock, and correct ARIA roles out of the box — the plan's a11y bar for
 * dialogs. Colors reference semantic tokens only.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/**
 * True inside a `DialogContent`, which always renders its close button in the
 * top-right corner — `DialogHeader` reads it to keep its text clear of it.
 */
const DialogCloseButtonContext = React.createContext(false);

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Accessible name of the built-in close ("X") button. Default "Schließen". */
  closeLabel?: string;
  /** Max width: `sm` 384px · `default` 512px · `lg` 672px · `xl` 768px. */
  size?: VariantProps<typeof dialogContentVariants>["size"];
}

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size, closeLabel = "Schließen", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ size }), className)}
      {...props}
    >
      <DialogCloseButtonContext.Provider value={true}>
        {children}
      </DialogCloseButtonContext.Provider>
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-md p-1 text-on-surface-variant opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none"
        aria-label={closeLabel}
      >
        <X className="h-5 w-5" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Title and description. Inside `DialogContent` it keeps its text clear of the
 * close button (right padding; symmetric while the text is centred on narrow
 * screens), so a long title wraps instead of running under the "X".
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  const besideCloseButton = React.useContext(DialogCloseButtonContext);
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1.5 text-center sm:text-left",
        besideCloseButton && "px-8 sm:pl-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The part of a long dialog that scrolls on its own, between `DialogHeader`
 * and `DialogFooter`, which stay in view. It reaches out to the dialog's edges
 * (`-mx-6`, padded back in) so the scrollbar sits at the edge and focus rings
 * inside are not clipped — this assumes the default `p-6` of `DialogContent`.
 * If it holds no focusable element, give it `tabIndex={0}` and an
 * `aria-label` so keyboard users can scroll it.
 */
const DialogBody = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dialog-body"
      className={cn(
        "-mx-6 -my-1 min-h-0 overflow-y-auto px-6 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
        className,
      )}
      {...props}
    />
  ),
);
DialogBody.displayName = "DialogBody";

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "m-0 font-headline-md text-headline-md font-semibold text-on-surface",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("m-0 text-sm text-on-surface-variant", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
