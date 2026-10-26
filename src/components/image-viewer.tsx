import * as React from "react";
import { Check, Copy, Loader2, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * An image on the design system's surfaces, `PdfViewer`'s and
 * `RichTextEditor`'s sibling: the same 48px toolbar on `surface` — zoom
 * (− / fit % / +) at the start, then `toolbarEnd` (e.g. a download link),
 * copy and fullscreen at the end — over the image on the page colour.
 *
 * The default zoom fits the whole image into the viewer (never enlarging a
 * small one); `−`/`+` step through fixed zoom levels from there, and the
 * percentage resets to fit. Zoomed past the viewer, the image pans by
 * dragging. Copy puts the image on the clipboard as PNG (the
 * one image type the async clipboard accepts everywhere), redrawn through a
 * canvas, so `src` must be same-origin, a blob: or a data: URL.
 */
export interface ImageViewerLabels {
  zoomIn: string;
  zoomOut: string;
  fit: string;
  copy: string;
  copied: string;
  fullscreen: string;
  exitFullscreen: string;
  loadError: string;
}

const DEFAULT_LABELS: ImageViewerLabels = {
  zoomIn: "Vergrößern",
  zoomOut: "Verkleinern",
  fit: "Einpassen",
  copy: "Bild kopieren",
  copied: "Kopiert",
  fullscreen: "Vollbild",
  exitFullscreen: "Vollbild beenden",
  loadError: "Das Bild konnte nicht geladen werden.",
};

export interface ImageViewerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onLoad" | "onError"> {
  /** URL of the image (blob:, data: or same-origin http(s):). */
  src: string;
  /** The image's text alternative. */
  alt: string;
  labels?: Partial<ImageViewerLabels>;
  /** Extra toolbar controls before copy and fullscreen (e.g. a download link). */
  toolbarEnd?: React.ReactNode;
  onLoad?: (size: { width: number; height: number }) => void;
  onError?: () => void;
}

const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 3, 4];
const PAD = 24;

/** A toolbar button with its tooltip, rendered inside the viewer while it is fullscreen (`container`). */
function ViewerButton({
  label, pressed, disabled, onClick, container, children,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  container: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent container={container}>{label}</TooltipContent>
    </Tooltip>
  );
}

async function toPngBlob(img: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

const ImageViewer = React.forwardRef<HTMLDivElement, ImageViewerProps>(
  ({ src, alt, labels: labelsProp, toolbarEnd, onLoad, onError, className, ...props }, ref) => {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const areaRef = React.useRef<HTMLDivElement | null>(null);
    const imgRef = React.useRef<HTMLImageElement | null>(null);
    React.useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    // Fullscreen on the viewer itself, so the toolbar comes along; the state
    // follows `fullscreenchange` (Esc leaves it too).
    const [fullscreenEl, setFullscreenEl] = React.useState<HTMLElement | null>(null);
    const fullscreen = fullscreenEl !== null;
    const fullscreenSupported = typeof document !== "undefined" && Boolean(document.fullscreenEnabled);
    React.useEffect(() => {
      const onChange = () =>
        setFullscreenEl(document.fullscreenElement === rootRef.current ? rootRef.current : null);
      document.addEventListener("fullscreenchange", onChange);
      return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);
    const toggleFullscreen = () => {
      if (document.fullscreenElement === rootRef.current) void document.exitFullscreen();
      else void rootRef.current?.requestFullscreen?.();
    };

    // Natural size keyed by src, so a new image reads as "not loaded yet".
    const [natural, setNatural] = React.useState<{ src: string; width: number; height: number } | null>(null);
    const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
    const size = natural?.src === src ? natural : null;
    const error = failedSrc === src;

    const [area, setArea] = React.useState({ width: 0, height: 0 });
    React.useEffect(() => {
      const el = areaRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        if (entry) setArea({ width: entry.contentRect.width, height: entry.contentRect.height });
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    /** `null` = fit. */
    const [zoom, setZoom] = React.useState<number | null>(null);
    const fitScale = size && area.width > 0 && area.height > 0
      ? Math.min(1, (area.width - 2 * PAD) / size.width, (area.height - 2 * PAD) / size.height)
      : 1;
    const scale = zoom ?? Math.max(fitScale, 0.01);
    const stepZoom = (dir: 1 | -1) => {
      const next = dir > 0
        ? ZOOM_STEPS.find((z) => z > scale + 0.01)
        : [...ZOOM_STEPS].reverse().find((z) => z < scale - 0.01);
      if (next) setZoom(next);
    };

    // Drag to pan once the image is larger than the viewer: the canvas
    // scrolls with the pointer (mouse, pen or touch), wheel and scrollbars
    // keep working as well.
    const overflows = size !== null
      && (size.width * scale + 2 * PAD > area.width + 1 || size.height * scale + 2 * PAD > area.height + 1);
    const drag = React.useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
    const [dragging, setDragging] = React.useState(false);
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = areaRef.current;
      if (!overflows || !el || e.button !== 0) return;
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
      el.setPointerCapture(e.pointerId);
      setDragging(true);
      e.preventDefault();
    };
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      const el = areaRef.current;
      if (!d || !el || e.pointerId !== d.id) return;
      el.scrollLeft = d.left - (e.clientX - d.x);
      el.scrollTop = d.top - (e.clientY - d.y);
    };
    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current || e.pointerId !== drag.current.id) return;
      areaRef.current?.releasePointerCapture?.(e.pointerId);
      drag.current = null;
      setDragging(false);
    };

    const [copied, setCopied] = React.useState(false);
    const copiedTimer = React.useRef<number | undefined>(undefined);
    React.useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
    const canCopy = typeof navigator !== "undefined" && Boolean(navigator.clipboard?.write) && typeof ClipboardItem !== "undefined";
    const copyImage = async () => {
      const img = imgRef.current;
      if (!img) return;
      // The promise form keeps Safari's user-activation window open while the PNG is drawn.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": toPngBlob(img) })]);
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1500);
    };

    const iconClass = "size-4";

    return (
      <div
        ref={rootRef}
        data-slot="image-viewer"
        className={cn("flex min-h-0 flex-col bg-surface-container-lowest text-on-surface", className)}
        {...props}
      >
        <div
          data-slot="image-viewer-toolbar"
          className="flex h-12 shrink-0 items-center gap-1 border-b border-outline-variant bg-surface pl-2 pr-[var(--dialog-close-inset,0.5rem)]"
        >
          <ViewerButton label={labels.zoomOut} disabled={!size || scale <= ZOOM_STEPS[0]} onClick={() => stepZoom(-1)} container={fullscreenEl}>
            <Minus aria-hidden="true" className={iconClass} />
          </ViewerButton>
          <button
            type="button"
            className="min-w-14 rounded-action px-2 py-1 text-sm tabular-nums text-on-surface-variant hover:bg-surface-container-high"
            onClick={() => setZoom(null)}
            title={labels.fit}
            aria-label={`${labels.fit} (${Math.round(scale * 100)}%)`}
          >
            {size ? `${Math.round(scale * 100)}%` : "–"}
          </button>
          <ViewerButton label={labels.zoomIn} disabled={!size || scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} onClick={() => stepZoom(1)} container={fullscreenEl}>
            <Plus aria-hidden="true" className={iconClass} />
          </ViewerButton>
          <div className="ml-auto flex items-center gap-1">
            {toolbarEnd}
            {canCopy && (
              <ViewerButton label={copied ? labels.copied : labels.copy} disabled={!size} onClick={() => void copyImage().catch(() => {})} container={fullscreenEl}>
                {copied ? <Check aria-hidden="true" className={iconClass} /> : <Copy aria-hidden="true" className={iconClass} />}
              </ViewerButton>
            )}
            {fullscreenSupported && (
              <ViewerButton label={fullscreen ? labels.exitFullscreen : labels.fullscreen} pressed={fullscreen} onClick={toggleFullscreen} container={fullscreenEl}>
                {fullscreen ? <Minimize2 aria-hidden="true" className={iconClass} /> : <Maximize2 aria-hidden="true" className={iconClass} />}
              </ViewerButton>
            )}
          </div>
        </div>

        <div
          ref={areaRef}
          data-slot="image-viewer-canvas"
          className={cn(
            "relative min-h-0 flex-1 overflow-auto",
            overflows && (dragging ? "cursor-grabbing select-none" : "cursor-grab"),
            overflows && "touch-none",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {error ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-error">{labels.loadError}</div>
          ) : (
            <div className="flex min-h-full min-w-full items-center justify-center" style={{ padding: PAD, width: "max-content" }}>
              {!size && <Loader2 aria-hidden="true" className="absolute size-5 animate-spin text-on-surface-variant" />}
              <img
                ref={imgRef}
                src={src}
                alt={alt}
                draggable={false}
                className={cn("block max-w-none", !size && "invisible")}
                style={size ? { width: Math.round(size.width * scale), height: Math.round(size.height * scale) } : undefined}
                onLoad={(e) => {
                  const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
                  setNatural({ src, width, height });
                  onLoad?.({ width, height });
                }}
                onError={() => {
                  setFailedSrc(src);
                  onError?.();
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  },
);
ImageViewer.displayName = "ImageViewer";

export { ImageViewer };
