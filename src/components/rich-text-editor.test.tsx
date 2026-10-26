import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { marked, type Token, type Tokens } from "marked";
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

  it("leaves the count to the caller with count=\"none\" and reports it", async () => {
    const onCountChange = vi.fn();
    renderEditor({ value: "eins zwei drei", count: "none", onCountChange });
    expect(screen.queryByText("3 Wörter | 14 Zeichen")).not.toBeInTheDocument();
    await waitFor(() => expect(onCountChange).toHaveBeenLastCalledWith({ words: 3, characters: 14 }));
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

  // ORACLE: CommonMark link-around-image syntax, and an ordinary link next to it.
  it("keeps the link around a linked image through a round trip", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderEditor({ value: "Siehe [![Logo](https://example.org/logo.png)](https://example.org) und [Text](https://a.org)." });
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc.querySelector("img[src]")).toHaveAttribute("data-href", "https://example.org");
    await userEvent.click(screen.getByRole("button", { name: "Als Markdown kopieren" }));
    const md = writeText.mock.lastCall?.[0] as string;
    expect(md).toContain("[![Logo](https://example.org/logo.png)](https://example.org)");
    expect(md).toContain("[Text](https://a.org)");
  });

  /*
   * ORACLE for the next three: `marked`, the CommonMark lexer Tiptap's markdown
   * manager loads with — i.e. what the next load of the saved text will see.
   * It reads our output; nothing of ours produces its verdict.
   */
  async function copiedLinks(value: string) {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderEditor({ value });
    await userEvent.click(screen.getByRole("button", { name: "Als Markdown kopieren" }));
    const links: { href: string; kids: string[] }[] = [];
    const walk = (tokens: Token[]) => {
      for (const t of tokens) {
        if (t.type === "link") links.push({ href: (t as Tokens.Link).href, kids: (t as Tokens.Link).tokens.map((k) => k.type) });
        if ("tokens" in t && t.tokens) walk(t.tokens);
      }
    };
    walk(marked.lexer(writeText.mock.lastCall?.[0] as string));
    return links;
  }

  it("keeps the link on an image that shares its link with text", async () => {
    const links = await copiedLinks("[![Logo](https://example.org/logo.png) Startseite](https://example.org)");
    expect(screen.getByRole("textbox", { name: "Inhalt" }).querySelector("img[src]")).toHaveAttribute("data-href", "https://example.org");
    expect(links).toContainEqual({ href: "https://example.org", kids: ["image"] });
    expect(links.some((l) => l.href === "https://example.org" && l.kids.includes("text"))).toBe(true);
  });

  it("writes a linked image's destination so it parses back (spaces, parentheses)", async () => {
    const links = await copiedLinks("[![a](https://example.org/i.png)](<https://example.org/a b>) [![c](https://example.org/j.png)](<https://example.org/x(1>)");
    expect(links).toEqual([
      { href: "https://example.org/a b", kids: ["image"] },
      { href: "https://example.org/x(1", kids: ["image"] },
    ]);
  });

  it("writes a text link's destination so it parses back (spaces, parentheses)", async () => {
    const links = await copiedLinks("[eins](<https://example.org/a b>) und [zwei](<https://example.org/x(1>) und [drei](https://example.org/ok)");
    expect(links).toEqual([
      { href: "https://example.org/a b", kids: ["text"] },
      { href: "https://example.org/x(1", kids: ["text"] },
      { href: "https://example.org/ok", kids: ["text"] },
    ]);
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

  // ORACLE: WAI-ARIA — an invalid field carries aria-invalid="true" and names
  // its error message via aria-describedby, on the element with the textbox role.
  it("points the textbox at its error message", () => {
    render(
      <TooltipProvider>
        <RichTextEditor aria-label="Inhalt" aria-invalid aria-describedby="err" />
        <span id="err">Inhalt ist erforderlich</span>
      </TooltipProvider>,
    );
    const doc = screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc).toHaveAttribute("aria-invalid", "true");
    expect(doc).toHaveAccessibleDescription("Inhalt ist erforderlich");
  });

  it("follows a changed invalid state without remounting", () => {
    const view = (invalid: boolean) => (
      <TooltipProvider>
        <RichTextEditor aria-label="Inhalt" aria-invalid={invalid} aria-describedby={invalid ? "err" : undefined} />
        <span id="err">Inhalt ist erforderlich</span>
      </TooltipProvider>
    );
    const { rerender } = render(view(false));
    const doc = () => screen.getByRole("textbox", { name: "Inhalt" });
    expect(doc()).not.toHaveAttribute("aria-invalid");
    rerender(view(true));
    expect(doc()).toHaveAttribute("aria-invalid", "true");
    expect(doc()).toHaveAccessibleDescription("Inhalt ist erforderlich");
    rerender(view(false));
    expect(doc()).not.toHaveAttribute("aria-invalid");
    expect(doc()).not.toHaveAttribute("aria-describedby");
  });

  it("takes label overrides", () => {
    renderEditor({ labels: { bold: "Bold" } });
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });
});
