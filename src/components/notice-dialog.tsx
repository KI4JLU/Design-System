import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Checkbox } from "./checkbox";
import { cn } from "../lib/utils";

/** A document the notice lists below its text. */
export interface NoticeDialogLinkItem {
  href: string;
  label: React.ReactNode;
}

const NewTabLabelContext = React.createContext("öffnet in neuem Tab");

export interface NoticeDialogLinkProps
  extends Omit<React.ComponentProps<"a">, "target" | "rel"> {
  href: string;
  /** Read by screen readers after the link text; defaults to the dialog's `newTabLabel`. */
  newTabLabel?: string;
}

/**
 * A link in a notice's text — "… in den <NoticeDialogLink href="/terms">
 * Nutzungsbedingungen</NoticeDialogLink> beschrieben." It opens in a new tab,
 * so the notice stays open, and tells screen readers so. Prefer it over
 * `links` whenever the text names the document anyway: a list below would
 * name it a second time.
 */
function NoticeDialogLink({ newTabLabel, className, children, ...props }: NoticeDialogLinkProps) {
  const contextLabel = React.useContext(NewTabLabelContext);
  return (
    <a
      data-slot="notice-dialog-link"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-primary underline underline-offset-4 hover:no-underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        className,
      )}
      {...props}
    >
      {children}
      <span className="sr-only"> ({newTabLabel ?? contextLabel})</span>
    </a>
  );
}

export interface NoticeDialogProps {
  /** The app keeps it set until the notice is answered. */
  open: boolean;
  title: React.ReactNode;
  /** The notice text: one `<p>` per paragraph, links in it as `NoticeDialogLink`. */
  children: React.ReactNode;
  /**
   * Documents listed below the text, each opening in a new tab — only for
   * documents the text does not name; otherwise link them in the text.
   */
  links?: NoticeDialogLinkItem[];
  /** Read by screen readers after each link, in the text and in `links`. */
  newTabLabel?: string;
  /** A checkbox the user has to tick before accepting; without it, accepting needs no tick. */
  confirmLabel?: React.ReactNode;
  acceptLabel?: React.ReactNode;
  declineLabel?: React.ReactNode;
  onAccept: () => void;
  onDecline: () => void;
  /** Accepting is in flight: the accept button stays disabled. */
  pending?: boolean;
}

/**
 * A notice the user has to answer before going on — an AI-use notice, changed
 * terms. Built on AlertDialog: no close button, and neither Escape nor a click
 * outside closes it; the only ways out are accepting and declining (which
 * usually signs out).
 *
 * Focus starts on the title, not on an action, so a screen reader reads the
 * notice from the top; the text and the links are the dialog's description.
 * With `confirmLabel`, accepting is disabled until the checkbox is ticked;
 * the tick resets whenever the notice opens again. On close, focus returns
 * to where it was before the notice opened.
 */
function NoticeDialog({
  open,
  title,
  children,
  links,
  newTabLabel = "öffnet in neuem Tab",
  confirmLabel,
  acceptLabel = "Akzeptieren",
  declineLabel = "Ablehnen",
  onAccept,
  onDecline,
  pending = false,
}: NoticeDialogProps) {
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const checkboxId = React.useId();
  // Reset when the notice closes, so a reopened notice starts unticked.
  const [confirmed, setConfirmed] = React.useState(false);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        data-slot="notice-dialog"
        onOpenAutoFocus={(e) => {
          // Focus has not moved yet: remember where it was, to return it on close.
          returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          e.preventDefault();
          titleRef.current?.focus();
        }}
        onCloseAutoFocus={(e) => {
          setConfirmed(false);
          // Radix would focus the trigger, and a notice has none: focus would
          // drop to <body>. Return it to where it was before the notice opened.
          e.preventDefault();
          const target = returnFocusRef.current;
          returnFocusRef.current = null;
          if (target?.isConnected) target.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle ref={titleRef} tabIndex={-1} className="outline-none">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <NewTabLabelContext.Provider value={newTabLabel}>
                {children}
                {links && links.length > 0 && (
                  <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
                    {links.map((link) => (
                      <li key={link.href}>
                        <NoticeDialogLink href={link.href}>{link.label}</NoticeDialogLink>
                      </li>
                    ))}
                  </ul>
                )}
              </NewTabLabelContext.Provider>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {confirmLabel && (
          <div className="mt-1 flex items-start gap-3">
            <Checkbox
              id={checkboxId}
              checked={confirmed}
              onCheckedChange={(next) => setConfirmed(next === true)}
            />
            <label htmlFor={checkboxId} className="text-sm font-medium">
              {confirmLabel}
            </label>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline}>{declineLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onAccept}
            disabled={pending || (confirmLabel != null && !confirmed)}
          >
            {acceptLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { NoticeDialog, NoticeDialogLink };
