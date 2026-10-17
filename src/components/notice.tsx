import * as React from "react";
import { cn } from "../lib/utils";
import { noticeIconTones, noticeVariants } from "./notice-variants";

export type NoticeTone = "neutral" | "info" | "warning";

export interface NoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface/text token pair. Default `"neutral"`. */
  tone?: NoticeTone;
  /**
   * Leading icon (e.g. a lucide `Info`), shown in a 16px slot aligned with the
   * first text line. Decorative: the slot is `aria-hidden`, so the text must
   * say everything — never let the icon or the tint carry the meaning alone.
   */
  icon?: React.ReactNode;
}

/**
 * A short, static hint inside a page or dialog („Eigentümer und Admin haben
 * immer alle Rechte."): a tinted box with an optional leading icon and the
 * children as text. Not a live region and no role of its own — it is content
 * that is there when the view renders. For a message that appears in response
 * to an action, pass `role="status"` (or use `Toast`); for a form error, use
 * `FormMessage`.
 */
const Notice = React.forwardRef<HTMLDivElement, NoticeProps>(
  ({ tone = "neutral", icon, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="notice"
      data-tone={tone}
      className={cn(noticeVariants({ tone }), className)}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden="true"
          data-slot="notice-icon"
          // h-5 = the text-sm line height, so the icon centres on the first line.
          className={cn("flex h-5 shrink-0 items-center [&_svg]:size-4", noticeIconTones[tone])}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  ),
);
Notice.displayName = "Notice";

export { Notice };
