import { beforeEach, describe, expect, it, vi } from "vitest";

// Oracle: the consumer contract in README ("PDF components: the pdf.js
// worker") — the app hands over the worker URL, the DS applies it to pdf.js,
// and an unconfigured app gets an error naming the missing call. pdf.js is
// mocked to its GlobalWorkerOptions so the test observes exactly what the DS
// sets on it.
const options = vi.hoisted(() => ({ workerSrc: "" }));
vi.mock("pdfjs-dist", () => ({ GlobalWorkerOptions: options }));

describe("loadPdfjs worker setup", () => {
  beforeEach(() => {
    vi.resetModules();
    options.workerSrc = "";
  });

  it("throws and logs, naming setPdfWorkerSrc, when the app configured no worker", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { loadPdfjs } = await import("./pdf-render");
    await expect(loadPdfjs()).rejects.toThrow(/setPdfWorkerSrc/);
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it("applies the URL passed to setPdfWorkerSrc", async () => {
    const { loadPdfjs, setPdfWorkerSrc } = await import("./pdf-render");
    setPdfWorkerSrc("/assets/pdf.worker-abc.mjs");
    await loadPdfjs();
    expect(options.workerSrc).toBe("/assets/pdf.worker-abc.mjs");
  });

  it("accepts a workerSrc the app set on pdf.js directly", async () => {
    options.workerSrc = "/direct.mjs";
    const { loadPdfjs } = await import("./pdf-render");
    await expect(loadPdfjs()).resolves.toBeDefined();
    expect(options.workerSrc).toBe("/direct.mjs");
  });
});
