import { cva } from "class-variance-authority";

/**
 * Inline text highlight (cva). Stays in the line flow — no flex, no fixed
 * height — and repeats its fill on each line of a wrapped run
 * (`box-decoration-clone`).
 *
 * Tokens, by kind:
 * - `mark` (search hit, marked passage): the warning container, the
 *   „highlighter" hue that no row state uses — hover is
 *   `surface-container-high`, selection `secondary-container`, so a hit stays
 *   distinct inside a hovered or selected row. No horizontal padding: toggling
 *   a mark (or `active`) never moves the text, which matters in editors.
 * - `insert`: the success container plus an underline.
 * - `delete`: the error container plus a strike-through.
 *   Underline and strike-through carry the meaning without colour (WCAG 1.4.1).
 *
 * `active` swaps the container for the solid tone (`bg-warning
 * text-on-warning`, …): a large luminance step from the resting fill in both
 * themes, for the current hit or the sentence being edited.
 *
 * Exported for HTML built as strings and editor decorations (Tiptap
 * `Decoration.inline(…, { class })`), which cannot render the component.
 */
export const highlightVariants = cva(
  "rounded box-decoration-clone transition-colors motion-reduce:transition-none",
  {
    variants: {
      kind: {
        mark: "no-underline",
        insert: "px-0.5 underline decoration-1 underline-offset-2",
        delete: "px-0.5 line-through",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      { kind: "mark", active: false, className: "bg-warning-container text-on-warning-container" },
      { kind: "mark", active: true, className: "bg-warning text-on-warning" },
      { kind: "insert", active: false, className: "bg-success-container text-on-success-container" },
      { kind: "insert", active: true, className: "bg-success text-on-success" },
      { kind: "delete", active: false, className: "bg-error-container text-on-error-container" },
      { kind: "delete", active: true, className: "bg-error text-on-error" },
    ],
    defaultVariants: { kind: "mark", active: false },
  },
);
