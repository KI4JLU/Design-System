import * as React from "react";
import { cn } from "../lib/utils";

/**
 * A placeholder in the measures of content that is still loading (shadcn/ui
 * `skeleton`). Size and radius come from `className`; it is decoration, so the
 * region it stands in carries the state (`aria-busy`) and it is hidden from
 * assistive technology itself.
 *
 * `shimmer`: a light sweeps across it, where the default only pulses.
 * `delay` (ms): it shows only once the load has run that long, so a quick
 * load paints no skeleton in between. Without motion it stands still.
 */
export interface SkeletonProps extends React.ComponentProps<"div"> {
  shimmer?: boolean;
  delay?: number;
}

function Skeleton({ className, shimmer, delay, style, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "rounded-action bg-surface-container-high motion-reduce:animate-skeleton-reveal",
        shimmer ? SHIMMER : "animate-skeleton-pulse",
        className,
      )}
      style={delayStyle(delay, style)}
    />
  );
}

/* The sweep: a narrow, soft highlight moving across the bar, which keeps its
 * own colour and outline throughout (the gradient itself is `--skeleton-sheen`
 * in tokens.css, shared with `SkeletonText`). */
const SHIMMER = "animate-skeleton-shimmer bg-(image:--skeleton-sheen) bg-[length:300%_100%] bg-no-repeat";

function delayStyle(delay: number | undefined, style: React.CSSProperties | undefined): React.CSSProperties | undefined {
  // The first animation is the reveal; what follows it (pulse, shimmer) starts at once.
  return delay ? { animationDelay: `${delay}ms, 0s`, ...style } : style;
}

/**
 * Text as a skeleton: every heading (`h1`–`h6`) and paragraph inside becomes
 * one bar as wide and as high as its own text, so the block has the very
 * measures it will have once shown. Wrap the real text while the page around
 * it loads; it is hidden from assistive technology and takes no pointer or
 * focus (always — `aria-hidden` and `inert` cannot be overridden).
 *
 * Only headings and paragraphs: text in other elements (list items, bare
 * `span`s or `div`s) stays readable but out of reach, so it does not belong
 * in here — use `Skeleton` for those. Not to be nested.
 *
 * `align="center"` for centred text (the bar is centred like its line).
 * `shimmer` and `delay` as on `Skeleton`.
 */
export interface SkeletonTextProps extends React.ComponentProps<"div"> {
  shimmer?: boolean;
  delay?: number;
  align?: "start" | "center";
}

function SkeletonText({ className, shimmer, delay, align = "start", style, ...props }: SkeletonTextProps) {
  return (
    // The bars themselves are drawn by the `[data-slot="skeleton-text"]`
    // rules in tokens.css: they style the consumer's own headings and
    // paragraphs, which no utility on this wrapper can reach by name.
    <div
      {...props}
      data-slot="skeleton-text"
      data-shimmer={shimmer ? "" : undefined}
      data-align={align}
      aria-hidden="true"
      inert
      className={cn("animate-skeleton-reveal", className)}
      style={delayStyle(delay, style)}
    />
  );
}

export { Skeleton, SkeletonText };
