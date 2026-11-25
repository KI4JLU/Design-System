import { cva } from "class-variance-authority";

/**
 * AuthLayout — the width of the centered column (logo + card + footer).
 *
 * This is a prop rather than a class at the call site because it *has* to be:
 * the constraint sits on the inner column, while a consumer's `className`
 * merges into the root element, so there was no path from any call site to it.
 * JustRAG's legal pages silently went 720px → 448px when they adopted this
 * template, and the width was rejected at visual QA.
 *
 * Two named steps, both from Tailwind's own scale — no arbitrary value, so the
 * system stays on its own steps:
 *
 * - `default` — `max-w-md` (28rem / 448px). Today's value, unchanged, so no
 *   existing consumer moves. It is the width of a *login form*: a handful of
 *   short fields, which a wider column only spreads out.
 * - `prose` — `max-w-2xl` (42rem / 672px). Long-form page copy inside the
 *   card: terms of use, accessibility statement, privacy statement.
 *
 * Why `prose` is `max-w-2xl` and not `max-w-3xl` (the width it replaces, 720px,
 * lies between the two steps):
 *
 * 1. `max-w-2xl` is the step this system has **already** named for a reading
 *    column — `containerVariants` `size="reading"` is the same 672px — so a wide
 *    AuthLayout matches a `reading` container instead of introducing a second,
 *    competing reading width.
 * 2. WCAG 1.4.8 (AAA) caps a line at 80 characters. Minus the Card's `p-6`
 *    (48px on this axis) the text measure is 624px at `2xl` against 720px at
 *    `3xl`, so `3xl` is the step that breaks the cap.
 *
 * `prose` is therefore deliberately 48px narrower than the 720px those pages
 * had before, and 224px wider than the 448px that was rejected.
 *
 * TODO: the character counts those two measures work out to (~78 at `2xl` vs
 * ~90 at `3xl`, at the 16px `--text-body-base` in Inter) are estimated from an
 * average glyph advance of ~0.5em and are **not yet confirmed** by measurement.
 * The choice rests on the direction — `2xl` under the 80-character cap, `3xl`
 * over it — not on the exact figures.
 */
export const authLayoutVariants = cva("w-full", {
  variants: {
    width: {
      default: "max-w-md",
      prose: "max-w-2xl",
    },
  },
  defaultVariants: {
    width: "default",
  },
});
