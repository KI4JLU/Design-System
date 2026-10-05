import { cva } from "class-variance-authority";

/**
 * ColorSwatch sizes. `sm` (12px) sits beside body text in a list or legend,
 * the size of `AccentSwatch`; `default` (20px) is the speaker dot beside a
 * name in a transcript. `forced-color-adjust-none` keeps the colour in Windows
 * high-contrast mode, which would otherwise paint the dot in the page colour.
 */
export const colorSwatchVariants = cva(
  "inline-block shrink-0 rounded-full forced-color-adjust-none",
  {
    variants: {
      size: {
        sm: "size-3",
        default: "size-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);
