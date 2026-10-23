import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button-variants";

/**
 * Accessible modal dialog built on Radix. Provides focus trap, Escape-to-close,
 * scroll lock, and correct ARIA roles out of the box — the plan's a11y bar for
 * dialogs. Colors reference semantic tokens only.
 *
 * The one look: a 24px inset on every side, the box radius (16px), a 17px
 * semibold title whose line sits on the centre of the close button — a 36px
 * ghost icon button in the top-right corner, the same control as every other
 * icon button. Actions go in `DialogFooter`.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

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
}

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, closeLabel = "Schließen", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4",
        "rounded-[var(--ui-radius-box)] border border-outline-variant bg-surface-container-lowest p-6 text-on-surface shadow-modal",
        "focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      {/* 36px, its centre 36px from the top — on the title's line (24px inset + half its 24px line). */}
      <DialogPrimitive.Close
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "absolute top-[18px] right-[18px] size-9 p-0 text-on-surface-variant active:scale-100 [&_svg]:size-5",
        )}
        aria-label={closeLabel}
      >
        <X aria-hidden="true" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

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
      "m-0 pr-10 text-[17px] leading-6 font-semibold text-on-surface",
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
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
