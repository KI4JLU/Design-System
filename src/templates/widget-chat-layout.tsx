import * as React from "react";
import { Card } from "../components/card";
import { Stack } from "../components/stack";
import { cn } from "../lib/utils";

/**
 * Template „Chat-Widget": a Card-framed column — optional header (bot name,
 * Avatar, status), a scrollable message area (`children`, typically
 * <ChatBubble>s), and a `composer` pinned at the bottom. Fills the height of
 * its parent (`h-full`): the embedding context sizes the widget. Scroll
 * position/auto-scroll and message state stay with the consumer.
 */
export interface WidgetChatLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Widget header (Avatar, name, online status). */
  header?: React.ReactNode;
  /** Input row pinned below the messages (Textarea + send Button). */
  composer?: React.ReactNode;
}

const WidgetChatLayout = React.forwardRef<HTMLDivElement, WidgetChatLayoutProps>(
  ({ className, header, composer, children, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}
      {...props}
    >
      {header && (
        <div className="flex shrink-0 items-center gap-stack-sm border-b border-outline-variant p-4">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        <Stack gap="sm">{children}</Stack>
      </div>
      {composer && (
        <div className="shrink-0 border-t border-outline-variant p-4">{composer}</div>
      )}
    </Card>
  ),
);
WidgetChatLayout.displayName = "WidgetChatLayout";

export { WidgetChatLayout };
