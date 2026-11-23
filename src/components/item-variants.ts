import { cva } from "class-variance-authority"

/*
 * Item style variants (cva), from the shadcn/ui registry's `item`
 * (https://ui.shadcn.com/r/styles/new-york-v4/item.json), re-pointed to JLU
 * tokens. Kept beside item.tsx per the repo's variants rule.
 */

export const itemVariants = cva(
  "group/item flex flex-wrap items-center rounded-xl border border-transparent text-sm transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring [a]:transition-colors [a]:hover:bg-surface-container-high",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-outline-variant",
        muted: "bg-surface-container/50",
      },
      size: {
        default: "gap-4 p-4",
        sm: "gap-2.5 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 rounded-action border border-outline-variant bg-surface-container [&_svg:not([class*='size-'])]:size-4",
        image:
          "size-10 overflow-hidden rounded-action [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
