import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
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
   * not to the composer, which is centred in an empty chat. Always two lines
   * high, so the composer stays put when the column narrows and the text wraps.
   */
  footer?: React.ReactNode;
  /** `id` of the footer element. */
  footerId?: string;
  /**
   * The user's chat width: how wide the column may grow on a large screen —
   * `comfortable` up to 60rem, `wide` up to 80rem, `full` all of the stage.
   * Below that the column fills the stage: the setting is a cap, never a
   * margin. The stage sizes the composer and footer on it itself; put the
   * transcript or start-page content in a `ChatStageColumn` to share it.
   */
  width?: ChatStageWidth;
  /**
   * Where an empty chat sits: `center` (default) centres content and
   * composer together; `start` keeps them at the top, so content that grows
   * (an editor opening under a title) grows downwards and the title stays put.
   * The footer stays at the bottom either way. No effect with messages.
   */
  align?: "center" | "start";
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

// The box on the centre axis, and how far that axis moves to keep clear of
// the card: centred while the box fits beside it, moved towards the start by
// what is missing once it does not — never further than the box's own margin,
// so it stays inside the stage — and only then narrowed (`--chat-room`).
// With messages the box is the column; an empty chat (the start page) is the
// start page's width.
const AXIS_CLASS =
  "[--chat-column-inset:2rem] max-md:[--chat-column-inset:0.75rem] [--chat-box:var(--chat-column-width)] [--chat-axis-shift:clamp(0px,var(--chat-clear)_-_(100cqw_-_var(--chat-box))_/_2,(100cqw_-_var(--chat-box))_/_2)] [--chat-axis-width:var(--chat-box)]";
const START_BOX_CLASS = "[--chat-box:min(42rem,var(--chat-column-width))]";

// A box on that axis: centred, at most `--chat-box` wide, moved by the shift.
const ON_AXIS = "relative left-[calc(-1_*_var(--chat-axis-shift,0px))] mx-auto box-border w-full max-w-[var(--chat-box,100%)]";

// The transcript scroller keeps symmetric gutters, so its column stays on the
// same axis as the composer when the scrollbar takes space.
const SCROLLER_CLASS =
  "[&_[data-slot=message-scroller-viewport]]:[scrollbar-gutter:stable_both-edges] max-md:[&_[data-slot=message-scroller-viewport]]:[scrollbar-gutter:auto]";

/**
 * The column of a full-page chat: messages (or an empty state), composer and
 * footer. `empty` switches between the centred start and the docked
 * conversation without moving anything else — deliberately no layout
 * animation, which slid the composer on every position change (chat switch,
 * late-arriving empty state), not only on the first message.
 *
 * Centring uses auto margins, not `justify-content`, so a tall empty state
 * scrolls from its top instead of being clipped. The card-framed widget is
 * `WidgetChatLayout`.
 *
 * **The column.** The stage owns the column's geometry: the width (from
 * `width`, capped by the room beside the shell's open card), the start page's
 * narrower box while `empty`, the inset (2rem, 0.75rem below `md`), and the
 * centre axis that moves towards the start edge to keep clear of that card
 * (`--app-shell-bubble-inset`). The `composer`, the `footer` (in the column's
 * box, so it wraps there) and the `header` row sit on that axis by themselves; put the transcript (`MessageScrollerContent`)
 * or the empty state in a `ChatStageColumn` and it sits there too.
 *
 * The stage is a size container and publishes `--chat-column-width`,
 * `--chat-room`, `--chat-clear`, `--chat-box` (the box on the axis),
 * `--chat-axis-shift` and `--chat-axis-width` (`MessageScrollerButton` follows
 * the shift). The values are in `cqw` and resolve where they are used, against
 * the nearest size container — so no other inline-size container may stand
 * between the stage and the boxes that read them.
 */
const ChatStage = React.forwardRef<HTMLDivElement, ChatStageProps>(
  ({ empty = false, align = "center", header, composer, footer, footerId, width = "comfortable", className, children, ...props }, ref) => {
    const centred = empty && align === "center";
    return (
      <div
        ref={ref}
        data-slot="chat-stage"
        data-empty={empty || undefined}
        data-align={empty ? align : undefined}
        data-width={width}
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          COLUMN_CLASS,
          WIDTH_CLASS[width],
          AXIS_CLASS,
          empty && START_BOX_CLASS,
          SCROLLER_CLASS,
          empty && "overflow-y-auto",
          className,
        )}
        {...props}
      >
        <div
          data-slot="chat-stage-content"
          className={cn("flex min-w-0 flex-col", empty ? cn("flex-none", centred && "mt-auto") : "min-h-0 flex-1")}
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
          // With messages the composer sits close under the transcript, which
          // fades out over its lower edge; on the start page a 2rem gap
          // separates it from the content above (0.75rem below `md`).
          <div
            data-slot="chat-stage-composer"
            className={cn(
              ON_AXIS,
              "shrink-0 pb-4",
              empty ? "px-4 pt-8 max-md:pt-3" : "px-[var(--chat-column-inset)] pt-2",
              empty && "mb-auto",
            )}
          >
            {composer}
          </div>
        )}
        {footer != null && (
          <p
            id={footerId}
            data-slot="chat-stage-footer"
            // Without a composer nothing above takes the free space, so the
            // footer takes it itself and stays pinned to the bottom.
            className={cn(ON_AXIS, "my-0 min-h-[calc(2lh_+_1rem)] shrink-0 px-6 pb-4 text-center text-xs text-on-surface-variant", empty && composer == null && "mt-auto")}
          >
            {footer}
          </p>
        )}
      </div>
    );
  },
);
ChatStage.displayName = "ChatStage";

export interface ChatStageColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render the child (e.g. `MessageScrollerContent`) as the column. */
  asChild?: boolean;
}

/**
 * A box on the stage's centre axis: the transcript or the empty state. It is
 * the column's width (the start page's while the stage is `empty`), carries
 * the column's inset and moves with the axis when the shell's card opens —
 * exactly like the composer under it. Inside a `ChatStage` only.
 */
const ChatStageColumn = React.forwardRef<HTMLDivElement, ChatStageColumnProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-slot="chat-stage-column"
        className={cn(ON_AXIS, "px-[var(--chat-column-inset)]", className)}
        {...props}
      />
    );
  },
);
ChatStageColumn.displayName = "ChatStageColumn";

export { ChatStage, ChatStageColumn };
