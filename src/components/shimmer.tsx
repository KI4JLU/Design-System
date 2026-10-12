import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Shimmering status text for the moments an AI is working ("Denke nach …",
 * "Suche tiefer …"). Port of the shadcn AI Elements `Shimmer`
 * (https://www.shadcn.io/ai/shimmer): same props and look, but driven by the
 * `animate-shimmer` keyframe from tokens.css instead of `motion`, so the
 * library takes on no animation runtime.
 *
 * A `surface`-colored band sweeps across `on-surface-variant` text. The band's
 * half-width is `children.length × spread` px, so longer text gets a wider
 * band. With prefers-reduced-motion the band is parked off the text and the
 * label reads as plain muted text.
 */
export interface ShimmerProps extends React.HTMLAttributes<HTMLElement> {
  /** The text that shimmers. A string, because the band width scales with its length. */
  children: string;
  /** Element to render. Default: `p`. */
  as?: React.ElementType;
  /** Seconds per sweep. Default: 2. */
  duration?: number;
  /** Band half-width in px per character. Default: 2. */
  spread?: number;
}

const Shimmer = React.memo(function Shimmer({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  style,
  ...props
}: ShimmerProps) {
  return (
    <Component
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text bg-no-repeat text-transparent",
        "animate-shimmer motion-reduce:animate-none",
        className,
      )}
      style={
        {
          "--shimmer-spread": `${children.length * spread}px`,
          "--shimmer-duration": `${duration}s`,
          backgroundImage:
            "linear-gradient(90deg, transparent calc(50% - var(--shimmer-spread)), var(--color-surface), transparent calc(50% + var(--shimmer-spread))), linear-gradient(var(--color-on-surface-variant), var(--color-on-surface-variant))",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </Component>
  );
});

export { Shimmer };
