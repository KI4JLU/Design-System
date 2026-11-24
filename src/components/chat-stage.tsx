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
  /**
   * The user's chat width: how wide the column may grow on a large screen —
   * `comfortable` up to 60rem, `wide` up to 80rem, `full` all of the stage.
   * Below that the column fills the stage: the setting is a cap, never a
   * margin. Published as `--chat-column-width`; the stage does not size its
   * content itself.
   */
  width?: ChatStageWidth;
}

export type ChatStageWidth = "comfortable" | "wide" | "full";

// `--chat-room` is what the shell's open card leaves beside it
// (`--app-shell-bubble-inset`); the shell only publishes the inset while that
// is at least twice the card, so no floor is needed here.
const WIDTH_CLASS: Record<ChatStageWidth, string> = {
  comfortable: "[--chat-width-cap:60rem]",
  wide: "[--chat-width-cap:80rem]",
  full: "[--chat-width-cap:100cqw]",
};
const COLUMN_CLASS =
  "@container [--chat-clear:var(--app-shell-bubble-inset,0px)] [--chat-room:calc(100cqw_-_var(--chat-clear))] [--chat-column-width:min(var(--chat-width-cap),var(--chat-room))] max-md:[--chat-clear:0px] max-md:[--chat-column-width:100cqw]";

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
 *
 * **The column's width.** The stage is a size container and publishes
 * `--chat-column-width` (from `width`), `--chat-room` and `--chat-clear` for
 * its content: the consumer's transcript and composer take that width. The
 * values are in `cqw` and resolve where they are used, against the nearest
 * size container — so no other inline-size container may stand between the
 * stage and the boxes that read them.
 */
const ChatStage = React.forwardRef<HTMLDivElement, ChatStageProps>(
  ({ empty = false, header, composer, footer, footerId, width = "comfortable", className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="chat-stage"
      data-empty={empty || undefined}
      data-width={width}
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col", COLUMN_CLASS, WIDTH_CLASS[width], empty && "overflow-y-auto", className)}
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
