import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { highlightVariants } from "./highlight-variants";

type HighlightKind = NonNullable<VariantProps<typeof highlightVariants>["kind"]>;

const TAGS = { mark: "mark", insert: "ins", delete: "del" } as const;

const DEFAULT_LABELS: Record<HighlightKind, string> = {
  mark: "",
  insert: "eingefügt:",
  delete: "gelöscht:",
};

/**
 * Inline text mark that stays in the line flow: a search hit, a marked
 * passage, or an insertion/deletion in a „show changes" diff. Renders
 * `<mark>`, `<ins>` or `<del>` by `kind`; `Badge` is a chip and breaks
 * wrapping, this does not.
 *
 * Screen readers mostly do not announce `<ins>`/`<del>`, so those kinds start
 * with a visually hidden `label` („eingefügt:" / „gelöscht:", as the
 * translator's diff does). Pass `label=""` to drop it, or another string to
 * translate it. `mark` has no label by default: a search hit reads as plain
 * text.
 *
 * `active` is the stronger fill for the current hit or the sentence being
 * edited. `asChild` renders the single child element instead (the label is
 * placed inside it). For HTML strings and editor decorations use
 * `highlightVariants` — see there for the token choice.
 */
export interface HighlightProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof highlightVariants> {
  /** Visually hidden prefix. Default: „eingefügt:" / „gelöscht:" / none for `mark`. */
  label?: string;
  /** Render the single child element instead of `mark`/`ins`/`del`. */
  asChild?: boolean;
}

const Highlight = React.forwardRef<HTMLElement, HighlightProps>(
  (
    { className, kind, active, label, asChild = false, children, ...props },
    ref,
  ) => {
    const resolved: HighlightKind = kind ?? "mark";
    const Comp = (asChild ? Slot : TAGS[resolved]) as React.ElementType;
    const prefix = label ?? DEFAULT_LABELS[resolved];
    return (
      <Comp
        ref={ref}
        className={cn(highlightVariants({ kind: resolved, active }), className)}
        {...props}
      >
        {prefix ? <span className="sr-only">{`${prefix} `}</span> : null}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  },
);
Highlight.displayName = "Highlight";

export { Highlight };
