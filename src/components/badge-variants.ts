import { cva } from "class-variance-authority";

/**
 * Badge style variants (cva). Two appearances of the same status vocabulary:
 * `filled` — pill with the tone's *-container background (status labels,
 * KPI deltas); `text` — inline icon+text in the tone color, no background
 * (health checks, meta lines). Tones map 1:1 onto the semantic status tokens.
 */
export const badgeVariants = cva("inline-flex items-center whitespace-nowrap [&_svg]:shrink-0", {
  variants: {
    appearance: {
      filled: "gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
      text: "gap-1 text-sm",
    },
    tone: {
      neutral: "",
      primary: "",
      secondary: "",
      success: "",
      warning: "",
      error: "",
      info: "",
    },
  },
  compoundVariants: [
    { appearance: "filled", tone: "neutral", className: "bg-surface-container-high text-on-surface-variant" },
    { appearance: "filled", tone: "primary", className: "bg-primary-container text-on-primary-container" },
    { appearance: "filled", tone: "secondary", className: "bg-secondary-container text-on-secondary-container" },
    { appearance: "filled", tone: "success", className: "bg-success-container text-on-success-container" },
    { appearance: "filled", tone: "warning", className: "bg-warning-container text-on-warning-container" },
    { appearance: "filled", tone: "error", className: "bg-error-container text-on-error-container" },
    { appearance: "filled", tone: "info", className: "bg-info-container text-on-info-container" },
    { appearance: "text", tone: "neutral", className: "text-on-surface-variant" },
    { appearance: "text", tone: "primary", className: "text-primary" },
    { appearance: "text", tone: "secondary", className: "text-secondary" },
    { appearance: "text", tone: "success", className: "text-success" },
    { appearance: "text", tone: "warning", className: "text-warning" },
    { appearance: "text", tone: "error", className: "text-error" },
    { appearance: "text", tone: "info", className: "text-info" },
  ],
  defaultVariants: {
    appearance: "filled",
    tone: "neutral",
  },
});
