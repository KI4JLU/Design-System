import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { BreadcrumbBack, type BreadcrumbBackLabels } from "./breadcrumb";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";

/**
 * The frame of a document preview: one dialog, one header band, the viewer
 * below it. Every preview of a file — a PDF (`PdfViewer`), a text
 * (`RichTextEditor`), an image (`ImageViewer`), a table, a list of a synced
 * source's entries — uses it, so their headers cannot drift apart.
 *
 *  - `PreviewHeader` — the type icon on the `primary-fixed` tile, the title
 *    (or an input in its place), a one-line subtitle, an optional back link
 *    above the title and header actions on the close button's line. The
 *    right edge keeps the dialog's close button clear (`--dialog-close-*`).
 *  - `PreviewHeaderBand` — the header plus the rows that belong to it
 *    (sheet tabs, a sync strip), on the chrome surface (`bg-surface`). A
 *    dialog with its own frame renders it directly.
 *  - `PreviewDialog` — the dialog box (`document`: 900px × 85vh; `wide`:
 *    nearly the viewport, or all of it with `fullscreen`), the band, the body
 *    on the page colour and an optional footer for the dialog's actions.
 *    Actions never go in the header.
 */
export interface PreviewLabels extends BreadcrumbBackLabels {
  /** The dialog's close button. */
  close: string;
}

const DEFAULT_LABELS: PreviewLabels = {
  close: "Schließen",
  nav: "Navigationspfad",
  back: "Zurück zu",
};

/** The parent level of a preview opened from a list ("‹ Aktuelles (HRZ)"). */
export interface PreviewBack {
  trail: string[];
  onBack: () => void;
}

export interface PreviewHeaderProps {
  /** The type glyph on the tile. */
  icon: LucideIcon;
  /** The title, and the dialog's accessible name. */
  title: React.ReactNode;
  /** A tooltip on the title (e.g. the raw file name behind a cleaned title). */
  titleTooltip?: string;
  /** An input in the title's place (a new document being named); `title` then names the dialog for assistive tech only. */
  titleField?: React.ReactNode;
  /** One line under the title: format, size, "nur Lesen". */
  subtitle: React.ReactNode;
  /** Header actions on the close button's line (e.g. "In Confluence öffnen"). */
  actions?: React.ReactNode;
  /** The way back to the list this preview was opened from, above the title. */
  back?: PreviewBack;
  labels?: Partial<PreviewLabels>;
}

function PreviewHeader({ icon: Icon, title, titleTooltip, titleField, subtitle, actions, back, labels: labelsProp }: PreviewHeaderProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  return (
    // The right edge keeps the dialog's close button clear, through its custom
    // property (Dialog `--dialog-close-reserve`), plus an 8px gap.
    <div
      data-slot="preview-header"
      className="flex shrink-0 items-center gap-3 pt-4 pb-2 pr-[calc(var(--dialog-close-reserve,3.5rem)_+_0.5rem)] pl-5"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-fixed text-on-primary-fixed-variant">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        {back && (
          <BreadcrumbBack
            className="mb-0.5"
            trail={back.trail}
            labels={{ nav: labels.nav, back: labels.back }}
            onClick={back.onBack}
          />
        )}
        {titleField ? (
          <>
            <DialogTitle className="sr-only">{title}</DialogTitle>
            {titleField}
          </>
        ) : (
          <DialogTitle className="truncate text-base font-semibold" title={titleTooltip}>{title}</DialogTitle>
        )}
        <DialogDescription className="truncate text-xs">{subtitle}</DialogDescription>
      </div>
      {/* On the close button's line: a box as tall as the ✕, at its top
          inset (Dialog `--dialog-close-*`), whatever the title column's
          height (a back link above it makes the row taller). */}
      {actions && (
        <div className="mt-[calc(var(--dialog-close-inset,18px)_-_1rem)] flex h-[var(--dialog-close-size,2.25rem)] shrink-0 items-center gap-2 self-start">
          {actions}
        </div>
      )}
    </div>
  );
}

export interface PreviewHeaderBandProps extends PreviewHeaderProps {
  /** Rows under the title that belong to the header band (sheet tabs, a search strip). */
  toolbar?: React.ReactNode;
}

function PreviewHeaderBand({ toolbar, ...header }: PreviewHeaderBandProps) {
  return (
    <div data-slot="preview-header-band" className="shrink-0 bg-surface">
      <PreviewHeader {...header} />
      {toolbar}
    </div>
  );
}

export interface PreviewDialogProps extends PreviewHeaderBandProps {
  onClose: () => void;
  /** Default true; a caller that keeps the dialog mounted passes its open state. */
  open?: boolean;
  /**
   * `document` — a reading window (PDF, text, image), 900px wide and 85% high;
   * `wide` — a table window, nearly the whole viewport.
   */
  size?: "document" | "wide";
  /** `wide` only: the whole viewport, no frame. */
  fullscreen?: boolean;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
  /** The viewer, on the page colour below the header band. */
  children: React.ReactNode;
  /** The dialog's actions (a `DialogFooter`), below the body. */
  footer?: React.ReactNode;
}

function PreviewDialog({
  onClose, open = true, size = "document", fullscreen = false, onEscapeKeyDown, children, footer, labels, ...header
}: PreviewDialogProps) {
  const closeLabel = labels?.close ?? DEFAULT_LABELS.close;
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        data-slot="preview-dialog"
        closeLabel={closeLabel}
        onEscapeKeyDown={onEscapeKeyDown}
        className={cn(
          "flex max-w-none flex-col gap-0 overflow-hidden p-0",
          size === "document" && "h-[85vh] w-[min(900px,90vw)]",
          // A fixed height, not content-sized: switching sheets, searching or
          // loading rows must not resize the window.
          size === "wide" && (fullscreen
            ? "top-0 left-0 h-dvh max-h-none w-screen translate-x-0 translate-y-0 rounded-none border-0"
            : "h-[calc(100dvh-3rem)] w-[calc(100vw-2rem)] max-w-[88rem] rounded-2xl"),
        )}
      >
        <PreviewHeaderBand {...header} labels={labels} />
        {children}
        {footer && (
          <div data-slot="preview-footer" className="shrink-0 border-t border-outline-variant bg-surface px-5 py-3">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { PreviewDialog, PreviewHeader, PreviewHeaderBand };
