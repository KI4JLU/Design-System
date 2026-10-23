import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { logoVariants } from "./logo-variants";

/**
 * Platform wordmark: prefix ("JLU") + product name in a brand badge —
 * „JLU [CampusAgents]", „JLU [API]", „JLU [RAG]". Formalizes the brand
 * template as a component on the brand tokens (`bg-brand`/`text-on-brand`
 * for the badge, `text-brand-wordmark` for the prefix), which follow the
 * primary colour — so the logo takes the user's accent colour and the dark
 * mode's light accent.
 * Renders real text — screen readers read „JLU CampusAgents" naturally,
 * no aria needed.
 */
export interface LogoProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof logoVariants> {
  /** Product/platform name shown in the badge (e.g. "CampusAgents", "API", "RAG"). */
  product: string;
  /** Wordmark before the badge. */
  prefix?: string;
}

const Logo = React.forwardRef<HTMLSpanElement, LogoProps>(
  ({ className, size, product, prefix = "JLU", ...props }, ref) => (
    <span ref={ref} className={cn(logoVariants({ size, className }))} {...props}>
      {prefix}
      <span className="rounded-[0.55em] bg-brand px-[0.55em] py-[0.2em] text-[0.8em] text-on-brand">
        {product}
      </span>
    </span>
  ),
);
Logo.displayName = "Logo";

export { Logo };
