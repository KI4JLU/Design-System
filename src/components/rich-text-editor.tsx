import * as React from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { CharacterCount, Placeholder, UndoRedo } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import type { JSONContent } from "@tiptap/core";
import { Fragment, Slice, type Schema } from "@tiptap/pm/model";
import { Markdown } from "@tiptap/markdown";
import {
  Bold, Check, Code, Copy, Heading1, Heading2, Heading3, IndentDecrease, IndentIncrease,
  Italic, List, ListOrdered, Maximize2, Minimize2, Redo2, SquareCode, Strikethrough, Table,
  TextQuote, Undo2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * Rich-text editor that reads and writes **markdown**: the official Tiptap
 * React packages (`@tiptap/react`, `starter-kit`, `extension-table`,
 * `extensions`, `markdown` — all MIT) with a toolbar built from this
 * library's `Button` and `Tooltip`, on its tokens.
 *
 * LOOKS LIKE `PdfViewer` on purpose — the same 48px toolbar row and the
 * document as a white page on the `surface-container-low` canvas — so a text
 * source and a PDF open into the same kind of window.
 *
 * Toolbar: headings 1–3 · bold, italic, strikethrough · quote · bullet and
 * numbered list, outdent, indent · inline code, code block · table, then at
 * the end: word/character count · undo, redo · `toolbarEnd` (like
 * `PdfViewer`'s, e.g. a download link) · fullscreen (the browser's Fullscreen
 * API, so it works inside a transformed dialog) · copy as markdown.
 *
 * Markdown support: CommonMark plus GFM tables, task lists (`- [x]`) and
 * images, plus `<sup>`/`<sub>`. Underline's nonstandard `++…++` syntax is off,
 * so `C++` stays text. `format="text"` loads and reports plain text instead:
 * a paragraphs-only schema (no marks, input rules, shortcuts or markdown), one
 * paragraph per line, so the text round-trips byte for byte.
 *
 * `readOnly` shows the document with count, `toolbarEnd`, fullscreen and copy
 * only. `bare` drops the editor's own border and radius when its container
 * already draws the frame (a dialog).
 *
 * Uncontrolled after mount: `value` is the initial markdown; every edit
 * reports the whole document as markdown through `onChange`. Remount (a new
 * `key`) to load a different document.
 */
export interface RichTextEditorLabels {
  toolbar: string;
  heading1: string;
  heading2: string;
  heading3: string;
  bold: string;
  italic: string;
  strike: string;
  quote: string;
  bulletList: string;
  orderedList: string;
  outdent: string;
  indent: string;
  code: string;
  codeBlock: string;
  table: string;
  undo: string;
  redo: string;
  fullscreen: string;
  exitFullscreen: string;
  copy: string;
  copied: string;
  /** `{words}` and `{characters}` are replaced. */
  count: string;
}

const DEFAULT_LABELS: RichTextEditorLabels = {
  toolbar: "Formatierung",
  heading1: "Überschrift 1",
  heading2: "Überschrift 2",
  heading3: "Überschrift 3",
  bold: "Fett",
  italic: "Kursiv",
  strike: "Durchgestrichen",
  quote: "Zitat",
  bulletList: "Aufzählung",
  orderedList: "Nummerierte Liste",
  outdent: "Einzug verkleinern",
  indent: "Einzug vergrößern",
  code: "Code",
  codeBlock: "Codeblock",
  table: "Tabelle einfügen",
  undo: "Rückgängig",
  redo: "Wiederholen",
  fullscreen: "Vollbild",
  exitFullscreen: "Vollbild beenden",
  copy: "Als Markdown kopieren",
  copied: "Kopiert",
  count: "{words} Wörter | {characters} Zeichen",
};

export interface RichTextEditorProps {
  /** Initial content, as markdown. */
  value?: string;
  /** The whole document as markdown, after every edit. */
  onChange?: (markdown: string) => void;
  placeholder?: string;
  /** Accessible name of the editing area. */
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  autoFocus?: boolean;
  /** Overrides for the German default labels. */
  labels?: Partial<RichTextEditorLabels>;
  /** `markdown` (default) or `text`: plain text, shown literally, reported as text. */
  format?: "markdown" | "text";
  /** View only: no formatting controls, the document is not editable. */
  readOnly?: boolean;
  /** Extra controls at the end of the toolbar, before fullscreen (like `PdfViewer`). */
  toolbarEnd?: React.ReactNode;
  /** No border or radius of its own — the container frames it (a dialog). */
  bare?: boolean;
  className?: string;
}

/** Styles for the editable document. Tiptap renders plain HTML elements, unstyled. */
const proseClass = cn(
  "flex-1 px-12 py-10 text-body-base text-on-surface outline-none",
  "[&_p]:my-3 [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li_p]:my-1",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-outline-variant [&_blockquote]:pl-4 [&_blockquote]:text-on-surface-variant",
  "[&_code]:rounded [&_code]:bg-surface-container-high [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-container-high [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-outline-variant [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-outline-variant [&_th]:bg-surface-container [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_td_p]:my-0 [&_th_p]:my-0",
  "[&_.selectedCell]:bg-primary/10",
  "[&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full",
  // TaskItem's node view renders `<li data-checked>` (no data-type), so target the list's children.
  "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 [&_ul[data-type=taskList]>li]:flex [&_ul[data-type=taskList]>li]:items-start [&_ul[data-type=taskList]>li]:gap-2 [&_ul[data-type=taskList]>li>label]:mt-1.5 [&_ul[data-type=taskList]>li>div]:flex-1",
  "[&_pre.plain-text]:whitespace-pre-wrap",
  // Placeholder (Tiptap's Placeholder extension marks the empty first paragraph).
  "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-on-surface-variant [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
);

/*
 * Superscript and subscript have no markdown syntax: they parse from inline
 * `<sup>`/`<sub>` HTML (CommonMark allows it) and are written back the same
 * way, so a round trip keeps `x<sup>2</sup>` instead of turning it into `x2`.
 */
const MarkdownSuperscript = Superscript.extend({
  renderMarkdown: (node: JSONContent, h: { renderChildren: (n: JSONContent) => string }) =>
    `<sup>${h.renderChildren(node)}</sup>`,
});
const MarkdownSubscript = Subscript.extend({
  renderMarkdown: (node: JSONContent, h: { renderChildren: (n: JSONContent) => string }) =>
    `<sub>${h.renderChildren(node)}</sub>`,
});

/*
 * Tiptap's paragraph parser unwraps a paragraph holding only an image into a
 * bare image node — valid for block images, but images here are inline (so
 * `text ![a](b) text` works), and a top-level inline node breaks the schema.
 * Keep the paragraph around a standalone image; defer everything else.
 */
const MarkdownParagraph = Paragraph.extend({
  parseMarkdown(token, helpers) {
    const tokens = token.tokens ?? [];
    if (tokens.length === 1 && tokens[0].type === "image") {
      // The image token parses as a node (as the original does), then gets its paragraph back.
      return helpers.createNode("paragraph", undefined, helpers.parseChildren(tokens));
    }
    return this.parent!(token, helpers);
  },
});

/** Plain text → a slice of one paragraph per line, the text mode's own representation. */
function textToSlice(text: string, schema: Schema): Slice {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const paragraphs = lines.map((line) => schema.nodes.paragraph.create(null, line ? schema.text(line) : null));
  return Slice.maxOpen(Fragment.from(paragraphs));
}

/** The fullscreen element while fullscreen is on, so tooltips render inside it. */
const PortalContainer = React.createContext<HTMLElement | null>(null);

/**
 * Plain text as a document: one paragraph per line, empty lines included, so
 * `getText({ blockSeparator: "\n" })` gives back exactly the text that came in
 * (runs of blank lines too).
 */
function textToDoc(text: string): JSONContent {
  return {
    type: "doc",
    content: text.replace(/\r\n?/g, "\n").split("\n").map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}

function ToolbarButton({
  label, active, disabled, onClick, children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          // Keep the selection in the document while clicking the toolbar.
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent container={React.useContext(PortalContainer)}>{label}</TooltipContent>
    </Tooltip>
  );
}

function Separator() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-outline-variant" />;
}

/** The list item type at the selection: `taskItem` inside a checkbox list, else `listItem`. */
function listItemType(editor: Editor | null): "taskItem" | "listItem" {
  return editor?.isActive("taskItem") ? "taskItem" : "listItem";
}

function useToolbarState(editor: Editor | null, isText: boolean) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e?.isActive("heading", { level: 1 }) ?? false,
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      strike: e?.isActive("strike") ?? false,
      quote: e?.isActive("blockquote") ?? false,
      bulletList: e?.isActive("bulletList") ?? false,
      orderedList: e?.isActive("orderedList") ?? false,
      code: e?.isActive("code") ?? false,
      codeBlock: e?.isActive("codeBlock") ?? false,
      // Text mode's schema has no lists; checkbox lists indent `taskItem`s.
      canSink: !isText && (e?.can().sinkListItem(listItemType(e)) ?? false),
      canLift: !isText && (e?.can().liftListItem(listItemType(e)) ?? false),
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
      words: e?.storage.characterCount.words() ?? 0,
      characters: e?.storage.characterCount.characters() ?? 0,
    }),
  });
}

function RichTextEditorInner({
  value = "",
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  autoFocus,
  labels: labelOverrides,
  format = "markdown",
  readOnly = false,
  toolbarEnd,
  bare = false,
  className,
}: RichTextEditorProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const rootRef = React.useRef<HTMLDivElement>(null);
  // The element in fullscreen (this editor's root) or null — state, not a ref
  // read, because tooltips are portalled into it while it is active.
  const [fullscreenEl, setFullscreenEl] = React.useState<HTMLElement | null>(null);
  const fullscreen = fullscreenEl !== null;
  const [copied, setCopied] = React.useState(false);
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const isText = format === "text";
  const serialize = (e: Editor) => (isText ? e.getText({ blockSeparator: "\n" }) : e.getMarkdown());

  const editor = useEditor({
    extensions: [
      ...(isText
        // Plain text: a schema of paragraphs and text only — no marks, no input
        // rules, no shortcuts, so `# `, `*x*` and pasted formatting stay literal.
        ? [Document, Paragraph, Text, UndoRedo]
        : [
            // Underline's `++…++` is not markdown: off, or `C++ and C++` loses its pluses.
            StarterKit.configure({ underline: false, paragraph: false }),
            MarkdownParagraph,
            TableKit.configure({ table: { resizable: false } }),
            TaskList,
            TaskItem.configure({ nested: true }),
            // Inline, so `text ![alt](src) text` is a valid paragraph and stays editable.
            // TODO: a linked image `[![a](src)](href)` loses its link — Tiptap's
            // markdown parser puts no link mark on image nodes. Not yet handled.
            Image.configure({ inline: true }),
            MarkdownSuperscript,
            MarkdownSubscript,
            Markdown,
          ]),
      CharacterCount,
      // The plugin keeps its own copy of its options, so the text is read off
      // the editor element, where the effect below keeps it current.
      Placeholder.configure({ placeholder: ({ editor: e }) => e.view.dom.dataset.placeholderText ?? "" }),
    ],
    ...(isText
      ? { content: textToDoc(value) }
      : { content: value, contentType: "markdown" as const }),
    editable: !readOnly,
    autofocus: autoFocus && !readOnly ? "end" : false,
    immediatelyRender: true,
    editorProps: {
      // Text mode keeps one paragraph per line through the native clipboard too:
      // paste splits plain text into lines, copy joins paragraphs with "\n".
      ...(isText
        ? {
            clipboardTextSerializer: (slice: Slice) => slice.content.textBetween(0, slice.content.size, "\n"),
            handlePaste: (view, event) => {
              const text = event.clipboardData?.getData("text/plain");
              if (text == null) return false;
              view.dispatch(view.state.tr.replaceSelection(textToSlice(text, view.state.schema)).scrollIntoView());
              return true;
            },
          }
        : {}),
      attributes: {
        class: proseClass,
        role: "textbox",
        "data-placeholder-text": placeholder ?? "",
        "aria-multiline": "true",
        ...(readOnly ? { "aria-readonly": "true" } : {}),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        ...(ariaInvalid ? { "aria-invalid": "true" } : {}),
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current?.(serialize(e)),
  });

  // `false`: switching editability is not an edit — no `onChange`.
  React.useEffect(() => {
    editor?.setEditable(!readOnly, false);
  }, [editor, readOnly]);

  // A changed `placeholder` without a remount (`useEditor` does not reinstall
  // extensions): update the element's attribute, then redraw the decoration with a
  // meta-only transaction — no document change, so no `onChange`.
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const dom = editor.view.dom;
    if (dom.dataset.placeholderText === (placeholder ?? "")) return;
    dom.setAttribute("data-placeholder-text", placeholder ?? "");
    editor.view.dispatch(editor.state.tr.setMeta("placeholder", placeholder));
  }, [editor, placeholder]);

  const state = useToolbarState(editor, isText);

  React.useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreenEl(document.fullscreenElement === rootRef.current ? rootRef.current : null);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  };

  const copyMarkdown = async () => {
    if (!editor) return;
    await navigator.clipboard.writeText(serialize(editor));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const chain = () => editor!.chain().focus();
  const iconClass = "size-4";

  return (
    <PortalContainer.Provider value={fullscreenEl}>
    <div
      ref={rootRef}
      data-slot="rich-text-editor"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-surface-container-low text-on-surface",
        !bare && !fullscreen && "rounded-xl border border-outline-variant",
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label={labels.toolbar}
        // Scrolls sideways when narrower than its controls, without showing a
        // scrollbar track under the 48px row (PdfViewer's toolbar has none).
        // Inline style: an app's unlayered global scrollbar rules would beat a utility.
        className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-outline-variant bg-surface-container-lowest px-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {!readOnly && !isText && (
          <>
            <ToolbarButton label={labels.heading1} active={state?.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
              <Heading1 aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <ToolbarButton label={labels.heading2} active={state?.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
              <Heading2 aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <ToolbarButton label={labels.heading3} active={state?.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
              <Heading3 aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <Separator />
            <ToolbarButton label={labels.bold} active={state?.bold} onClick={() => chain().toggleBold().run()}>
              <Bold aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <ToolbarButton label={labels.italic} active={state?.italic} onClick={() => chain().toggleItalic().run()}>
              <Italic aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <ToolbarButton label={labels.strike} active={state?.strike} onClick={() => chain().toggleStrike().run()}>
              <Strikethrough aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <Separator />
            <ToolbarButton label={labels.quote} active={state?.quote} onClick={() => chain().toggleBlockquote().run()}>
              <TextQuote aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <Separator />
            <ToolbarButton label={labels.bulletList} active={state?.bulletList} onClick={() => chain().toggleBulletList().run()}>
              <List aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <ToolbarButton label={labels.orderedList} active={state?.orderedList} onClick={() => chain().toggleOrderedList().run()}>
              <ListOrdered aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <ToolbarButton label={labels.outdent} disabled={!state?.canLift} onClick={() => chain().liftListItem(listItemType(editor)).run()}>
              <IndentDecrease aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <ToolbarButton label={labels.indent} disabled={!state?.canSink} onClick={() => chain().sinkListItem(listItemType(editor)).run()}>
              <IndentIncrease aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <Separator />
            <ToolbarButton label={labels.code} active={state?.code} onClick={() => chain().toggleCode().run()}>
              <Code aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <ToolbarButton label={labels.codeBlock} active={state?.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
              <SquareCode aria-hidden="true" className={iconClass} />
            </ToolbarButton>
            <Separator />
            <ToolbarButton label={labels.table} onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              <Table aria-hidden="true" className={iconClass} />
            </ToolbarButton>
          </>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <span className="px-2 text-sm whitespace-nowrap tabular-nums text-on-surface-variant" aria-live="polite">
            {labels.count
              .replace("{words}", String(state?.words ?? 0))
              .replace("{characters}", String(state?.characters ?? 0))}
          </span>
          {!readOnly && (
            <>
              <Separator />
              <ToolbarButton label={labels.undo} disabled={!state?.canUndo} onClick={() => chain().undo().run()}>
                <Undo2 aria-hidden="true" className={iconClass} />
              </ToolbarButton>
              <ToolbarButton label={labels.redo} disabled={!state?.canRedo} onClick={() => chain().redo().run()}>
                <Redo2 aria-hidden="true" className={iconClass} />
              </ToolbarButton>
            </>
          )}
          <Separator />
          {toolbarEnd}
          <ToolbarButton label={copied ? labels.copied : labels.copy} onClick={() => void copyMarkdown()}>
            {copied ? <Check aria-hidden="true" className={iconClass} /> : <Copy aria-hidden="true" className={iconClass} />}
          </ToolbarButton>
          <ToolbarButton label={fullscreen ? labels.exitFullscreen : labels.fullscreen} onClick={toggleFullscreen}>
            {fullscreen
              ? <Minimize2 aria-hidden="true" className={iconClass} />
              : <Maximize2 aria-hidden="true" className={iconClass} />}
          </ToolbarButton>
        </div>
      </div>

      {/* The page on the canvas: the same 16px/24px spacing as PdfViewer's pages. */}
      <div data-slot="rich-text-editor-canvas" className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <div className="mx-auto flex min-h-full max-w-5xl flex-col bg-surface-container-lowest shadow-card">
          <EditorContent editor={editor} className="flex flex-1 flex-col" />
        </div>
      </div>
    </div>
    </PortalContainer.Provider>
  );
}

/**
 * `format` picks the editor's schema, which Tiptap cannot swap on a live
 * editor: a different format is a different editor, so it remounts.
 */
function RichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditorInner key={props.format ?? "markdown"} {...props} />;
}

export { RichTextEditor };
