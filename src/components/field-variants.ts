import { cva } from "class-variance-authority";

/** The framed field's resting surface — `fieldVariants` default and `fieldFrameClassName` share it. */
const framedFieldSurface = "rounded-field border border-outline-variant bg-surface-container-lowest";

/** Box and text of every field — `fieldVariants` and `fieldFrameClassName` share it. */
const fieldBox = "w-full text-on-surface";

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
 * Focus: a text field matches `:focus-visible` on every click (the browser
 * expects typing), so by default it shows NO focus cue beyond the caret. From
 * contrast `medium` up, a halo in the sidebar's active-row tint (`primary/10`,
 * as NavItem) appears around it — its width is `--field-focus-halo` (tokens.css:
 * 0px at `normal`, 3px at `medium`/`more`). Never the strong `focus-ring` that
 * keyboard-only controls use. `InputGroup` and the open `Combobox` panel draw
 * the same halo; `data-contrast="more"` still
 * forces the full outline.
 *
 * Invalid state: `default` turns its border red. `inline` and `title` have no
 * border to colour, so `aria-invalid` turns their placeholder red instead — a
 * required field left empty is exactly when the placeholder is what shows.
 */
export const fieldVariants = cva(
  [
    `${fieldBox} outline-none transition-all`,
    "placeholder:text-on-surface-variant",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:ring-error/10",
  ],
  {
    variants: {
      variant: {
        default: [
          `${framedFieldSurface} px-4 py-3`,
          "focus-visible:ring-(length:--field-focus-halo) focus-visible:ring-primary/10",
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

/**
 * The `default` (framed) field drawn on a FRAME that holds a borderless
 * `<input>` among other content — `TokenInput`'s chips + text input.
 * Same surface (`framedFieldSurface`), same tokens per state; only the state
 * source differs: the input inside the frame (`has-[input:…]`) instead of the
 * element itself (`focus-visible:`, `aria-[invalid=true]:`, `disabled:`).
 *
 * The state classes are written out in full rather than derived from the
 * element-level ones on purpose: Tailwind generates CSS only for class names
 * that appear literally in source — here, and in every consumer, which
 * compiles these strings from `dist`. A prefixed name built at runtime would
 * ship without CSS. Change a state token here and in `fieldVariants` together.
 * Padding is the frame's own (it lays out chips), so it is not included.
 */
export const fieldFrameClassName = [
  `${fieldBox} transition-all`,
  framedFieldSurface,
  "has-[input:focus-visible]:ring-(length:--field-focus-halo) has-[input:focus-visible]:ring-primary/10",
  "has-[input[aria-invalid=true]]:border-error has-[input[aria-invalid=true]:focus-visible]:ring-error/10",
  "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60",
].join(" ");
