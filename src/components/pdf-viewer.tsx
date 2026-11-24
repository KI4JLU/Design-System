import * as React from "react";
import { ChevronDown, ChevronUp, Loader2, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { getPdfDocument, loadPdfjs } from "../lib/pdf-render";
import { matchPdfText } from "../lib/pdf-text-match";
import { Button } from "./button";
import { Input } from "./input";

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
 *
 * `highlights` marks passages on the pages (a cited passage, a search hit):
 * each is looked up in the page's text content, tolerant of spacing,
 * hyphenation and Markdown (`lib/pdf-text-match`), and drawn as a yellow
 * text-marker mark over the bitmap. The first mark on `initialPage` is
 * scrolled into view. `pages` shows only some pages (the cited one); the
 * page indicator keeps the document's own numbers.
 */
export interface PdfViewerLabels {
  zoomIn: string;
  zoomOut: string;
  previousPage: string;
  nextPage: string;
  /** e.g. (2, 10) → "2 / 10" */
  pageOf: (page: number, total: number) => string;
  /** The single page on show (`pages` with one entry), e.g. (2, 10) → "Seite 2 von 10". */
  pageSingle: (page: number, total: number) => string;
  /** Accessible name of the page field (type a number, Enter jumps there). */
  goToPage: string;
  /** After the page field, e.g. 10 → "/ 10". */
  ofTotal: (total: number) => string;
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
  pageSingle: (page, total) => `Seite ${page} von ${total}`,
  goToPage: "Seite",
  ofTotal: (total) => `/ ${total}`,
  loadError: "Das PDF konnte nicht geladen werden.",
  fullscreen: "Vollbild",
  exitFullscreen: "Vollbild beenden",
};

/** A passage to mark: its text, and optionally the one page (1-based) to look on. */
export interface PdfHighlight {
  text: string;
  page?: number;
}

export interface PdfViewerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onLoad" | "onError"> {
  /** URL of the PDF (blob:, data: or http(s):). */
  src: string;
  /** 1-based page to scroll to once the document is laid out. */
  initialPage?: number;
  /** Passages to mark on the pages; without `page`, every page is searched. */
  highlights?: PdfHighlight[];
  /** Only these pages (1-based), in document order; default every page. */
  pages?: number[];
  labels?: Partial<PdfViewerLabels>;
  /** Extra toolbar controls, right-aligned (e.g. a download button). */
  toolbarEnd?: React.ReactNode;
  /** Leads the toolbar, before the page controls (e.g. a preview's `PreviewBackLink`). */
  toolbarStart?: React.ReactNode;
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
  ({ src, initialPage = 1, highlights, pages, labels: labelsProp, toolbarEnd, toolbarStart, onLoad, onError, plain = false, className, ...props }, ref) => {
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const scrollRef = React.useRef<HTMLDivElement | null>(null);
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    /** Page elements by their 1-based page number. */
    const pageRefs = React.useRef(new Map<number, HTMLDivElement>());
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

    // The pages on show: `pages` (valid, deduplicated, in order) or all of them.
    const pagesKey = (pages ?? []).join(",");
    const shown = React.useMemo(() => {
      const all = sizes.map((_, i) => i + 1);
      if (!pagesKey) return all;
      const wanted = new Set(pagesKey.split(",").map(Number));
      const picked = all.filter((p) => wanted.has(p));
      return picked.length > 0 ? picked : all;
    }, [sizes, pagesKey]);
    const startPage = shown.includes(initialPage) ? initialPage : (shown[0] ?? 1);

    const widest = shown.reduce((m, p) => Math.max(m, sizes[p - 1]?.width ?? 0), 0);
    const sidePad = plain ? 0 : SIDE_PAD;
    const fitScale = widest > 0 && containerWidth > 0 ? (containerWidth - sidePad * 2) / widest : 1;
    const scale = zoom ?? fitScale;

    // Scroll to the requested page once the layout exists.
    React.useEffect(() => {
      if (scrolledToInitial.current || shown.length === 0 || containerWidth === 0) return;
      const target = pageRefs.current.get(startPage);
      if (!target) return;
      scrolledToInitial.current = true;
      setCurrent(startPage);
      if (startPage !== shown[0]) target.scrollIntoView({ block: "start" });
    }, [shown, containerWidth, startPage]);

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
      pageRefs.current.forEach((el) => io.observe(el));
      return () => io.disconnect();
      // `current` is the fallback only; re-subscribing on it would thrash.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shown]);

    // Previous / next step through the pages on show.
    const at = shown.indexOf(current);
    const goTo = (page: number | undefined) => {
      if (page != null) pageRefs.current.get(page)?.scrollIntoView({ block: "start", behavior: "smooth" });
    };

    // The page field: shows the current page; while focused it holds what is
    // typed. Enter jumps to that page if it is on show; Escape and leaving
    // the field drop the input.
    const [pageDraft, setPageDraft] = React.useState<string | null>(null);
    const commitPage = () => {
      const page = Number(pageDraft);
      if (Number.isInteger(page) && shown.includes(page)) goTo(page);
      setPageDraft(null);
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
          {toolbarStart && <>{toolbarStart}<span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-outline-variant" /></>}
          {/* One page on show: no stepping, the page as a plain label — an
              excerpt of a longer document, not a document of one page. */}
          {shown.length === 1 ? (
            <span className="px-2 text-sm tabular-nums text-on-surface-variant">
              {labels.pageSingle(shown[0], sizes.length)}
            </span>
          ) : (
            <>
              <Button variant="ghost" size="icon" aria-label={labels.previousPage} disabled={at <= 0} onClick={() => goTo(shown[at - 1])}>
                <ChevronUp aria-hidden="true" className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={labels.nextPage} disabled={at < 0 || at >= shown.length - 1} onClick={() => goTo(shown[at + 1])}>
                <ChevronDown aria-hidden="true" className="size-4" />
              </Button>
              {sizes.length > 0 ? (
                <span className="flex items-center gap-1 px-1 text-sm tabular-nums text-on-surface-variant">
                  <Input
                    type="text"
                    inputMode="numeric"
                    // A dialog around the viewer can tell an Escape meant for this field.
                    data-slot="pdf-viewer-page-field"
                    aria-label={labels.goToPage}
                    value={pageDraft ?? String(current)}
                    // Room for the widest page number plus the field's padding and border.
                    style={{ width: `calc(${Math.max(2, String(sizes.length).length)}ch + 1.5rem + 2px)` }}
                    onFocus={(e) => {
                      setPageDraft(String(current));
                      e.currentTarget.select();
                    }}
                    onChange={(e) => setPageDraft(e.currentTarget.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        commitPage();
                        e.currentTarget.blur();
                      } else if (e.key === "Escape") {
                        setPageDraft(null);
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={() => setPageDraft(null)}
                    // eslint-disable-next-line design-system/layout-only-classname -- a page counter in the 48px toolbar: Input has no compact size, and the field must read as the toolbar's small numerals
                    className="h-8 px-2 py-0 text-center text-sm tabular-nums"
                  />
                  <span aria-hidden="true">{labels.ofTotal(sizes.length)}</span>
                  {/* The page reached by scrolling, announced: the field itself is not live. */}
                  <span className="sr-only" aria-live="polite">{labels.pageOf(current, sizes.length)}</span>
                </span>
              ) : (
                <span className="min-w-16 px-2 text-center text-sm text-on-surface-variant">–</span>
              )}
            </>
          )}
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-outline-variant" />
          <Button variant="ghost" size="icon" aria-label={labels.zoomOut} disabled={scale <= ZOOM_STEPS[0]} onClick={() => stepZoom(-1)}>
            <Minus aria-hidden="true" className="size-4" />
          </Button>
          <button
            type="button"
            className="min-w-14 rounded-action px-2 py-1 text-sm tabular-nums text-on-surface-variant hover:bg-hover"
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
              {shown.map((page) => {
                const size = sizes[page - 1];
                return (
                  <div
                    key={page}
                    data-page={page}
                    ref={(el) => {
                      if (el) pageRefs.current.set(page, el);
                      else pageRefs.current.delete(page);
                    }}
                    className={cn("relative bg-surface-container-lowest", !plain && "shadow-card")}
                    style={{ width: Math.floor(size.width * scale), height: Math.floor(size.height * scale) }}
                  >
                    {doc && (
                      <PdfViewerPage
                        doc={doc}
                        index={page}
                        scale={scale}
                        root={scrollRef}
                        highlights={highlightsOn(highlights, page)}
                        revealMark={page === startPage}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  },
);
PdfViewer.displayName = "PdfViewer";

/** The highlight texts that apply to one page. */
function highlightsOn(highlights: PdfHighlight[] | undefined, page: number): string[] {
  return (highlights ?? []).filter((h) => h.text.trim() && (h.page == null || h.page === page)).map((h) => h.text);
}

/** A mark's box, in percent of the page, so zooming needs no new lookup. */
interface MarkBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** One page: renders its bitmap (and its marks) when within a viewport of the scroll area. */
function PdfViewerPage({
  doc,
  index,
  scale,
  root,
  highlights,
  revealMark,
}: {
  doc: PdfDocument;
  index: number;
  scale: number;
  root: React.RefObject<HTMLDivElement | null>;
  highlights: string[];
  /** Scroll the first mark into view once it is drawn (the page opened on). */
  revealMark: boolean;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const firstMarkRef = React.useRef<HTMLSpanElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [marks, setMarks] = React.useState<{ key: string; boxes: MarkBox[] } | null>(null);
  // The texts as one stable key: callers pass a fresh array on every render.
  const highlightKey = highlights.join("\u0000");

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

  // Marks: the page's text items, matched against the highlights, as boxes
  // over the bitmap. Measured once at scale 1, kept in percent of the page.
  React.useEffect(() => {
    if (!visible || !highlightKey) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const page = await doc.getPage(index);
        const content = await page.getTextContent();
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 });
        const items = content.items.filter((it): it is Extract<typeof it, { str: string }> => "str" in it);
        const boxes: MarkBox[] = [];
        for (const range of matchPdfText(items, highlightKey.split("\u0000"))) {
          const item = items[range.item];
          const len = item.str.length;
          if (!len) continue;
          const tx = pdfjs.Util.transform(viewport.transform, item.transform);
          // Upright text only: the box below runs along screen x. Rotated or
          // vertical text (a rotated page, a margin note) gets no mark rather
          // than a wrong one.
          if (Math.abs(tx[1]) > 0.01 * Math.abs(tx[0]) || Math.abs(tx[2]) > 0.01 * Math.abs(tx[3]) || tx[0] <= 0) continue;
          const fontHeight = Math.hypot(tx[2], tx[3]);
          const width = item.width * viewport.scale;
          const left = tx[4] + (width * range.start) / len;
          boxes.push({
            left: (left / viewport.width) * 100,
            top: ((tx[5] - fontHeight) / viewport.height) * 100,
            width: ((width * (range.end - range.start)) / len / viewport.width) * 100,
            height: ((fontHeight * 1.15) / viewport.height) * 100,
          });
        }
        setMarks({ key: highlightKey, boxes });
      } catch {
        /* no text layer (a scan) or a cancelled load: no marks */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, doc, index, highlightKey]);

  const boxes = marks?.key === highlightKey ? marks.boxes : [];
  const revealed = React.useRef(false);
  React.useEffect(() => {
    if (!revealMark || revealed.current || boxes.length === 0) return;
    revealed.current = true;
    firstMarkRef.current?.scrollIntoView({ block: "center" });
  }, [revealMark, boxes.length]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
      {boxes.map((b, i) => (
        <span
          key={i}
          ref={i === 0 ? firstMarkRef : undefined}
          data-slot="pdf-viewer-mark"
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[2px] bg-highlight mix-blend-multiply"
          style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` }}
        />
      ))}
    </>
  );
}

export { PdfViewer };
