import * as React from "react";
import { cn } from "../lib/utils";
import { formActionBarVariants } from "./form-action-bar-variants";

/**
 * The action row of a long form (Cancel / Save) that stays in view while the
 * form scrolls: a raised card bar, `sticky` at the bottom of its scroll
 * container. `children` are the actions, right-aligned; `message` is a slot on
 * the left for an error (an `Alert`) or status text ("Ungespeicherte
 * Änderungen").
 *
 * **Placement.** Make it the last child of the form's content column, inside
 * the same scroll container as the cards. Sticky only holds within its parent,
 * so the parent must span the whole form. At the end of the scroll the bar
 * rests in its own place below the last card and covers nothing, so no extra
 * bottom spacing is needed. While scrolling it floats over the content.
 *
 * **Keyboard focus (WCAG 2.4.11).** A field tabbed to mid-scroll can sit
 * behind the floating bar. Give the scroll container a `scroll-padding-bottom`
 * of about the bar's height, or the fields a `scroll-margin-bottom`
 * (`FormLayout stickyActions` does the latter for you).
 *
 * **Narrow bars** (below 28rem of the bar's own width, a container query):
 * the message goes above, and the actions stack full width with the last one
 * — the primary action — on top, as in `FormLayout`. Buttons are never shrunk.
 *
 * The message slot is not a live region: an `Alert` brings `role="alert"`; for
 * status text pass your own `role="status"` element.
 */
export interface FormActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Left of the actions (above them when narrow): an `Alert`, a `Badge`, status text. */
  message?: React.ReactNode;
  /** Stick to the bottom of the scroll container. Default `true`; `false` = static row. */
  sticky?: boolean;
}

const FormActionBar = React.forwardRef<HTMLDivElement, FormActionBarProps>(
  ({ className, message, sticky = true, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="form-action-bar"
      className={cn(formActionBarVariants({ sticky, className }))}
      {...props}
    >
      <div className="flex flex-col gap-stack-sm @md:flex-row @md:flex-wrap @md:items-center">
        {message != null && message !== false && (
          <div
            data-slot="form-action-bar-message"
            className="min-w-0 text-sm text-on-surface-variant @md:grow @md:basis-64"
          >
            {message}
          </div>
        )}
        <div
          data-slot="form-action-bar-actions"
          className="flex flex-col-reverse gap-stack-sm @md:ml-auto @md:shrink-0 @md:flex-row"
        >
          {children}
        </div>
      </div>
    </div>
  ),
);
FormActionBar.displayName = "FormActionBar";

export { FormActionBar };
