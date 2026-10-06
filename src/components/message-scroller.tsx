import * as React from "react";
import { ArrowDown } from "lucide-react";
import { MessageScroller as MessageScrollerPrimitive } from "@shadcn/react/message-scroller";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";

/**
 * Chat transcript scroller. The shadcn `MessageScroller`
 * (https://ui.shadcn.com/docs/components/base/message-scroller) styled with
 * this library's tokens; behavior comes unchanged from the headless
 * `@shadcn/react/message-scroller` primitive:
 *
 * - follows a streaming answer only while the reader sits at the live edge;
 *   wheel, touch or keyboard scrolling releases it
 * - `scrollAnchor` rows (usually the user turn) open near the top of the
 *   viewport with `scrollPreviousItemPeek` px of the previous turn visible
 * - keeps the reader's position when history is prepended
 * - no React re-render on scroll; rows use `content-visibility: auto`, so no
 *   virtualizer is needed for hundreds of turns
 *
 * Composition: Provider > MessageScroller > Viewport > Content > Item, with
 * `MessageScrollerButton` as a sibling of the Viewport. The primitive's hooks
 * (`useMessageScroller`, `…Scrollable`, `…Visibility`) are re-exported from the
 * package barrel; they drive or observe the transcript from inside the Provider.
 *
 * Deviations from the shadcn registry file: its project-specific utilities
 * (`scroll-fade-b`, `scrollbar-thin`, `scrollbar-gutter-stable`) are written
 * as plain CSS properties, and the jump button is this library's `Button`
 * with a German screen-reader label.
 */

function MessageScrollerProvider(
  props: React.ComponentProps<typeof MessageScrollerPrimitive.Provider>,
) {
  return <MessageScrollerPrimitive.Provider {...props} />;
}

function MessageScroller({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Root>) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn(
        "group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function MessageScrollerViewport({
  className,
  "aria-label": ariaLabel = "Nachrichten",
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      // The primitive's region label defaults to English "Messages".
      aria-label={ariaLabel}
      className={cn(
        "size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain [contain:content] [scrollbar-gutter:stable] [scrollbar-width:thin]",
        "data-autoscrolling:[scrollbar-color:transparent_transparent] data-pending-scroll:invisible",
        className,
      )}
      {...props}
    />
  );
}

function MessageScrollerContent({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Content>) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      // shrink-0: in a flex-column viewport the content would otherwise shrink
      // to the viewport height and its rows overflow it. The primitive still
      // counts the content's end padding, which then lies past the scrollable
      // end, so the jump button never hides at the bottom.
      className={cn("flex h-max min-h-full shrink-0 flex-col gap-6", className)}
      {...props}
    />
  );
}

function MessageScrollerItem({
  className,
  scrollAnchor = false,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Item>) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      scrollAnchor={scrollAnchor}
      className={cn(
        "min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]",
        className,
      )}
      {...props}
    />
  );
}

type MessageScrollerButtonProps = React.ComponentProps<typeof MessageScrollerPrimitive.Button> &
  Pick<ButtonProps, "variant" | "size"> & {
    /** Screen-reader label. Default: "Zum Ende springen" / "Zum Anfang springen". */
    label?: string;
  };

function MessageScrollerButton({
  direction = "end",
  className,
  children,
  render,
  variant = "outline",
  size = "icon",
  label,
  ...props
}: MessageScrollerButtonProps) {
  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      data-direction={direction}
      direction={direction}
      className={cn(
        "absolute left-1/2 -translate-x-1/2 shadow-md transition-[translate,scale,opacity] duration-200",
        "data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)]",
        "data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)]",
        "data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full",
        "data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full data-[direction=start]:[&_svg]:rotate-180",
        "motion-reduce:transition-none",
        className,
      )}
      render={render ?? <Button variant={variant} size={size} />}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDown aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">
            {label ?? (direction === "end" ? "Zum Ende springen" : "Zum Anfang springen")}
          </span>
        </>
      )}
    </MessageScrollerPrimitive.Button>
  );
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  type MessageScrollerButtonProps,
};
