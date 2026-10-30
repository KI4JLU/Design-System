import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { fieldVariants } from "./field-variants";

/**
 * Shared multiline text field. Mirrors <Input> styling (tokens, focus ring,
 * `aria-invalid` validation optics) via the shared fieldVariants.
 * `variant="inline"` is the borderless in-flow field for composers inside
 * Cards; `variant="editable"` edits a paragraph in place, keeping its look,
 * and grows with its content. Min-height and the resize handle only make sense on the framed
 * default variant, so they are applied conditionally.
 */
export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof fieldVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        fieldVariants({ variant }),
        (variant ?? "default") === "default" && "min-h-24 resize-y",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
