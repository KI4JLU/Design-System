import * as React from "react";

/**
 * One Tab stop for a whole list of rows, arrow keys inside it — the WAI-ARIA
 * „roving tabindex" (APG, „Developing a Keyboard Interface").
 *
 * A list of rows, each with a title and controls, otherwise costs a keyboard
 * user one or two Tab presses per row to get past. Here exactly one element
 * of the whole scope is in the tab order: the current row's first control.
 *
 *  - `↓` / `↑`: the next / previous row's first control. No wrap: the ends
 *    are where the list ends.
 *  - `Home` / `End`: the first / last row.
 *  - `→` / `←`: the next / previous control inside the row (a ⋯ menu, a
 *    checkbox), so everything in a row stays reachable without Tab.
 *  - `Tab`: leaves the list.
 *
 * The current row is the one that last had focus; before that, the row
 * marked `aria-current`, else the first. Typing in a text field inside a row
 * (a rename) is left alone.
 *
 * Imperative on purpose: the rows are the consumer's nodes and the controls
 * inside them belong to other components, so the tab order is set on the DOM
 * after each render rather than threaded through every one of them as props.
 * React does not own `tabindex` on those elements, so it does not undo it.
 *
 * **Several lists as one.** Lists that read as one to the user (a history
 * grouped by day) sit inside an element marked `data-sidebar-card-groups`;
 * the scope is then that element, so the whole is one Tab stop and `↑`/`↓`
 * run through the rows of every list in it. An attribute and not a wrapper
 * component, so the markup around the lists stays the consumer's.
 *
 * Not the `focusgroup` attribute: it has limited availability, and a row's
 * second axis (`→` to its own controls) needs this code either way.
 */
const ROW = "[data-slot='sidebar-card']";
const CONTROL = "button:not(:disabled), a[href], input:not(:disabled)";

// Not a control: anything hidden INSIDE the row, and the hidden form input a
// Radix checkbox renders beside its button (`aria-hidden`, never focusable).
// A row hidden from outside — the whole list in a collapsed pane — still
// counts: its tab order is set while hidden, so it is right the moment the
// pane opens, without the list having to render again.
const hiddenWithin = (el: Element, row: Element, selector: string): boolean => {
  const hider = el.closest(selector);
  return hider !== null && row.contains(hider);
};
const controlsOf = (row: Element): HTMLElement[] =>
  Array.from(row.querySelectorAll<HTMLElement>(CONTROL)).filter(
    (el) =>
      !el.matches("input[type='hidden']") &&
      !hiddenWithin(el, row, "[hidden]") &&
      !hiddenWithin(el, row, "[aria-hidden='true']"),
  );

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.tagName === "TEXTAREA" ||
    (target instanceof HTMLInputElement &&
      !["checkbox", "radio", "button"].includes(target.type)));

const GROUPS = "[data-sidebar-card-groups]";

/** The row holding the tab stop, per scope: lists in one scope share it. */
const currentRows = new WeakMap<Element, Element>();

export function useRovingRows<T extends HTMLElement>() {
  const listRef = React.useRef<T | null>(null);
  const scopeOf = () => listRef.current?.closest(GROUPS) ?? listRef.current;

  const apply = React.useCallback((current?: Element | null) => {
    const scope = scopeOf();
    if (!scope) return;
    const rows = Array.from(scope.querySelectorAll(ROW)).filter((row) => controlsOf(row).length > 0);
    const kept = current ?? currentRows.get(scope);
    const row =
      (kept && rows.includes(kept) ? kept : null) ??
      rows.find((r) => r.querySelector("[aria-current='true']")) ??
      rows[0] ??
      null;
    if (row) currentRows.set(scope, row);
    else currentRows.delete(scope);
    for (const r of rows) {
      controlsOf(r).forEach((control, index) => {
        control.tabIndex = r === row && index === 0 ? 0 : -1;
      });
    }
  }, []);

  // After every render: rows come and go with the consumer's data.
  React.useLayoutEffect(() => {
    apply();
  });

  const onFocus = React.useCallback(
    (event: React.FocusEvent<T>) => {
      const scope = scopeOf();
      const row = (event.target as Element).closest(ROW);
      if (scope && row && row !== currentRows.get(scope)) apply(row);
    },
    [apply],
  );

  const onKeyDown = React.useCallback((event: React.KeyboardEvent<T>) => {
    if (event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (isTyping(event.target)) return;
    const scope = scopeOf();
    const target = event.target as HTMLElement;
    const row = target.closest(ROW);
    // Only from a control of a row itself, not from a menu portalled out of it.
    if (!scope || !row || !scope.contains(row) || !row.contains(target)) return;

    const rows = Array.from(scope.querySelectorAll(ROW)).filter((r) => controlsOf(r).length > 0);
    const at = rows.indexOf(row);
    const controls = controlsOf(row);
    const inRow = controls.indexOf(target);
    let next: HTMLElement | undefined;
    switch (event.key) {
      case "ArrowDown":
        next = rows[at + 1] && controlsOf(rows[at + 1])[0];
        break;
      case "ArrowUp":
        next = rows[at - 1] && controlsOf(rows[at - 1])[0];
        break;
      case "Home":
        next = controlsOf(rows[0])[0];
        break;
      case "End":
        next = controlsOf(rows[rows.length - 1])[0];
        break;
      case "ArrowRight":
        next = controls[inRow + 1];
        break;
      case "ArrowLeft":
        next = controls[inRow - 1];
        break;
      default:
        return;
    }
    // The key belongs to the list even at its ends: the page must not scroll.
    event.preventDefault();
    if (next && next !== target) next.focus();
  }, []);

  return { ref: listRef, onFocus, onKeyDown };
}
