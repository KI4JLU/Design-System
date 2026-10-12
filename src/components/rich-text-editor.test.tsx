import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RichTextEditor } from "./rich-text-editor";
import { TooltipProvider } from "./tooltip";

// jsdom performs no layout: ProseMirror measures the selection (to scroll it
// into view) whenever a toolbar command focuses the document.
beforeAll(() => {
  const emptyRects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
  Range.prototype.getClientRects = emptyRects;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
  (Text.prototype as unknown as { getClientRects: () => DOMRectList }).getClientRects = emptyRects;
  document.elementFromPoint = () => null;
});

function renderEditor(props: React.ComponentProps<typeof RichTextEditor> = {}) {
  return render(
    <TooltipProvider>
      <RichTextEditor aria-label="Inhalt" {...props} />
    </TooltipProvider>,
  );
}

// ORACLE throughout: CommonMark syntax itself — `# ` is a level-1 heading,
// `**x**` bold, `- ` a bullet item. Nothing in this repo produces it.
describe("RichTextEditor", () => {
  it("renders initial markdown as rich text", () => {
    renderEditor({ value: "# Titel\n\nEin **fetter** Satz." });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc.querySelector("h1")).toHaveTextContent("Titel");
    expect(doc.querySelector("strong")).toHaveTextContent("fetter");
  });

  it("reports edits as markdown", async () => {
    const onChange = vi.fn();
    renderEditor({ value: "Hallo", onChange });
    await userEvent.click(screen.getByRole("button", { name: "Überschrift 1" }));
    // Trailing blank lines are the empty paragraph Tiptap keeps after a block.
    await waitFor(() => expect(onChange.mock.lastCall?.[0]).toMatch(/^# Hallo\s*$/));
    await userEvent.click(screen.getByRole("button", { name: "Aufzählung" }));
    await waitFor(() => expect(onChange.mock.lastCall?.[0]).toMatch(/^- /));
  });

  it("marks active formatting on its toolbar button", () => {
    renderEditor({ value: "**fett**", autoFocus: true });
    expect(screen.getByRole("button", { name: "Fett" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Kursiv" })).toHaveAttribute("aria-pressed", "false");
  });

  it("counts words and characters", () => {
    renderEditor({ value: "eins zwei drei" });
    expect(screen.getByText("3 Wörter | 14 Zeichen")).toBeInTheDocument();
  });

  it("renders toolbarEnd and drops its frame when bare", () => {
    const { container } = renderEditor({ toolbarEnd: <button type="button">Laden</button>, bare: true });
    expect(screen.getByRole("toolbar")).toContainElement(screen.getByRole("button", { name: "Laden" }));
    expect(container.querySelector('[data-slot="rich-text-editor"]')).not.toHaveClass("border");
  });

  it("is view-only when readOnly: no formatting controls, not editable", () => {
    renderEditor({ value: "# Titel", readOnly: true });
    expect(screen.queryByRole("button", { name: "Fett" })).toBeNull();
    expect(screen.getByRole("button", { name: "Als Markdown kopieren" })).toBeInTheDocument();
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc).toHaveAttribute("contenteditable", "false");
    expect(doc).toHaveAttribute("aria-readonly", "true");
  });

  it("does not report a change on mount or when readOnly toggles", () => {
    const onChange = vi.fn();
    const { rerender } = renderEditor({ value: "Hallo", onChange, readOnly: true });
    rerender(
      <TooltipProvider>
        <RichTextEditor aria-label="Inhalt" value="Hallo" onChange={onChange} readOnly={false} />
      </TooltipProvider>,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  // ORACLE: CommonMark has no underline; `++` is literal text.
  it("keeps C++ literal (no ++underline++ dialect)", () => {
    renderEditor({ value: "C++ and C++" });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc).toHaveTextContent("C++ and C++");
    expect(doc.querySelector("u")).toBeNull();
  });

  // ORACLE: GFM task-list and image syntax.
  it("renders GFM task lists and images", () => {
    renderEditor({ value: "- [x] erledigt\n- [ ] offen\n\n![Logo](https://example.org/logo.png)" });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    const boxes = doc.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect([...boxes].map((b) => b.checked)).toEqual([true, false]);
    expect(doc.querySelector("img[src]")).toHaveAttribute("alt", "Logo");
  });

  it("shows plain text literally in text format, without formatting controls", () => {
    renderEditor({ value: "# keine Überschrift\n*kein Kursiv*", format: "text", readOnly: true });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc.querySelector("h1, em")).toBeNull();
    expect(doc).toHaveTextContent("# keine Überschrift");
    // One paragraph per line.
    expect(doc.querySelectorAll("p")).toHaveLength(2);
  });

  // ORACLE: the input string itself — text mode must give it back unchanged.
  // Copy writes the same serialization `onChange` reports.
  it("round-trips plain text exactly, blank-line runs included", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const text = "eins\n\n\nzwei\n# kein Titel";
    renderEditor({ value: text, format: "text" });
    expect(screen.getByRole("textbox", { name: "Inhalt" }).querySelectorAll("p")).toHaveLength(5);
    await userEvent.click(screen.getByRole("button", { name: "Als Markdown kopieren" }));
    expect(writeText).toHaveBeenCalledWith(text);
  });

  it("keeps typed markdown syntax literal in text mode", async () => {
    const onChange = vi.fn();
    renderEditor({ value: "", format: "text", onChange });
    await userEvent.click(screen.getByRole("textbox", { name: "Inhalt" }));
    await userEvent.keyboard("# Titel");
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("# Titel"));
    expect(screen.getByRole("textbox", { name: "Inhalt" }).querySelector("h1")).toBeNull();
  });

  it("keeps superscript and subscript from markdown HTML, and writes them back", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderEditor({ value: "x<sup>2</sup> und H<sub>2</sub>O" });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc.querySelector("sup")).toHaveTextContent("2");
    expect(doc.querySelector("sub")).toHaveTextContent("2");
    await userEvent.click(screen.getByRole("button", { name: "Als Markdown kopieren" }));
    expect(writeText.mock.lastCall?.[0]).toContain("x<sup>2</sup> und H<sub>2</sub>O");
  });

  // ORACLE: CommonMark — an image is inline content; text may surround it.
  it("parses an inline image into a valid, editable paragraph", async () => {
    const onChange = vi.fn();
    renderEditor({ value: "vorher ![alt](https://example.org/a.png) nachher", onChange });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc.querySelector("p img[src]")).toHaveAttribute("alt", "alt");
    // Turning the paragraph into a heading re-validates its inline content.
    await userEvent.click(screen.getByRole("button", { name: "Überschrift 1" }));
    await waitFor(() => expect(onChange.mock.lastCall?.[0]).toMatch(/^# vorher !\[alt\]\(https:\/\/example\.org\/a\.png\) nachher/));
  });

  it("keeps a standalone image in a paragraph, so the document stays editable", async () => {
    const onChange = vi.fn();
    renderEditor({ value: "![Logo](https://example.org/logo.png)\n\nText", onChange });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc.querySelector("p > img[src]")).toHaveAttribute("alt", "Logo");
    await userEvent.click(screen.getByRole("button", { name: "Aufzählung" }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.lastCall?.[0]).toContain("![Logo](https://example.org/logo.png)");
  });

  it("indents checkbox list items from the toolbar", async () => {
    const onChange = vi.fn();
    renderEditor({ value: "- [ ] eins\n- [ ] zwei", onChange });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    // jsdom has no layout, so a click cannot place the caret: set the DOM
    // selection inside the second item and tell ProseMirror it changed.
    const second = doc.querySelectorAll("ul[data-type=taskList] > li")[1].querySelector("p")!;
    doc.focus();
    const range = document.createRange();
    range.setStart(second.firstChild!, 1);
    range.collapse(true);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
    const indent = screen.getByRole("button", { name: "Einzug vergrößern" });
    await waitFor(() => expect(indent).toBeEnabled());
    await userEvent.click(indent);
    // ORACLE: GFM nests a task item by indenting it under the previous one.
    await waitFor(() => expect(onChange.mock.lastCall?.[0]).toMatch(/- \[ \] eins\n\s+- \[ \] zwei/));
  });

  it("remounts cleanly when the format changes", () => {
    const { rerender } = renderEditor({ value: "a", format: "text" });
    rerender(
      <TooltipProvider>
        <RichTextEditor aria-label="Inhalt" value="**a**" format="markdown" />
      </TooltipProvider>,
    );
    expect(screen.getByRole("textbox", { name: "Inhalt" }).querySelector("strong")).toHaveTextContent("a");
    expect(screen.getByRole("button", { name: "Fett" })).toBeInTheDocument();
  });

  it("follows a changed placeholder without remounting", () => {
    const { rerender } = renderEditor({ placeholder: "Erst" });
    const para = () => screen.getByRole("textbox", { name: "Inhalt" }).querySelector("p");
    expect(para()).toHaveAttribute("data-placeholder", "Erst");
    rerender(
      <TooltipProvider>
        <RichTextEditor aria-label="Inhalt" placeholder="Dann" />
      </TooltipProvider>,
    );
    expect(para()).toHaveAttribute("data-placeholder", "Dann");
  });

  it("takes label overrides", () => {
    renderEditor({ labels: { bold: "Bold" } });
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });
});
