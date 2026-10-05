import { cva } from "class-variance-authority";

/**
 * Typography for rich text the consumer cannot class element by element:
 * Markdown output, a Tiptap/ProseMirror document. Styles the descendants
 * (h1–h4, p, a, strong, em, lists, blockquote, code, pre, hr, table, img)
 * with tokens and the DS type scale.
 *
 * Exported for editors that own their root element — Tiptap takes the classes
 * through `editorProps.attributes.class`, so it needs the string, not the
 * `Prose` component.
 *
 * Spacing: every block gets a vertical margin; the first and last child of the
 * root lose theirs, so the block sits flush in its container. A `<p>` inside a
 * list item or table cell (Tiptap wraps cell and item text in one) has none.
 */
const base = [
  "text-on-surface wrap-break-word",
  "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
  // Headings
  "[&_:is(h1,h2,h3,h4)]:text-on-surface",
  // Inline
  "[&_a]:rounded [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary-hover",
  "[&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-focus-ring",
  "[&_strong]:font-semibold [&_em]:italic",
  "[&_code]:rounded [&_code]:bg-surface-container-high [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono",
  // Lists
  "[&_ul]:list-disc [&_ol]:list-decimal [&_:is(ul,ol)]:ps-6 [&_li::marker]:text-on-surface-variant",
  "[&_li>p]:my-0",
  // Quote
  "[&_blockquote]:mx-0 [&_blockquote]:border-s-4 [&_blockquote]:border-outline-variant [&_blockquote]:ps-4 [&_blockquote]:text-on-surface-variant",
  "[&_blockquote>:first-child]:mt-0 [&_blockquote>:last-child]:mb-0",
  // Code block: the CodeBlock look (code-surface, identical in both themes); wraps instead of scrolling
  "[&_pre]:whitespace-pre-wrap [&_pre]:wrap-anywhere [&_pre]:rounded-xl [&_pre]:bg-code-surface [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-on-code-surface",
  "[&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
  // Rule
  "[&_hr]:h-0 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-outline-variant",
  // Table: the Table component's look (row rules, muted header)
  "[&_table]:w-full [&_table]:border-collapse",
  "[&_th]:border-b [&_th]:border-outline-variant [&_th]:px-2 [&_th]:py-2 [&_th]:text-start [&_th]:align-bottom [&_th]:font-medium [&_th]:text-on-surface-variant",
  "[&_td]:border-b [&_td]:border-outline-variant [&_td]:px-2 [&_td]:py-2 [&_td]:align-top",
  "[&_:is(th,td)>p]:my-0",
  // Media
  "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_figure]:mx-0",
].join(" ");

export const proseVariants = cva(base, {
  variants: {
    size: {
      /** Reading size: documents, summaries, pages. */
      default: [
        "text-body-base",
        "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:font-headline-md [&_h1]:text-headline-md",
        "[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-headline-md [&_h2]:text-headline-md-mobile",
        "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-headline-md [&_h3]:text-body-base [&_h3]:font-semibold",
        "[&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold",
        "[&_:is(p,ul,ol,blockquote,pre,table,figure)]:my-4 [&_li]:my-1 [&_li>:is(ul,ol)]:my-1",
        "[&_code]:text-sm [&_pre]:text-sm [&_table]:text-sm [&_hr]:my-8",
      ].join(" "),
      /** Dense size: side panels, tiles, chat bubbles. */
      compact: [
        "text-sm",
        "[&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:font-headline-md [&_h1]:text-headline-md-mobile",
        "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:font-headline-md [&_h2]:text-body-base [&_h2]:font-semibold",
        "[&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold",
        "[&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-medium",
        "[&_:is(p,ul,ol,blockquote,pre,table,figure)]:my-2 [&_li]:my-0.5 [&_li>:is(ul,ol)]:my-0.5",
        "[&_code]:text-xs [&_pre]:text-xs [&_table]:text-sm [&_hr]:my-4",
      ].join(" "),
    },
  },
  defaultVariants: { size: "default" },
});
