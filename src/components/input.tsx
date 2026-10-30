import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { fieldVariants } from "./field-variants";

/**
 * Shared text input. Replaces the ~12 duplicated
 * `w-full ... border-outline-variant rounded-lg focus:ring-2 ...` snippets.
 * Honors `aria-invalid` for accessible validation styling.
 * `variant="inline"` is the borderless in-flow field for in-row editing
 * (e.g. an editable rule inside a list row); `variant="editable"` edits a
 * piece of text in place, keeping its look — styles live in
 * ./field-variants, shared with Textarea.
 * `leadingIcon` renders a decorative icon inside the field (the search-field
 * pattern: absolutely positioned icon + left padding). The icon carries no
 * meaning for screen readers — the accessible name still comes from a
 * Label/aria-label.
 */
export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof fieldVariants> {
  /** Decorative icon inside the field, leading edge (e.g. `<Search />`). */
  leadingIcon?: React.ReactNode;
  /**
   * Keyboard-shortcut hint inside the field, trailing edge (e.g. a `KbdGroup`
   * with ⌘ K). Decorative: hidden from assistive tech — announce the shortcut
   * with `aria-keyshortcuts` on the field. Shown only while the pointer is
   * over the field and the field does not have focus (the shortcut has
   * nothing left to do then), and dimmed, so it never competes with the
   * placeholder.
   */
  shortcutHint?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, leadingIcon, shortcutHint, ...props }, ref) => {
    const input = (
      <input
        type={type}
        ref={ref}
        className={cn(
          fieldVariants({ variant }),
          // A one-line field follows the app-wide Style like a button
          // (Textarea keeps the field radius — a capsule does not fit a box).
          variant !== "inline" && variant !== "title" && variant !== "editable" && "rounded-[var(--ui-radius-control,var(--radius-field))]",
          leadingIcon && "pl-10",
          shortcutHint && "pr-16",
          className,
        )}
        {...props}
      />
    );
    if (!leadingIcon && !shortcutHint) return input;
    return (
      <span className="group/input relative block w-full">
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant [&_svg]:h-4 [&_svg]:w-4"
          >
            {leadingIcon}
          </span>
        )}
        {input}
        {shortcutHint && (
          <span
            aria-hidden="true"
            data-slot="input-shortcut-hint"
            className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 opacity-0 transition-opacity motion-reduce:transition-none group-[:hover:not(:focus-within)]/input:opacity-60"
          >
            {shortcutHint}
          </span>
        )}
      </span>
    );
  },
);
Input.displayName = "Input";

export { Input };
