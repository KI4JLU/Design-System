import * as React from "react";
import { ChevronDown, ChevronUp, Loader2, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { getPdfDocument, loadPdfjs } from "../lib/pdf-render";
import { Button } from "./button";

/**
 * A PDF viewer on the design system's surfaces.
 *
 * Why not an <iframe>/<embed>: the browser's built-in viewer brings its own
 * chrome — dark toolbar, thumbnails, colours from the OS theme — and ignores
 * the app's theme entirely. Rendering pages with pdf.js gives plain bitmaps
 * we can lay out on `surface-container-low` with our own toolbar, so the
 * document reads as part of the app in light and dark mode alike.
 *
 * Pages are laid out at their real proportions immediately (placeholders),
 * and each bitmap is rendered only when it scrolls near the viewport. The
 * default zoom fits the page width to the container; `−`/`+` step from there.
 */
export interface PdfViewerLabels {
  zoomIn: string;
  zoomOut: string;
  previousPage: string;
  nextPage: string;
  /** e.g. (2, 10) → "2 / 10" */
  pageOf: (page: number, total: number) => string;
  loadError: string;
  fullscreen: string;
  exitFullscreen: string;
}

const DEFAULT_LABELS: PdfViewerLabels = {
  zoomIn: "Vergrößern",
  zoomOut: "Verkleinern",
  previousPage: "Vorherige Seite",
  nextPage: "Nächste Seite",
  pageOf: (page, total) => `${page} / ${total}`,
  loadError: "Das PDF konnte nicht geladen werden.",
  fullscreen: "Vollbild",
  exitFullscreen: "Vollbild beenden",
};

export interface PdfViewerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onLoad" | "onError"> {
  /** URL of the PDF (blob:, data: or http(s):). */
  src: string;
  /** 1-based page to scroll to once the document is laid out. */
  initialPage?: number;
  labels?: Partial<PdfViewerLabels>;
  /** Extra toolbar controls, right-aligned (e.g. a download button). */
  toolbarEnd?: React.ReactNode;
  onLoad?: (pageCount: number) => void;
  onError?: (err: unknown) => void;
  /**
   * No grey canvas: the pages run edge to edge on the page colour, divided by
   * a hairline instead of a grey gap (a preview window). Default: shadowed
   * pages on the `surface-container-low` canvas.
   */
  plain?: boolean;
}

type PdfDocument = Awaited<ReturnType<Awaited<ReturnType<typeof loadPdfjs>>["getDocument"]>["promise"]>;
type PdfPageProxy = Awaited<ReturnType<PdfDocument["getPage"]>>;

const ZOOM_STEPS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 3];
const PAGE_GAP = 16;
const SIDE_PAD = 24;

const PdfViewer = React.forwardRef<HTMLDivElement, PdfViewerProps>(
  ({ src, initialPage = 1, labels: labelsProp, toolbarEnd, onLoad, onError, plain = false, className, ...props }, ref) => {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const scrollRef = React.useRef<HTMLDivElement | null>(null);
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const pageRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    React.useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    // Fullscreen via the Fullscreen API on the viewer itself, so the toolbar
    // comes along; the state follows `fullscreenchange` (Esc leaves it too).
    const [fullscreen, setFullscreen] = React.useState(false);
    const fullscreenSupported = typeof document !== "undefined" && Boolean(document.fullscreenEnabled);
    React.useEffect(() => {
      const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
      document.addEventListener("fullscreenchange", onChange);
      return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);
    const toggleFullscreen = () => {
      if (document.fullscreenElement === rootRef.current) {
        void document.exitFullscreen();
      } else {
        void rootRef.current?.requestFullscreen();
      }
    };

    // Document + page sizes (PDF points at scale 1) are keyed by `src`: a new
    // src simply reads as "not loaded yet" until its own load lands, so no
    // reset has to run synchronously inside the effect.
    const [loaded, setLoaded] = React.useState<{
      src: string;
      doc: PdfDocument;
      sizes: { width: number; height: number }[];
    } | null>(null);
    const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
    const doc = loaded?.src === src ? loaded.doc : null;
    const sizes = React.useMemo(() => (loaded?.src === src ? loaded.sizes : []), [loaded, src]);
    const error = failedSrc === src;
    const [containerWidth, setContainerWidth] = React.useState(0);
    /** `null` = fit width. */
    const [zoom, setZoom] = React.useState<number | null>(null);
    const [current, setCurrent] = React.useState(initialPage);
    const scrolledToInitial = React.useRef(false);

    // Load the document and measure every page once.
    React.useEffect(() => {
      let cancelled = false;
      let task: { destroy(): Promise<void> } | null = null;
      scrolledToInitial.current = false;
      (async () => {
        try {
          const loading = await getPdfDocument(src);
          task = loading;
          const loaded = await loading.promise;
          if (cancelled) return;
          const measured: { width: number; height: number }[] = [];
          for (let i = 1; i <= loaded.numPages; i++) {
            const page = await loaded.getPage(i);
            const vp = page.getViewport({ scale: 1 });
            measured.push({ width: vp.width, height: vp.height });
          }
          if (cancelled) return;
          setLoaded({ src, doc: loaded, sizes: measured });
          onLoad?.(loaded.numPages);
        } catch (err) {
          if (!cancelled) {
            setFailedSrc(src);
            onError?.(err);
          }
        }
      })();
      return () => {
        cancelled = true;
        void task?.destroy();
      };
      // onLoad/onError are callbacks, not inputs.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    // Container width drives the fit-to-width scale.
    React.useLayoutEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => setContainerWidth(entry?.contentRect.width ?? 0));
      ro.observe(el);
      setContainerWidth(el.clientWidth);
      return () => ro.disconnect();
    }, []);

    const widest = sizes.reduce((m, s) => Math.max(m, s.width), 0);
    const sidePad = plain ? 0 : SIDE_PAD;
    const fitScale = widest > 0 && containerWidth > 0 ? (containerWidth - sidePad * 2) / widest : 1;
    const scale = zoom ?? fitScale;

    // Scroll to the requested page once the layout exists.
    React.useEffect(() => {
      if (scrolledToInitial.current || sizes.length === 0 || containerWidth === 0) return;
      const target = pageRefs.current[Math.min(Math.max(initialPage, 1), sizes.length) - 1];
      if (!target) return;
      scrolledToInitial.current = true;
      if (initialPage > 1) target.scrollIntoView({ block: "start" });
    }, [sizes, containerWidth, initialPage]);

    // Which page is the reader on: the one covering most of the viewport.
    React.useEffect(() => {
      const root = scrollRef.current;
      if (!root || sizes.length === 0) return;
      const ratios = new Map<number, number>();
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const idx = Number((e.target as HTMLElement).dataset.page);
            ratios.set(idx, e.intersectionRatio);
          }
          let best = current;
          let bestRatio = -1;
          ratios.forEach((r, idx) => {
            if (r > bestRatio) {
              bestRatio = r;
              best = idx;
            }
          });
          if (bestRatio >= 0) setCurrent(best);
        },
        { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
      );
      pageRefs.current.forEach((el) => el && io.observe(el));
      return () => io.disconnect();
      // `current` is the fallback only; re-subscribing on it would thrash.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sizes]);

    const goTo = (page: number) => {
      const idx = Math.min(Math.max(page, 1), sizes.length) - 1;
      pageRefs.current[idx]?.scrollIntoView({ block: "start", behavior: "smooth" });
    };
    const stepZoom = (dir: 1 | -1) => {
      const base = scale;
      const next =
        dir > 0
          ? ZOOM_STEPS.find((z) => z > base + 0.01)
          : [...ZOOM_STEPS].reverse().find((z) => z < base - 0.01);
      if (next) setZoom(next);
    };

    return (
      <div
        ref={rootRef}
        data-slot="pdf-viewer"
        className={cn("flex min-h-0 flex-col text-on-surface", plain ? "bg-surface-container-lowest" : "bg-surface-container-low", className)}
        {...props}
      >
        <div
          data-slot="pdf-viewer-toolbar"
          className="flex h-12 shrink-0 items-center gap-1 border-b border-outline-variant bg-surface pl-2 pr-[var(--dialog-close-inset,0.5rem)]"
        >
          <Button variant="ghost" size="icon" aria-label={labels.previousPage} disabled={current <= 1} onClick={() => goTo(current - 1)}>
            <ChevronUp aria-hidden="true" className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={labels.nextPage} disabled={current >= sizes.length} onClick={() => goTo(current + 1)}>
            <ChevronDown aria-hidden="true" className="size-4" />
          </Button>
          <span className="min-w-16 px-2 text-center text-sm tabular-nums text-on-surface-variant" aria-live="polite">
            {sizes.length > 0 ? labels.pageOf(current, sizes.length) : "–"}
          </span>
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-outline-variant" />
          <Button variant="ghost" size="icon" aria-label={labels.zoomOut} disabled={scale <= ZOOM_STEPS[0]} onClick={() => stepZoom(-1)}>
            <Minus aria-hidden="true" className="size-4" />
          </Button>
          <button
            type="button"
            className="min-w-14 rounded-action px-2 py-1 text-sm tabular-nums text-on-surface-variant hover:bg-surface-container-high"
            onClick={() => setZoom(null)}
            title="Fit"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button variant="ghost" size="icon" aria-label={labels.zoomIn} disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} onClick={() => stepZoom(1)}>
            <Plus aria-hidden="true" className="size-4" />
          </Button>
          <div className="ml-auto flex items-center gap-1">
            {toolbarEnd}
            {fullscreenSupported && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={fullscreen ? labels.exitFullscreen : labels.fullscreen}
                aria-pressed={fullscreen}
                onClick={toggleFullscreen}
              >
                {fullscreen ? <Minimize2 aria-hidden="true" className="size-4" /> : <Maximize2 aria-hidden="true" className="size-4" />}
              </Button>
            )}
          </div>
        </div>

        <div ref={scrollRef} data-slot="pdf-viewer-pages" className="min-h-0 flex-1 overflow-auto">
          {error ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-error">{labels.loadError}</div>
          ) : sizes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-on-surface-variant">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            </div>
          ) : (
            <div
              className={cn("flex flex-col items-center", plain && "divide-y divide-outline-variant")}
              style={plain ? undefined : { padding: `${PAGE_GAP}px ${SIDE_PAD}px`, gap: PAGE_GAP }}
            >
              {sizes.map((size, i) => (
                <div
                  key={i}
                  data-page={i + 1}
                  ref={(el) => {
                    pageRefs.current[i] = el;
                  }}
                  className={cn("bg-surface-container-lowest", !plain && "shadow-card")}
                  style={{ width: Math.floor(size.width * scale), height: Math.floor(size.height * scale) }}
                >
                  {doc && <PdfViewerPage doc={doc} index={i + 1} scale={scale} root={scrollRef} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);
PdfViewer.displayName = "PdfViewer";

/** One page: renders its bitmap when within a viewport of the scroll area. */
function PdfViewerPage({
  doc,
  index,
  scale,
  root,
}: {
  doc: PdfDocument;
  index: number;
  scale: number;
  root: React.RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { root: root.current, rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  React.useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let renderTask: { cancel(): void } | null = null;
    let page: PdfPageProxy | null = null;
    (async () => {
      try {
        page = await doc.getPage(index);
        if (cancelled) return;
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const task = page.render({ canvas, canvasContext: ctx, viewport });
        renderTask = task;
        await task.promise;
      } catch {
        /* cancelled or unreadable page: the placeholder stays */
      }
    })();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [visible, doc, index, scale]);

  return <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />;
}

export { PdfViewer };
