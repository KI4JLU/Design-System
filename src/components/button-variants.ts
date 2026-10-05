import { cva } from "class-variance-authority";

/**
 * Button style variants (cva). Kept in its own module so files can share it
 * (e.g. to style a Link like a button via `buttonVariants({ variant })`)
 * without tripping the react-refresh "only export components" rule.
 * All colors reference semantic tokens — see docs/DESIGN_SYSTEM.md.
 *
 * Toggle/active-trigger state: `outline` and `ghost` style themselves when
 * the call site sets `aria-pressed` (toggle buttons, e.g. filter chips) or
 * when a Radix trigger carries `data-state="open"` (dropdown/popover
 * triggers) — no extra prop, the ARIA attribute IS the API.
 *
 * Sizes: `default` (36px), `sm` (32px, `text-xs`), `lg`, `icon` (round,
 * padding around the glyph), `icon-sm` (square 32px — the `sm` height — with
 * a 16px glyph, for compact headers such as a dashboard tile's actions).
 * Icon-only buttons need an `aria-label`.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-action font-label-sm text-label-sm whitespace-nowrap transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary shadow-sm hover:brightness-110",
        secondary:
          "bg-secondary-container text-on-secondary-container hover:brightness-105",
        outline: [
          "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high",
          "aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary/10 aria-[pressed=true]:text-primary",
          "data-[state=open]:border-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary",
        ].join(" "),
        ghost: [
          "text-on-surface hover:bg-surface-container-high",
          "aria-[pressed=true]:bg-primary/10 aria-[pressed=true]:text-primary",
          "data-[state=open]:bg-primary/10 data-[state=open]:text-primary",
        ].join(" "),
        destructive: "bg-error text-on-error shadow-sm hover:brightness-110",
        "destructive-outline":
          "border border-error bg-transparent text-error hover:bg-error hover:text-on-error",
        "primary-outline":
          "border border-primary bg-transparent text-primary hover:bg-primary hover:text-on-primary",
        "ghost-destructive":
          "text-error hover:bg-error-container hover:text-on-error-container",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-4",
        icon: "p-2 rounded-full",
        "icon-sm": "size-8 p-0 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
