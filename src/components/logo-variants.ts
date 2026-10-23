import { cva } from "class-variance-authority";

/**
 * Logo — the platform wordmark. One font-size dial per size; the badge
 * scales with it via em-based size, padding and radius, so every size keeps
 * the same proportions: the badge text a fifth smaller than the wordmark, a
 * soft rounded rectangle (radius ≈ ⅓ of its height).
 */
export const logoVariants = cva(
  "inline-flex items-center gap-[0.35em] whitespace-nowrap font-headline-md font-semibold leading-none tracking-[-0.01em] text-brand-wordmark",
  {
    variants: {
      size: {
        sm: "text-body-base",
        default: "text-headline-md-mobile",
        lg: "text-headline-md",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);
