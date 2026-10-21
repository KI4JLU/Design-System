import type * as React from "react";

/**
 * Shared look of the disclosure buttons in `Reasoning`, `ChainOfThought` and
 * `Task` (AI Elements ports): a full-width text row in the muted text colour
 * that takes the strong text colour on hover. The focus ring and radius are
 * the Button recipe. `group` lets the chevron read the trigger's Radix
 * `data-state`.
 *
 * AI Elements styles these with `text-muted-foreground hover:text-foreground`;
 * re-pointed per COMPONENT_GUIDELINES.md → „shadcn → JLU token mapping".
 */
export const aiDisclosureTriggerClass = [
  "group flex w-full cursor-pointer items-center gap-2 text-left text-sm text-on-surface-variant transition-colors hover:text-on-surface",
  "rounded-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  "disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:shrink-0",
].join(" ");

/** The trailing chevron: points down when closed, up when open; no turn with reduced motion. */
export const aiDisclosureChevronClass =
  "size-4 transition-transform motion-reduce:transition-none group-data-[state=open]:rotate-180";

/**
 * An icon passed as a component (any lucide icon fits). The DS renders it
 * decorative (`aria-hidden`) at 16px, so the text next to it must carry the
 * meaning.
 */
export type AiIconComponent = React.ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;
