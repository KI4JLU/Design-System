import { cva } from "class-variance-authority";

/**
 * Field style variants (cva), shared by Input and Textarea so both fields
 * speak the same vocabulary. Kept in its own module (see button-variants.ts)
 * so files can share it without tripping react-refresh's
 * "only export components" rule.
 *
 * `default` — the framed form field (border, surface, focus ring).
 * `inline` — borderless in-flow field for composers inside Cards and in-row
 * editing (the surrounding row/Card provides the frame, so the field itself
 * carries no border, padding, or focus ring).
 * `title` — `inline` at heading size: an editable title in a header row
 * (e.g. a dialog's 56px header), typeset like the `DialogTitle` it stands in
 * for — `text-base font-semibold`, one line, truncated.
 *
 * Invalid state: `default` turns its border red. `inline` and `title` have no
 * border to colour, so `aria-invalid` turns their placeholder red instead — a
 * required field left empty is exactly when the placeholder is what shows.
 */
export const fieldVariants = cva(
  [
    "w-full text-on-surface outline-none transition-all",
    "placeholder:text-on-surface-variant",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:ring-error",
  ],
  {
    variants: {
      variant: {
        default: [
          "rounded-field border border-outline-variant bg-surface-container-lowest px-4 py-3",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-focus-ring",
        ],
        inline:
          "rounded-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 aria-[invalid=true]:placeholder:text-error",
        title:
          "truncate rounded-none border-0 bg-transparent p-0 text-base font-semibold focus-visible:ring-0 aria-[invalid=true]:placeholder:text-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
