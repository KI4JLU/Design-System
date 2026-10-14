/**
 * pdf.js access shared by `PdfThumbnail` (canvas in the tree) and consumers
 * that want a first-page bitmap ahead of time (`renderPdfFirstPage`).
 *
 * pdf.js is loaded lazily on first use, so consumers that never touch a PDF
 * do not pay for it. `pdfjs-dist` is a peer dependency and its worker is the
 * consuming app's job: the app passes the worker URL from its own build to
 * `setPdfWorkerSrc`, so the worker is a same-origin file a strict CSP allows.
 * Bundling it here does not work — library mode inlines it as a data: URL.
 */
let workerSrc: string | null = null;

/**
 * Sets the pdf.js worker URL, once at app start:
 * `setPdfWorkerSrc(workerUrl)` with
 * `import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"`.
 * Takes a string so the app's entry chunk does not import pdf.js itself.
 */
export function setPdfWorkerSrc(src: string): void {
  workerSrc = src;
}

export async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const error = new Error(
      "@ki4jlu/design-system: pdf.js worker not configured. Call " +
        "setPdfWorkerSrc(workerUrl) once at app start, with " +
        "`import workerUrl from \"pdfjs-dist/build/pdf.worker.min.mjs?url\"` (see README).",
    );
    // Logged here because the components and hooks catch it (onError is
    // optional, thumbnails fall back to a glyph) — a setup bug must not be silent.
    console.error(error);
    throw error;
  }
  return pdfjs;
}

type PdfjsModule = Awaited<ReturnType<typeof loadPdfjs>>;
let sharedWorker: InstanceType<PdfjsModule["PDFWorker"]> | null = null;

/**
 * ONE pdf.js worker for every document this package opens. Without it,
 * `getDocument` spawns a fresh worker per call and `destroy()` terminates it —
 * a sources list pre-rendering 40 previews started 40 worker threads (in dev
 * each also loads Vite's HMR client: 40× "[vite] connected"). With a shared
 * worker passed in, destroying a document leaves the worker running.
 */
export async function getPdfDocument(src: string) {
  const pdfjs = await loadPdfjs();
  if (!sharedWorker || sharedWorker.destroyed) {
    // Errors only: malformed embedded fonts make the worker log a "TT: undefined
    // function" warning per glyph program it repairs — noise, not failures. The
    // worker takes its log level when it is created, not per document.
    sharedWorker = new pdfjs.PDFWorker({ verbosity: pdfjs.VerbosityLevel.ERRORS });
  }
  return pdfjs.getDocument({ url: src, worker: sharedWorker, verbosity: pdfjs.VerbosityLevel.ERRORS });
}

/** Kick off the pdf.js import (and worker fetch) ahead of first use. */
export function preloadPdfjs(): void {
  void loadPdfjs().catch(() => undefined);
}

export interface RenderPdfFirstPageOptions {
  /** Device pixel ratio to render at; defaults to the window's. */
  dpr?: number;
  /** `image/png` (default) or `image/jpeg`. */
  type?: "image/png" | "image/jpeg";
}

/**
 * Renders page 1 of a PDF, fitted into `width`×`height` CSS px, to a data URL.
 * Off-screen — nothing is mounted — so a list can pre-render its thumbnails
 * and show them as plain <img>s the instant a preview opens, instead of
 * decoding the PDF while the user waits.
 */
export async function renderPdfFirstPage(
  src: string,
  width: number,
  height: number,
  { dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, type = "image/png" }: RenderPdfFirstPageOptions = {},
): Promise<string> {
  const task = await getPdfDocument(src);
  try {
    const loaded = await task.promise;
    const page = await loaded.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(width / base.width, height / base.height);
    const viewport = page.getViewport({ scale: scale * dpr });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("renderPdfFirstPage: no 2d context");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return canvas.toDataURL(type);
  } finally {
    void task.destroy();
  }
}
