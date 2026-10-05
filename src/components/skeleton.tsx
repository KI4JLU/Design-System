import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { skeletonVariants } from "./skeleton-variants";

export interface SkeletonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "aria-hidden">,
    VariantProps<typeof skeletonVariants> {}

/**
 * Loading placeholder in the shape of the content to come: a text line
 * (`text`, default), an area (`block`) or an avatar (`circle`). Width and
 * height are layout and go in `className` (`w-2/3`, `h-32`, `size-10`).
 *
 * Always `aria-hidden` — a grey bar means nothing to a screen reader. The
 * loading state is told once, for the whole region:
 *
 * ```tsx
 * <Card>
 *   <CardHeader className="flex-row items-center justify-between">
 *     <CardTitle>Zusammenfassung</CardTitle>
 *     {loading && <Spinner size="sm" label="Zusammenfassung wird erstellt …" />}
 *   </CardHeader>
 *   <CardContent aria-busy={loading}>
 *     {loading ? <Skeleton className="w-2/3" /> : summary}
 *   </CardContent>
 * </Card>
 * ```
 *
 * - The region being replaced carries `aria-busy="true"` while it loads.
 * - **One** status says what is loading: a `Spinner` with a `label`, or an
 *   `sr-only` element with `role="status"`. Keep it outside the busy region —
 *   a screen reader may hold back updates inside an `aria-busy` subtree.
 * - When the content arrives, drop `aria-busy` and the status; the content
 *   itself is not announced, so report a failure with an `Alert`.
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
      aria-hidden="true"
    />
  ),
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
