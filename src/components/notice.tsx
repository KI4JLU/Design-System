import * as React from "react";
import { Alert, AlertDescription, type AlertProps } from "./alert";

export type NoticeTone = "neutral" | "info" | "warning";

export interface NoticeProps extends Omit<AlertProps, "tone" | "live"> {
  /** Default `"neutral"`. */
  tone?: NoticeTone;
}

/**
 * @deprecated Use `Alert`. `Notice` is now a thin wrapper over it and will be
 * removed in a later release. `<Notice tone icon>text</Notice>` maps to
 * `<Alert tone icon={icon ?? null}>text</Alert>`: Alert is static by default
 * too, and `icon={null}` keeps Notice's "no icon unless given".
 */
const Notice = React.forwardRef<HTMLDivElement, NoticeProps>(
  ({ tone = "neutral", icon, children, ...props }, ref) => (
    <Alert
      ref={ref}
      data-slot="notice"
      data-tone={tone}
      tone={tone}
      icon={icon ?? null}
      {...props}
    >
      {/* One normal-flow block, as before: text and an inline link must not
          become separate items of Alert's column. */}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  ),
);
Notice.displayName = "Notice";

export { Notice };
