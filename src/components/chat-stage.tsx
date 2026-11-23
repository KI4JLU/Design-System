import * as React from "react";
import { cn } from "../lib/utils";

export interface ChatStageProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * No messages yet: the content (an empty state) and the composer sit
   * together in the vertical centre. With messages, the content fills the
   * column (it is the scroller) and the composer docks at the bottom.
   */
  empty?: boolean;
  /**
   * A centred row above the content, in both states: what the chat was
   * started as (a role badge), a way back. It follows the column's centre
   * axis (`--chat-axis-shift`).
   */
  header?: React.ReactNode;
  /** The composer (PromptInput), with anything under it (PromptSuggestions). */
  composer?: React.ReactNode;
  /**
   * Pinned to the bottom of the column in both states (an answer disclaimer) —
   * not to the composer, which is centred in an empty chat.
   */
  footer?: React.ReactNode;
  /** `id` of the footer element. */
  footerId?: string;
}

/**
 * The column of a full-page chat: messages (or an empty state), composer and
 * footer. `empty` switches between the centred start and the docked
 * conversation without moving anything else — deliberately no layout
 * animation, which slid the composer on every position change (chat switch,
 * late-arriving empty state), not only on the first message.
 *
 * Centring uses auto margins, not `justify-content`, so a tall empty state
 * scrolls from its top instead of being clipped. The card-framed widget is
 * `ChatLayout`.
 *
 * **The centre axis.** A consumer that moves its column off the stage's
 * centre — to keep clear of the shell's floating card
 * (`--app-shell-bubble-inset`) — sets `--chat-axis-shift` on the stage: the
 * length the axis moves towards the start edge. The `header` row and
 * `MessageScrollerButton` follow it; the consumer moves its own boxes
 * (transcript, composer) by the same length. `--chat-axis-width` is the width
 * of the box on that axis: the `header` row wraps within it, so a long row
 * does not reach past the column's start edge once it moved.
 */
const ChatStage = React.forwardRef<HTMLDivElement, ChatStageProps>(
  ({ empty = false, header, composer, footer, footerId, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="chat-stage"
      data-empty={empty || undefined}
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col", empty && "overflow-y-auto", className)}
      {...props}
    >
      <div
        data-slot="chat-stage-content"
        className={cn("flex min-w-0 flex-col", empty ? "mt-auto flex-none" : "min-h-0 flex-1")}
      >
        {header != null && (
          // No item is wider than the row — a default (`:where`, no
          // specificity), so an item's own narrower max-width still holds. A
          // badge (a long role name) wraps its text instead of reaching past
          // the row's edge.
          <div
            data-slot="chat-stage-header"
            className="relative left-[calc(-1_*_var(--chat-axis-shift,0px))] mx-auto box-border flex w-full max-w-[var(--chat-axis-width,100%)] shrink-0 flex-wrap items-center justify-center gap-2 px-4 pt-3 [:where(&>*)]:max-w-full [&>[data-slot=badge]]:whitespace-normal [&>[data-slot=badge]]:wrap-anywhere"
          >
            {header}
          </div>
        )}
        {children}
      </div>
      {composer != null && (
        <div data-slot="chat-stage-composer" className={cn("w-full shrink-0", empty && "mb-auto")}>
          {composer}
        </div>
      )}
      {footer != null && (
        <p
          id={footerId}
          data-slot="chat-stage-footer"
          className="m-0 shrink-0 px-6 pb-4 text-center text-xs text-on-surface-variant"
        >
          {footer}
        </p>
      )}
    </div>
  ),
);
ChatStage.displayName = "ChatStage";

export { ChatStage };
