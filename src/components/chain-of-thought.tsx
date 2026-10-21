import * as React from "react";
import { BrainIcon, ChevronDownIcon, DotIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge, type BadgeProps } from "./badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import {
  aiDisclosureChevronClass,
  aiDisclosureTriggerClass,
  type AiIconComponent,
} from "./ai-disclosure-variants";
import {
  chainOfThoughtStepIconVariants,
  chainOfThoughtStepVariants,
} from "./chain-of-thought-variants";

/**
 * The steps an agent took for an answer, folded under a header — search
 * queries, sources found, intermediate images. Port of the AI Elements
 * `ChainOfThought` (https://registry.ai-sdk.dev/chain-of-thought.json) on a
 * Radix Collapsible and JLU tokens.
 *
 * Closed by default. `open`/`defaultOpen`/`onOpenChange` are the Radix
 * Collapsible's own. Unlike AI Elements, header and content share ONE
 * Collapsible (the root), so the header's `aria-controls` points at the
 * content it opens.
 */
export type ChainOfThoughtProps = React.ComponentPropsWithoutRef<typeof Collapsible>;

const ChainOfThought = React.forwardRef<HTMLDivElement, ChainOfThoughtProps>(
  ({ className, ...props }, ref) => (
    <Collapsible ref={ref} className={cn("max-w-prose space-y-4", className)} {...props} />
  ),
);
ChainOfThought.displayName = "ChainOfThought";

/**
 * The button that shows and hides the steps. `children` is its label
 * (default „Gedankengang"), set between the brain icon and the chevron. No
 * `asChild`: the header is always this button — for a trigger element of
 * your own, use `CollapsibleTrigger asChild` inside the `ChainOfThought` root.
 */
export type ChainOfThoughtHeaderProps = Omit<
  React.ComponentPropsWithoutRef<typeof CollapsibleTrigger>,
  "asChild"
>;

const ChainOfThoughtHeader = React.forwardRef<HTMLButtonElement, ChainOfThoughtHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <CollapsibleTrigger
      ref={ref}
      className={cn(aiDisclosureTriggerClass, className)}
      {...props}
      asChild={false}
    >
      <BrainIcon aria-hidden="true" className="size-4" />
      <span className="flex-1">{children ?? "Gedankengang"}</span>
      <ChevronDownIcon aria-hidden="true" className={aiDisclosureChevronClass} />
    </CollapsibleTrigger>
  ),
);
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";

/** The folded part: the steps. */
export type ChainOfThoughtContentProps = React.ComponentPropsWithoutRef<typeof CollapsibleContent>;

const ChainOfThoughtContent = React.forwardRef<HTMLDivElement, ChainOfThoughtContentProps>(
  ({ className, ...props }, ref) => (
    <CollapsibleContent
      ref={ref}
      className={cn("mt-2 space-y-3 text-on-surface outline-none", className)}
      {...props}
    />
  ),
);
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";

export type ChainOfThoughtStepStatus = "complete" | "active" | "pending";

/**
 * One step: icon, `label`, optional `description`, and `children` below
 * (search results, an image). A thin rule under the icon runs down to the
 * next step. `status`: `complete` (default), `active` — the step in progress,
 * strong text and `aria-current="step"` — or `pending` (dimmed icon).
 * `data-status` carries the value for styling and tests.
 */
export interface ChainOfThoughtStepProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon component (default: lucide `Dot`). Decorative. */
  icon?: AiIconComponent;
  label: React.ReactNode;
  description?: React.ReactNode;
  status?: ChainOfThoughtStepStatus;
}

const ChainOfThoughtStep = React.forwardRef<HTMLDivElement, ChainOfThoughtStepProps>(
  (
    { className, icon: Icon = DotIcon, label, description, status = "complete", children, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      data-status={status}
      aria-current={status === "active" ? "step" : undefined}
      className={cn(chainOfThoughtStepVariants({ status }), className)}
      {...props}
    >
      <div className="relative mt-0.5">
        <Icon aria-hidden="true" className={chainOfThoughtStepIconVariants({ status })} />
        <div aria-hidden="true" className="absolute top-7 bottom-0 left-1/2 -mx-px w-px bg-outline-variant" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div>{label}</div>
        {description && <div className="text-xs text-on-surface-variant">{description}</div>}
        {children}
      </div>
    </div>
  ),
);
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";

/** A wrapping row of `ChainOfThoughtSearchResult` chips. */
export type ChainOfThoughtSearchResultsProps = React.HTMLAttributes<HTMLDivElement>;

const ChainOfThoughtSearchResults = React.forwardRef<HTMLDivElement, ChainOfThoughtSearchResultsProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-wrap items-center gap-2", className)} {...props} />
  ),
);
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";

/** One source found by a search step: a `Badge`, tone `secondary` unless set. */
export type ChainOfThoughtSearchResultProps = BadgeProps;

const ChainOfThoughtSearchResult = React.forwardRef<HTMLSpanElement, ChainOfThoughtSearchResultProps>(
  ({ tone = "secondary", ...props }, ref) => <Badge ref={ref} tone={tone} {...props} />,
);
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";

/**
 * An image inside a step (a chart, a page the agent looked at) on a quiet
 * framed surface, with an optional `caption`. A `<figure>`, so the caption
 * is its `<figcaption>`; give the image its own `alt`.
 */
export interface ChainOfThoughtImageProps extends React.HTMLAttributes<HTMLElement> {
  caption?: React.ReactNode;
}

const ChainOfThoughtImage = React.forwardRef<HTMLElement, ChainOfThoughtImageProps>(
  ({ className, children, caption, ...props }, ref) => (
    <figure ref={ref} className={cn("m-0 mt-2 space-y-2", className)} {...props}>
      <div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-[var(--ui-radius-box,var(--radius-xl))] bg-surface-container p-3">
        {children}
      </div>
      {caption && <figcaption className="text-xs text-on-surface-variant">{caption}</figcaption>}
    </figure>
  ),
);
ChainOfThoughtImage.displayName = "ChainOfThoughtImage";

export {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
  ChainOfThoughtImage,
};
