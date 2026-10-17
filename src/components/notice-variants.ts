import { cva } from "class-variance-authority";

/**
 * Notice style variants (cva). A tinted, borderless box: `tone` picks the
 * surface/text token pair — `neutral` the plain container surface, `info` and
 * `warning` the status containers (the same pairs `Badge`'s filled tones use).
 * Radius follows the app-wide Style (`--ui-radius-box`: 12px rounded, 24px
 * pill — a multi-line surface, never a capsule).
 */
export const noticeVariants = cva(
  "flex items-start gap-2.5 rounded-[var(--ui-radius-box)] px-3.5 py-3 text-sm",
  {
    variants: {
      tone: {
        neutral: "bg-surface-container text-on-surface",
        info: "bg-info-container text-on-info-container",
        warning: "bg-warning-container text-on-warning-container",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/** The leading icon slot's colour per tone (status tones inherit their text). */
export const noticeIconTones = {
  neutral: "text-on-surface-variant",
  info: "",
  warning: "",
} as const;
