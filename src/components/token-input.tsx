import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { CircleX, TriangleAlert, X } from "lucide-react";

import { cn } from "../lib/utils";
import { badgeFilledTones } from "./badge-variants";
import { Combobox, ComboboxContent, type ComboboxProps } from "./combobox";
import { useComboboxField } from "./combobox-context";
import { fieldFrameClassName } from "./field-variants";
import { PopoverAnchor } from "./popover";

interface TokenInputChipsContextValue {
  focusInput: () => void;
  disabled: boolean;
}

const TokenInputChipsContext = React.createContext<TokenInputChipsContextValue | null>(
  null,
);

/** Characters that end one value: comma and line breaks (paste). */
const CHIP_SEPARATORS = /[,\r\n]+/;

/**
 * The frame's half of the open panel: its bottom corners are square, its own
 * border, focus ring and transition are off — the panel (`ComboboxContent`)
 * draws border and ring around field and list together; the top corners keep
 * the field radius. Border and ring need `!`: the frame's own states are
 * `has-[input:focus-visible]:` selectors, whose `:has()` argument outranks a
 * `[data-panel=open]` attribute in specificity, whatever the variant order.
 * Inert while `data-panel` is absent, i.e. while the list is closed.
 */
const panelChipsFrameClassName =
  "data-[panel=open]:rounded-b-none data-[panel=open]:border-transparent! data-[panel=open]:ring-0! data-[panel=open]:transition-none";

/** The `Combobox` root's props `TokenInput` takes over (open state and filtering). */
type TokenInputRootProps = Pick<
  ComboboxProps,
  "open" | "defaultOpen" | "onOpenChange" | "shouldFilter" | "filter" | "loop"
>;

export interface TokenInputProps
  extends TokenInputRootProps,
    Omit<
      React.ComponentPropsWithoutRef<"input">,
      "value" | "defaultValue" | "onChange" | "type" | "id" | "children"
    > {
  /** The chips — `TokenInputChip` elements, in display order. */
  children?: React.ReactNode;
  /**
   * The suggestion panel's content: a `ComboboxList` of `ComboboxItem`s, plus
   * `ComboboxEmpty` / `ComboboxLoading` next to it as in any `Combobox`.
   * Rendered inside the joined panel. Omitted (`null` / `undefined`), there
   * is no panel and the field stays closed; open requests are ignored (see
   * "Open state" on `TokenInput`). A `ComboboxFooter` is not part of this
   * pattern.
   */
  suggestions?: React.ReactNode;
  /** Controlled text being typed (not the chips). */
  value?: string;
  /** Initial text when uncontrolled. */
  defaultValue?: string;
  /** Called with the new text on every edit — and with `""` after a commit. */
  onValueChange?: (value: string) => void;
  /**
   * Typed text was committed: Enter or Tab (with no highlighted suggestion),
   * a comma, or a paste containing commas / line breaks. Receives the parts,
   * trimmed, empty ones dropped, in order — one call per gesture, so a paste
   * of three names is one update. Resolving them into chips is yours.
   */
  onCommit?: (values: string[]) => void;
  /** Backspace in the empty text field while chips are shown. */
  onRemoveLast?: () => void;
  /** Accessible name of the chip list. Default "Ausgewählt". */
  chipsLabel?: string;
}

type TokenInputFieldProps = Omit<TokenInputProps, keyof TokenInputRootProps | "suggestions">;

/** The chips frame + input. Rendered inside `TokenInput`'s `Combobox` root. */
const TokenInputField = React.forwardRef<HTMLInputElement, TokenInputFieldProps>(
  (
    {
      children,
      value,
      defaultValue,
      onValueChange,
      onCommit,
      onRemoveLast,
      chipsLabel = "Ausgewählt",
      className,
      disabled = false,
      onKeyDown,
      onPaste,
      onFocus,
      onBlur,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const {
      context,
      text,
      setText,
      handleValueChange,
      handleClosedListKeys,
      ariaOverrides,
      focusHandlers,
      panelState,
    } = useComboboxField({
      part: "TokenInput",
      value,
      defaultValue,
      onValueChange,
      ariaLabelledBy,
      shape: "field",
      ariaInvalid: props["aria-invalid"],
      onFocus,
      onBlur,
    });
    const { open, setOpen, anchorRef, activeId, afterSelectRef } = context;
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);
    const hasChips = React.Children.toArray(children).length > 0;

    // An accepted suggestion spends the query — see `afterSelectRef`.
    React.useEffect(() => {
      afterSelectRef.current = () => setText("");
      return () => {
        afterSelectRef.current = null;
      };
    });

    const commit = (raw: string[]) => {
      const values = raw.map((part) => part.trim()).filter(Boolean);
      if (values.length > 0) onCommit?.(values);
      setText("");
      setOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      // An IME composition owns Enter/Tab until it ends.
      if (event.defaultPrevented || event.nativeEvent.isComposing) return;
      const hasText = text.trim() !== "";
      const highlighted =
        open && activeId ? event.currentTarget.ownerDocument.getElementById(activeId) : null;
      const modified = event.altKey || event.ctrlKey || event.metaKey;

      if (event.key === "Tab" && !event.shiftKey && !modified) {
        if (highlighted) {
          event.preventDefault();
          // A click is cmdk's public way to select an option (its `onClick`),
          // with the same result as Enter: `onSelect`, then the list closes.
          highlighted.click();
        } else if (hasText) {
          event.preventDefault();
          commit([text]);
        }
        return;
      }
      if (event.key === "Enter" && !highlighted && hasText) {
        event.preventDefault();
        commit([text]);
        return;
      }
      if (event.key === "," && !modified) {
        event.preventDefault();
        if (hasText) commit([text]);
        return;
      }
      if (event.key === "Backspace" && text === "" && hasChips) {
        onRemoveLast?.();
        return;
      }
      handleClosedListKeys(event);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      onPaste?.(event);
      if (event.defaultPrevented) return;
      const pasted = event.clipboardData.getData("text/plain");
      if (!CHIP_SEPARATORS.test(pasted)) return;
      event.preventDefault();
      const input = event.currentTarget;
      const start = input.selectionStart ?? text.length;
      const end = input.selectionEnd ?? text.length;
      commit((text.slice(0, start) + pasted + text.slice(end)).split(CHIP_SEPARATORS));
    };

    const handleFrameMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as Element;
      if (disabled || target === inputRef.current || target.closest("button")) return;
      event.preventDefault(); // keeps focus where it is until we move it
      inputRef.current?.focus();
    };

    const chipsContext = React.useMemo(
      () => ({ focusInput: () => inputRef.current?.focus(), disabled }),
      [disabled],
    );

    return (
      <TokenInputChipsContext.Provider value={chipsContext}>
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            data-slot="token-input"
            data-panel={panelState}
            onMouseDown={handleFrameMouseDown}
            className={cn(
              // Inline flow, not flex: the chips and the input share lines, so
              // the input follows the last chip instead of taking a row of its
              // own. Rows are 34px line boxes (28px chip + 3px margins).
              // The framed field (`fieldVariants` default) on the frame, so the
              // focus ring and the invalid border follow the input inside.
              fieldFrameClassName,
              "block cursor-text py-[7px] pr-4",
              hasChips ? "pl-2.5" : "pl-4",
              panelChipsFrameClassName,
              className,
            )}
          >
            {hasChips ? (
              // `role="list"`: WebKit drops the list role of a `ul` whose
              // markers are removed (Tailwind's preflight does that). The
              // list is `inline` (not `display: contents`, which has dropped
              // list semantics in browsers) so its chips flow with the input.
              <ul
                role="list"
                aria-label={chipsLabel}
                className="m-0 inline list-none p-0"
              >
                {children}
              </ul>
            ) : null}
            <CommandPrimitive.Input asChild value={text} onValueChange={handleValueChange}>
              <input
                ref={inputRef}
                disabled={disabled}
                {...props}
                {...ariaOverrides}
                {...focusHandlers}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className={cn(
                  "my-[3px] inline-block h-7 border-0 bg-transparent p-0 align-top text-on-surface outline-none placeholder:text-on-surface-variant disabled:cursor-not-allowed",
                  // After chips the input is narrower, so it fits on the last
                  // chip's line; the frame's mousedown makes the rest of the
                  // line focus it too.
                  hasChips ? "w-40 max-w-full" : "w-full",
                )}
              />
            </CommandPrimitive.Input>
          </div>
        </PopoverAnchor>
      </TokenInputChipsContext.Provider>
    );
  },
);
TokenInputField.displayName = "TokenInputField";

/**
 * TokenInput — several values in one field: the values as removable chips,
 * followed by a text input, wrapping onto new lines as it fills, with a list
 * of suggestions joined under it. For value lists in forms and dialogs
 * (people to add, recipients, keywords); a single query (a search field, a
 * command palette) is `Combobox`.
 *
 * ```tsx
 * <TokenInput
 *   aria-label="Benutzernamen"
 *   shouldFilter={false}
 *   value={query}
 *   onValueChange={setQuery}
 *   onCommit={(names) => setPeople((p) => [...p, ...names.map(resolve)])}
 *   onRemoveLast={() => setPeople((p) => p.slice(0, -1))}
 *   suggestions={
 *     <ComboboxList>
 *       {suggestions.map((s) => (
 *         <ComboboxItem key={s.id} value={s.id} onSelect={() => add(s)}>{s.name}</ComboboxItem>
 *       ))}
 *     </ComboboxList>
 *   }
 * >
 *   {people.map((p) => (
 *     <TokenInputChip key={p.id} label={p.name} onRemove={() => remove(p.id)} />
 *   ))}
 * </TokenInput>
 * ```
 *
 * **One engine, not a copy.** It renders a `Combobox` root and its
 * `ComboboxContent` panel itself: the listbox, the highlight, the keyboard
 * model (↓/↑ with wrap-around, Home/End, Enter), filtering, dismissal and the
 * ARIA corrections to cmdk's input are `Combobox`'s, and the suggestions are
 * the ordinary `ComboboxList` / `ComboboxItem` (+ `ComboboxGroup`,
 * `ComboboxEmpty`, `ComboboxLoading`) in the `suggestions` slot. The root's
 * open state and filtering props are taken here: `open` / `defaultOpen` /
 * `onOpenChange`, `shouldFilter`, `filter`, `loop` (default on), as on
 * `Combobox`.
 *
 * **Open state needs `suggestions`.** With `suggestions`, `open` /
 * `defaultOpen` / `onOpenChange` behave exactly as on `Combobox`. Without
 * them, open requests (typing, ↓) are ignored — the field stays closed and
 * `onOpenChange(true)` is not reported; an uncontrolled list also closes
 * (unreported) when its suggestions go away, and a controlled `open` is
 * shown only while * suggestions are given. Suggestions that arrive later show at the next
 * keystroke.
 *
 * **Controlled data, no fetching.** The chips are your state: render one
 * `TokenInputChip` per value as `children`. The component only reports
 * gestures — `onCommit` (typed text), `ComboboxItem`'s `onSelect` (a
 * suggestion), `onRemoveLast` (Backspace) and `TokenInputChip`'s
 * `onRemove`.
 *
 * Keyboard, on top of `Combobox`'s:
 * - **Enter** selects the highlighted suggestion whenever the open list
 *   shows one (as in every combobox) — with text typed or not, e.g. right
 *   after ↓ opened the list on an empty field. With no highlighted
 *   suggestion it commits the typed text and never submits a surrounding
 *   form. With neither (nothing highlighted, nothing typed) it behaves as on
 *   `ComboboxInput`: the text field's while the list is closed (a form
 *   submits), nothing while it is open. `ComboboxList` highlights its first
 *   option by itself, so while suggestions are on screen Enter and Tab take
 *   one — use a comma to commit the raw text then, or render no suggestion
 *   that does not fit.
 * - **Tab** follows the same order and keeps focus in the field: it selects
 *   the highlighted suggestion whenever the open list shows one (also on an
 *   empty field), else commits the typed text. Only with neither — no
 *   highlighted suggestion and nothing typed — does it move focus on as
 *   usual.
 * - **Comma** commits the typed text and is never typed itself.
 * - **Backspace** in the empty field calls `onRemoveLast` (only while chips
 *   are shown).
 * - **Paste** of text containing commas or line breaks commits every part
 *   (the text already typed around the caret included); a paste without
 *   separators is an ordinary paste.
 * After a commit the text is cleared (`onValueChange("")`) and the list
 * closes; after a suggestion is selected the text is cleared too.
 *
 * Semantics: the chips are a list (`<ul role="list">`, named by
 * `chipsLabel`) before the input; the input is the combobox — name it with
 * `aria-label` / `aria-labelledby` (there is no `id` prop: cmdk keeps focus
 * in the field by looking it up under its own id). `aria-invalid` turns the
 * frame's border red, like `Input`. `disabled` disables the input and every
 * chip's remove button.
 *
 * Look: the framed `fieldVariants` field (border, surface, focus ring while
 * the input has focus), 50px tall with one row — a framed `Input`'s height
 * with 16px/24px body text; the frame's rows are fixed at 28px chips, so it
 * does not follow another body size the way `Input` does. Chips and the
 * input flow inline, so the input follows the last chip on its line (10rem
 * wide after chips, full width without). The frame keeps the field radius in
 * every Style — it grows to several lines, where a capsule does not fit (as
 * `Textarea`). `className` goes to the frame (layout only); the `ref` and
 * every other prop go to the input. A mousedown on the frame outside a
 * chip's button focuses the input.
 *
 * **Open, the same joined panel as `Combobox`**: field and suggestions read
 * as one surface — one border, one outer radius (the field radius, in every
 * Style), one shadow, no gap, a single divider. Two things it deliberately
 * does not do:
 * - **No growth.** It ignores `--combobox-width` and `--combobox-open-width`
 *   (the search field's palette widths): its width is always its
 *   container's, open and closed. A field that wraps onto several lines would
 *   change height when widened, moving the content below it on open and back
 *   on close. The frame itself is the panel's anchor.
 * - **No footer.** `ComboboxFooter`'s key hints describe a search palette
 *   (↵ open, esc close), not a value list; do not put one into `suggestions`.
 */
const TokenInput = React.forwardRef<HTMLInputElement, TokenInputProps>(
  (
    {
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      shouldFilter,
      filter,
      loop,
      suggestions,
      ...fieldProps
    },
    ref,
  ) => {
    const hasSuggestions = suggestions != null;
    // The uncontrolled state lives here, not in `Combobox` (which is always
    // controlled by this component), so that "no suggestions = closed" also
    // clears it: a list that was open when its suggestions went away does
    // not come back open, on a field cleared by a commit in between, when
    // they return. Adjusted during render (React's "storing information from
    // previous renders" pattern), so no frame shows the stale state.
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    if (!hasSuggestions && uncontrolledOpen) setUncontrolledOpen(false);
    const isControlled = openProp !== undefined;
    const open = hasSuggestions && (isControlled ? openProp : uncontrolledOpen);

    // Without suggestions an open request is ignored: not stored, not
    // reported. (`Combobox` reports nothing for a close request while it is
    // already closed, so none arrives here either.)
    const handleOpenChange = (next: boolean) => {
      if (!hasSuggestions) return;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };

    return (
      <Combobox
        open={open}
        onOpenChange={handleOpenChange}
        shouldFilter={shouldFilter}
        filter={filter}
        loop={loop}
      >
        <TokenInputField ref={ref} {...fieldProps} />
        {hasSuggestions ? <ComboboxContent>{suggestions}</ComboboxContent> : null}
      </Combobox>
    );
  },
);
TokenInput.displayName = "TokenInput";

export type TokenInputChipTone = "default" | "warning" | "error";

export interface TokenInputChipLabels {
  /** Accessible name of the remove button. Default `"{label} entfernen"`. */
  remove: (label: string) => string;
  /** Screen-reader status of `tone="warning"`. Default "Warnung". */
  warning: string;
  /** Screen-reader status of `tone="error"`. Default "Fehler". */
  error: string;
}

const DEFAULT_CHIP_LABELS: TokenInputChipLabels = {
  remove: (label) => `${label} entfernen`,
  warning: "Warnung",
  error: "Fehler",
};

// Status tones are `Badge`'s filled colours (one mapping); the default chip
// keeps full `on-surface` text — it is a value, not a quiet status label.
const chipTones: Record<TokenInputChipTone, string> = {
  default: "bg-surface-container-high text-on-surface",
  warning: badgeFilledTones.warning,
  error: badgeFilledTones.error,
};

const chipToneIcons = { warning: TriangleAlert, error: CircleX } as const;

export interface TokenInputChipProps
  extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "children"> {
  /** The visible text, also used in the remove button's name. */
  label: string;
  /** Leading slot — an `Avatar` with `size="xs"` (28px, the chip's height). */
  leading?: React.ReactNode;
  /**
   * `warning` (e.g. a person without an account yet, to be invited) and
   * `error` (e.g. a value that cannot be resolved) tint the chip with the
   * status container tokens **and** add a status icon plus a screen-reader
   * status (`labels.warning` / `labels.error`), so colour is never the only
   * signal. Default `default`.
   */
  tone?: TokenInputChipTone;
  /** Shows the × button. Omitted, the chip cannot be removed. */
  onRemove?: () => void;
  labels?: Partial<TokenInputChipLabels>;
}

/**
 * One value in a `TokenInput` (a `listitem`; it must be rendered as one
 * of its children). A pill of the chip's tone: optional leading slot, a
 * status icon for `warning` / `error`, the label (truncated when it is wider
 * than the field) and a remove button named "{label} entfernen". Removing
 * moves focus back to the text input, so the keyboard user is never left on
 * a button that just disappeared.
 */
const TokenInputChip = React.forwardRef<HTMLLIElement, TokenInputChipProps>(
  ({ label, leading, tone = "default", onRemove, labels, className, ...props }, ref) => {
    const chips = React.useContext(TokenInputChipsContext);
    if (!chips) throw new Error("<TokenInputChip> must be rendered inside <TokenInput>.");
    const { remove, ...status } = { ...DEFAULT_CHIP_LABELS, ...labels };
    const ToneIcon = tone === "default" ? null : chipToneIcons[tone];

    return (
      <li
        ref={ref}
        data-slot="token-input-chip"
        data-tone={tone}
        className={cn(
          // Margins, not the frame's gap: the frame lays out inline (see there).
          "my-[3px] mr-1.5 inline-flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-full align-top text-sm",
          chipTones[tone],
          leading ? "pl-0" : ToneIcon ? "pl-2" : "pl-3",
          onRemove ? "pr-0.5" : "pr-3",
          className,
        )}
        {...props}
      >
        {leading}
        {ToneIcon ? <ToneIcon aria-hidden="true" className="size-4 shrink-0" /> : null}
        <span className="min-w-0 truncate">{label}</span>
        {tone === "default" ? null : <span className="sr-only">{`, ${status[tone]}`}</span>}
        {onRemove ? (
          <button
            type="button"
            aria-label={remove(label)}
            disabled={chips.disabled}
            onClick={() => {
              onRemove();
              chips.focusInput();
            }}
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
      </li>
    );
  },
);
TokenInputChip.displayName = "TokenInputChip";

export { TokenInput, TokenInputChip };
