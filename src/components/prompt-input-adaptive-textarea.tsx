import * as React from "react";
import { cn } from "../lib/utils";
import {
  PromptInputTextarea,
  type PromptInputTextareaProps,
} from "./prompt-input";

/**
 * The composer's textarea in two layouts, switched by its own content:
 *
 * - **One line** — the text sits between the composer's controls, which are
 *   overlaid on the bottom corners of the frame (`inlineLeft` / `inlineRight`
 *   are the widths to keep clear of them). One compact row.
 * - **More than one line** — the text takes the full width and the last
 *   `laneHeight` px below it are left free, so the same controls now form a
 *   bar under the text.
 *
 * The decision is measured, not guessed from newlines: on every change the
 * textarea is briefly laid out at the one-line paddings and its scrollHeight
 * compared with a single line's height — inside a layout effect, so the
 * probe never paints. Measuring at the narrow width makes the switch
 * hysteresis-free: text that wraps only because of the controls counts as
 * multi-line and moves up, and stays there until it fits between them again.
 *
 * The placeholder is not content. An empty field stays one line and its
 * placeholder is cut to that line with an ellipsis — otherwise a placeholder
 * longer than the gap between the controls (a long KB name, a narrow column)
 * would open the control bar under an empty field. Only when the gap is too
 * narrow to show any of it (`MIN_EMPTY_SLOT_EM`) does the empty field move
 * up, and then the placeholder wraps in full.
 *
 * The consumer positions the controls (absolute, bottom corners of the
 * InputGroup, `laneHeight` tall). `data-multiline` on the textarea exposes the
 * mode for styling the frame.
 */
export interface PromptInputAdaptiveTextareaProps extends PromptInputTextareaProps {
  value: string;
  /** Space to keep clear on the left in one-line mode (px). */
  inlineLeft?: number;
  /** Space to keep clear on the right in one-line mode (px). */
  inlineRight?: number;
  /** Height of the control bar below the text in multi-line mode (px). Default 48. */
  laneHeight?: number;
  /** Max height of the text box before it scrolls (px). Default 240. */
  maxHeight?: number;
}

/** Narrowest gap between the controls, in em of the field's font size, that
 *  still shows a useful run of the placeholder in one-line mode. */
const MIN_EMPTY_SLOT_EM = 6;

const PromptInputAdaptiveTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputAdaptiveTextareaProps
>(
  (
    {
      value,
      inlineLeft = 0,
      inlineRight = 0,
      laneHeight = 48,
      maxHeight = 240,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [multiline, setMultiline] = React.useState(false);

    React.useImperativeHandle(
      ref,
      () => innerRef.current as HTMLTextAreaElement,
    );

    const probe = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      if (el.value === "") {
        // Nothing to measure: the placeholder must not decide the layout.
        // Measuring it would be engine-dependent as well — WebKit leaves the
        // placeholder out of `field-sizing: content` but not out of
        // scrollHeight. A field that is not laid out (clientWidth 0) is
        // re-probed by the width observer once it is.
        const slot = el.clientWidth - inlineLeft - inlineRight;
        const minSlot =
          (parseFloat(getComputedStyle(el).fontSize) || 16) * MIN_EMPTY_SLOT_EM;
        const tooNarrow = el.clientWidth > 0 && slot < minSlot;
        setMultiline((m) => (m === tooNarrow ? m : tooNarrow));
        return;
      }
      // Lay the textarea out at the one-line paddings with content sizing
      // off: `rows=1` then gives clientHeight = exactly one line incl.
      // padding, and scrollHeight tells whether the text needs more. No
      // line-height parsing (it computes to "normal" for `leading-normal`).
      const prev = {
        pl: el.style.paddingLeft,
        pr: el.style.paddingRight,
        mb: el.style.marginBottom,
        fs: el.style.getPropertyValue("field-sizing"),
        rows: el.rows,
      };
      // Transitions off for the probe: with `transition-all` the computed
      // padding would still be mid-animation and the measurement would flip
      // between modes on every keystroke.
      const prevTransition = el.style.transition;
      el.style.transition = "none";
      el.style.paddingLeft = `${inlineLeft}px`;
      el.style.paddingRight = `${inlineRight}px`;
      el.style.marginBottom = "0px";
      el.style.setProperty("field-sizing", "fixed");
      el.rows = 1;
      const wraps = el.scrollHeight > el.clientHeight + 1;
      el.style.paddingLeft = prev.pl;
      el.style.paddingRight = prev.pr;
      el.style.marginBottom = prev.mb;
      el.style.setProperty("field-sizing", prev.fs);
      el.rows = prev.rows;
      el.style.transition = prevTransition;
      setMultiline((m) => (m === wraps ? m : wraps));
    }, [inlineLeft, inlineRight]);

    React.useLayoutEffect(() => {
      probe();
    }, [probe, value]);

    // Width changes (sidebar resize, viewport) move the wrap point. Only the
    // width matters: reacting to height would re-probe on our own switch.
    React.useLayoutEffect(() => {
      const el = innerRef.current;
      const target = el?.parentElement;
      if (!target) return;
      let lastWidth = target.getBoundingClientRect().width;
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width ?? lastWidth;
        if (Math.abs(w - lastWidth) < 0.5) return;
        lastWidth = w;
        probe();
      });
      ro.observe(target);
      return () => ro.disconnect();
    }, [probe]);

    return (
      <>
        <PromptInputTextarea
          ref={innerRef}
          value={value}
          data-multiline={multiline ? "" : undefined}
          // No transitions: the layout switch must be instant, not a padding slide.
          // One-line mode: the placeholder keeps to its line (ellipsis)
          // instead of wrapping under the controls.
          className={cn(
            "min-h-0 basis-full transition-none",
            "[&:not([data-multiline])]:placeholder:truncate",
            className,
          )}
          style={{
            ...style,
            maxHeight,
            paddingLeft: multiline ? undefined : inlineLeft,
            paddingRight: multiline ? undefined : inlineRight,
            marginBottom: multiline ? laneHeight : undefined,
          }}
          {...props}
        />
        {multiline && (
          /* The control bar's lane: full width along the bottom of the frame,
           a hairline on top separating it from the text. The controls
           themselves are the consumer's (absolute, bottom corners). */
          <div
            aria-hidden="true"
            data-slot="prompt-input-lane"
            className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-outline-variant/50"
            style={{ height: laneHeight }}
          />
        )}
      </>
    );
  },
);
PromptInputAdaptiveTextarea.displayName = "PromptInputAdaptiveTextarea";

export { PromptInputAdaptiveTextarea };
