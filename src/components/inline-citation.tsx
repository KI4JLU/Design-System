"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../lib/utils";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  InlineCitationCardContext,
  useInlineCitationCard,
} from "./inline-citation-context";

export type InlineCitationProps = ComponentProps<"span">;

export const InlineCitation = ({
  className,
  ...props
}: InlineCitationProps) => (
  <span
    className={cn("group inline items-center gap-1", className)}
    {...props}
  />
);

export type InlineCitationTextProps = ComponentProps<"span">;

export const InlineCitationText = ({
  className,
  ...props
}: InlineCitationTextProps) => (
  <span
    className={cn("transition-colors group-hover:bg-surface-container-high", className)}
    {...props}
  />
);

// DS: a Popover with hover intent instead of AI Elements' HoverCard (hover
// only — no keyboard or touch path). Hover opens after `openDelay` and lets
// the pointer travel chip → card; click / Enter pins it and moves focus in;
// Esc closes and returns focus to the chip (Radix Popover).
export type InlineCitationCardProps = ComponentProps<typeof Popover> & {
  /** Hover intent before the card opens, in ms. */
  openDelay?: number;
  /** Grace period for the pointer to travel between chip and card, in ms. */
  closeDelay?: number;
  /** `false`: the card opens only on click or Enter, never on hover. Default `true`. */
  openOnHover?: boolean;
};

export const InlineCitationCard = ({
  open: openProp,
  defaultOpen,
  onOpenChange,
  openDelay = 300,
  closeDelay = 150,
  openOnHover = true,
  ...props
}: InlineCitationCardProps) => {
  const [open = false, setOpen] = useControllableState({
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    prop: openProp,
  });
  const pinnedRef = useRef(false);
  // Whether closing should hand focus back to the chip: only for a card a
  // click or Enter pinned, never for a hover preview.
  const restoreFocusRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = useCallback(() => clearTimeout(timer.current), []);
  useEffect(() => cancel, [cancel]);

  const hoverOpen = useCallback(() => {
    cancel();
    if (open || !openOnHover) return;
    timer.current = setTimeout(() => setOpen(true), openDelay);
  }, [cancel, open, openDelay, openOnHover, setOpen]);
  const hoverClose = useCallback(() => {
    cancel();
    if (pinnedRef.current || !openOnHover) return;
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [cancel, closeDelay, openOnHover, setOpen]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      cancel();
      if (!next) {
        restoreFocusRef.current = pinnedRef.current;
        pinnedRef.current = false;
      }
      setOpen(next);
    },
    [cancel, setOpen]
  );

  // A controlled consumer can close the card without onOpenChange: drop the
  // pin there too, or the next hover preview would open pinned.
  useEffect(() => {
    if (!open && pinnedRef.current) {
      restoreFocusRef.current = true;
      pinnedRef.current = false;
    }
  }, [open]);

  const context = useMemo(
    () => ({ cancel, hoverClose, hoverOpen, open, pinnedRef, restoreFocusRef, setOpen }),
    [cancel, hoverClose, hoverOpen, open, setOpen]
  );

  return (
    <InlineCitationCardContext.Provider value={context}>
      <Popover onOpenChange={handleOpenChange} open={open} {...props} />
    </InlineCitationCardContext.Provider>
  );
};

export type InlineCitationCardTriggerProps = ComponentProps<"button"> & {
  /** AI Elements' default content (hostname +N) when no children are given. */
  sources?: string[];
};

export const InlineCitationCardTrigger = ({
  sources = [],
  className,
  children,
  onClick,
  onPointerEnter,
  onPointerLeave,
  ...props
}: InlineCitationCardTriggerProps) => {
  const { cancel, hoverClose, hoverOpen, open, pinnedRef } = useInlineCitationCard();
  return (
    <PopoverTrigger asChild>
      <button
        className={cn(
          // `align-[2px]`: on the baseline the 20px chip hangs 2px below the
          // centre of the capitals beside it (measured at 15px Inter); raised,
          // it sits centred on the line's cap height.
          "ml-1 inline-flex h-5 min-w-5 items-center justify-center px-1.5 align-[2px] text-[11px] font-semibold leading-none",
          "rounded bg-primary-fixed text-on-primary-fixed-variant transition-colors",
          "data-[state=open]:bg-primary data-[state=open]:text-on-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          className
        )}
        onClick={(event) => {
          onClick?.(event);
          cancel();
          if (open && !pinnedRef.current) {
            // Opened by hover: the click pins it instead of closing it.
            event.preventDefault();
            pinnedRef.current = true;
            document
              .getElementById(event.currentTarget.getAttribute("aria-controls") ?? "")
              ?.focus();
            return;
          }
          pinnedRef.current = !open;
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (event.pointerType === "mouse") hoverOpen();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (event.pointerType === "mouse") hoverClose();
        }}
        type="button"
        {...props}
      >
        {children ??
          (sources[0] ? (
            <>
              {new URL(sources[0]).hostname}{" "}
              {sources.length > 1 && `+${sources.length - 1}`}
            </>
          ) : (
            "unknown"
          ))}
      </button>
    </PopoverTrigger>
  );
};

export type InlineCitationCardBodyProps = ComponentProps<typeof PopoverContent>;

export const InlineCitationCardBody = ({
  className,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onPointerEnter,
  onPointerLeave,
  ...props
}: InlineCitationCardBodyProps) => {
  const { cancel, hoverClose, pinnedRef, restoreFocusRef } = useInlineCitationCard();
  return (
    <PopoverContent
      className={cn("relative w-80 p-0", className)}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event);
        // A hover preview must not steal focus; a pinnedRef one takes it.
        if (!pinnedRef.current) event.preventDefault();
      }}
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event);
        // Closing a hover preview leaves focus where it was (e.g. a text field).
        if (!restoreFocusRef.current) event.preventDefault();
        restoreFocusRef.current = false;
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        cancel();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (event.pointerType === "mouse") hoverClose();
      }}
      tabIndex={-1}
      {...props}
    />
  );
};

export type InlineCitationSourceProps = ComponentProps<"div"> & {
  title?: string;
  url?: string;
  description?: string;
};

export const InlineCitationSource = ({
  title,
  url,
  description,
  className,
  children,
  ...props
}: InlineCitationSourceProps) => (
  <div className={cn("space-y-1", className)} {...props}>
    {title && (
      <h4 className="m-0 truncate font-medium text-sm leading-tight">{title}</h4>
    )}
    {url && (
      <p className="m-0 truncate break-all text-on-surface-variant text-xs">{url}</p>
    )}
    {description && (
      <p className="m-0 line-clamp-3 text-on-surface-variant text-sm leading-relaxed">
        {description}
      </p>
    )}
    {children}
  </div>
);

export type InlineCitationQuoteProps = ComponentProps<"blockquote">;

export const InlineCitationQuote = ({
  children,
  className,
  ...props
}: InlineCitationQuoteProps) => (
  <blockquote
    className={cn(
      "m-0 border-surface-container border-l-2 pl-3 text-on-surface-variant text-sm italic",
      className
    )}
    {...props}
  >
    {children}
  </blockquote>
);
