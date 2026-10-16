import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { CircleX, LoaderCircle, TriangleAlert, X } from "lucide-react";

import { cn } from "../lib/utils";
import { badgeFilledTones } from "./badge-variants";
import { fieldFrameClassName } from "./field-variants";
import { Input, type InputProps } from "./input";
import { menuItemVariants } from "./menu-item-variants";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";

/**
 * Combobox — a text field with a filterable, grouped listbox anchored under
 * it: the WAI-ARIA APG combobox pattern ("list autocomplete"). Assembled from
 * the two libraries the design system already ships, nothing hand-rolled:
 *
 * - **cmdk** (the engine behind `Command`) owns the listbox, the highlight,
 *   the keyboard model (↓/↑ with wrap-around, Home/End, Enter), grouping and
 *   client-side filtering;
 * - **Radix Popover** (`Popover`) owns anchoring, portalling (the list is
 *   never clipped by an `overflow` ancestor such as the app bar) and
 *   dismissal (outside click, focus leaving input + list, Escape).
 *
 * ```tsx
 * <Combobox>
 *   <ComboboxInput aria-label="Suchen" leadingIcon={<Search />} />
 *   <ComboboxContent>
 *     <ComboboxEmpty>Keine Treffer</ComboboxEmpty>
 *     <ComboboxList>
 *       <ComboboxGroup heading="Chats">
 *         <ComboboxItem onSelect={open}>Semesterplanung</ComboboxItem>
 *       </ComboboxGroup>
 *     </ComboboxList>
 *   </ComboboxContent>
 * </Combobox>
 * ```
 *
 * **Focus never leaves the input** while the list is open: the popover does
 * not auto-focus itself, a mousedown in the list is cancelled so clicking an
 * option cannot blur the field, and the highlighted option is announced via
 * `aria-activedescendant`. Consequently nothing *inside* `ComboboxContent`
 * can receive focus — it holds options, not controls.
 *
 * **Two filtering modes.**
 * - *client* (default): cmdk filters and ranks the rendered items against
 *   the input text (`filter` swaps the scorer, `keywords` on an item widen
 *   the match).
 * - *server*: pass `shouldFilter={false}`, render exactly the items your
 *   request returned, show `ComboboxLoading` while it is in flight and
 *   `ComboboxEmpty` when it came back empty. **Stale responses are the
 *   consumer's job**: a slow answer to an old query that arrives after a
 *   newer one will be rendered unless you discard it (abort the previous
 *   request or compare the query it was made for).
 *
 * **Open state** is uncontrolled by default (`defaultOpen`), or controlled via
 * `open` / `onOpenChange` — e.g. to keep the list closed below a minimum
 * query length. Typing and ↓ request `onOpenChange(true)`; outside click,
 * focus leaving input + list, Escape and selecting an item request
 * `onOpenChange(false)`. On a keystroke `ComboboxInput`'s `onValueChange`
 * fires *before* `onOpenChange(true)`.
 *
 * **Chips mode** (several values in one field): use `ComboboxChipsInput` with
 * `ComboboxChip` children in place of `ComboboxInput` — see there.
 *
 * **Layout** (`layout`, default `"popover"`): where the open list goes.
 * - `"popover"`: a separate floating panel under the field, with its own
 *   border, radius and shadow and a 4px gap — the look of every release
 *   before this prop existed.
 * - `"panel"`: the field and the open list read as ONE surface, as in a
 *   command palette — one border, one outer radius, one shadow, no gap, a
 *   single `outline-variant` divider between field and list. Closed, the
 *   field looks exactly as in `"popover"`. See `ComboboxContent` for how
 *   the joined geometry is drawn and what it changes (width, side).
 *
 * `Command*`'s own props pass through (`shouldFilter`, `filter`, `loop`, …).
 * Two defaults differ from cmdk's, both because the list hangs off a text
 * field: `loop` is on (↓ on the last option wraps to the first), and
 * `vimBindings` is off (Ctrl+N/P/J/K are caret keys in a macOS text field,
 * which cmdk would otherwise swallow). cmdk's `value` / `onValueChange` (the
 * highlighted option) and its visually hidden `label` are not exposed — name
 * the field on `ComboboxInput`.
 */
interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  /** DOM id of the highlighted option, as observed by `ComboboxList`. */
  activeId: string | undefined;
  setActiveId: (id: string | undefined) => void;
  /** Sets cmdk's highlighted value (held here, passed to cmdk controlled). */
  setHighlighted: (value: string) => void;
  /**
   * Called by `ComboboxItem` after an option was selected. `ComboboxChipsInput`
   * sets it to clear its text: in chips mode an accepted suggestion becomes a
   * chip, so the query that found it is spent.
   */
  afterSelectRef: React.RefObject<(() => void) | null>;
  /** `Combobox`'s `layout`. */
  layout: ComboboxLayout;
  /** What `ComboboxContent` needs to know about the field in `"panel"` layout. */
  field: PanelField;
  setField: (patch: Partial<PanelField>) => void;
}

/**
 * Where the open list goes — see `Combobox`. `"popover"` (default): a
 * separate floating panel under the field. `"panel"`: field and list are one
 * surface.
 */
export type ComboboxLayout = "popover" | "panel";

/**
 * The field as `ComboboxContent` draws around it in `"panel"` layout — the
 * panel, not the field, carries the border, radius and focus ring while the
 * list is open. Reported by the text field part.
 * - `shape`: `"control"` — `ComboboxInput`, whose radius follows the Style
 *   like a button; `"field"` — `ComboboxChipsInput`, field radius in every
 *   Style.
 * - `focused`: the text input has focus (the panel then shows the focus
 *   border and ring the closed field shows).
 * - `invalid`: `aria-invalid` on the field (the panel's border turns red).
 */
interface PanelField {
  shape: "control" | "field";
  focused: boolean;
  invalid: boolean;
}

/*
 * The open panel's outer radius for a `ComboboxInput`:
 *   min(var(--ui-radius-control,var(--radius-field)),var(--ui-radius-box,var(--radius-xl)))
 * — the field's own radius (`--ui-radius-control`, the Style's button
 * radius), capped at the Style's multi-line box radius (`--ui-radius-box`).
 * Rounded Style: min(8px, 12px) = 8px, the closed field's corner. Pill Style:
 * min(9999px, 24px) = 24px — a capsule cannot frame a multi-line box, and
 * 24px is within a pixel of the 50px field's capsule corner (25px). A
 * `ComboboxChipsInput` keeps the field radius (`--radius-field`) in every
 * Style, open or closed. The expression is written out in every class that
 * uses it: Tailwind only generates CSS for class names that appear literally
 * in source (here, and in every consumer compiling these strings from `dist`).
 */

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

function useComboboxContext(part: string): ComboboxContextValue {
  const context = React.useContext(ComboboxContext);
  if (!context) throw new Error(`<${part}> must be rendered inside <Combobox>.`);
  return context;
}

type CommandRootProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>;

export interface ComboboxProps
  extends Omit<CommandRootProps, "value" | "defaultValue" | "onValueChange" | "label"> {
  /** Controlled open state of the list. */
  open?: boolean;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called whenever the combobox asks to open or close the list. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Where the open list goes. `"popover"` (default): a separate floating
   * panel under the field. `"panel"`: field and list read as one surface —
   * one border, one outer radius, one shadow, no gap (a command palette that
   * grows out of the search field). Closed, both look the same. Works with
   * `ComboboxInput` and `ComboboxChipsInput` (framed field only — not with
   * `ComboboxInput`'s `variant="inline"` / `"title"`). See `ComboboxContent`.
   */
  layout?: ComboboxLayout;
}

const Combobox = React.forwardRef<React.ComponentRef<typeof CommandPrimitive>, ComboboxProps>(
  (
    {
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      loop = true,
      vimBindings = false,
      layout = "popover",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : uncontrolledOpen;
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = React.useState<string | undefined>(undefined);
    // cmdk's highlight, held here so `ComboboxList` can restore it — see there.
    const [highlighted, setHighlighted] = React.useState("");
    const afterSelectRef = React.useRef<(() => void) | null>(null);
    const [field, setFieldState] = React.useState<PanelField>({
      shape: "control",
      focused: false,
      invalid: false,
    });
    const setField = React.useCallback((patch: Partial<PanelField>) => {
      setFieldState((current) => {
        const next = { ...current, ...patch };
        return next.shape === current.shape &&
          next.focused === current.focused &&
          next.invalid === current.invalid
          ? current
          : next;
      });
    }, []);

    const setOpen = React.useCallback(
      (next: boolean) => {
        if (next === open) return;
        if (!isControlled) setUncontrolledOpen(next);
        onOpenChange?.(next);
      },
      [open, isControlled, onOpenChange],
    );

    const context = React.useMemo(
      () => ({
        open,
        setOpen,
        anchorRef,
        activeId,
        setActiveId,
        setHighlighted,
        afterSelectRef,
        layout,
        field,
        setField,
      }),
      [open, setOpen, activeId, layout, field, setField],
    );

    return (
      <ComboboxContext.Provider value={context}>
        <Popover open={open} onOpenChange={setOpen}>
          <CommandPrimitive
            ref={ref}
            loop={loop}
            vimBindings={vimBindings}
            value={highlighted}
            onValueChange={setHighlighted}
            className={cn("relative w-full", className)}
            {...props}
          >
            {children}
          </CommandPrimitive>
        </Popover>
      </ComboboxContext.Provider>
    );
  },
);
Combobox.displayName = "Combobox";

export interface ComboboxInputProps
  extends Omit<InputProps, "value" | "defaultValue" | "onChange" | "type" | "id"> {
  /** Controlled text of the field. */
  value?: string;
  /** Initial text when uncontrolled. */
  defaultValue?: string;
  /** Called with the new text on every edit. */
  onValueChange?: (value: string) => void;
}

interface ComboboxFieldOptions {
  part: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabelledBy?: string;
  /** The field's corner in `"panel"` layout — see `PanelField`. */
  shape: PanelField["shape"];
  ariaInvalid?: React.AriaAttributes["aria-invalid"];
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

/**
 * What every text field of the family shares (`ComboboxInput`,
 * `ComboboxChipsInput`): controlled or uncontrolled text, "an edit opens the
 * list", the keys left to the text field while the list is closed, and the
 * ARIA corrections to cmdk's input documented on `ComboboxInput`.
 */
function useComboboxField({
  part,
  value,
  defaultValue,
  onValueChange,
  ariaLabelledBy,
  shape,
  ariaInvalid,
  onFocus,
  onBlur,
}: ComboboxFieldOptions) {
  const context = useComboboxContext(part);
  const { open, setOpen, activeId, layout, setField } = context;
  const invalid = ariaInvalid === true || ariaInvalid === "true";

  const panel = layout === "panel";

  // `"panel"` layout only: `ComboboxContent` draws the field's border, radius
  // and focus ring while the list is open, so it has to know them. In
  // `"popover"` layout nothing is reported and nothing re-renders.
  React.useLayoutEffect(() => {
    if (panel) setField({ shape, invalid });
  }, [panel, setField, shape, invalid]);

  const focusHandlers = {
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
      if (panel) setField({ focused: true });
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
      if (panel) setField({ focused: false });
    },
  };
  /**
   * `"panel"` layout, list open: the styling hook for the field's half of the
   * joined panel (`data-[panel=open]:` classes). A `data-*` variant comes
   * after `focus-visible:` and `aria-*` in Tailwind's variant order, with the
   * same specificity, so it wins over `Input`'s own focus and invalid border;
   * the chips frame's `has-*` states outrank it (see
   * `panelChipsFrameClassName`).
   */
  const panelState = panel && open ? "open" : undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const text = isControlled ? value : uncontrolledValue;

  const setText = (next: string) => {
    if (!isControlled) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  /** cmdk's `onValueChange`: every edit of the text asks the list to open. */
  const handleValueChange = (next: string) => {
    setText(next);
    setOpen(true);
  };

  /** Run after the consumer's `onKeyDown`. */
  const handleClosedListKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.defaultPrevented || open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
    // cmdk's root handler calls preventDefault() on these unconditionally —
    // with no list on screen that would only take the keys away from the
    // text field (caret movement, implicit form submission).
    if (["ArrowDown", "ArrowUp", "Enter", "Home", "End"].includes(event.key)) {
      event.stopPropagation();
    }
  };

  // The child's props win over cmdk's in Radix Slot's merge — that is what
  // lets these keys override the attributes `Command.Input` hard-codes.
  // A key present with `undefined` removes cmdk's attribute.
  const ariaOverrides: Record<string, unknown> = {
    "aria-expanded": open,
    "aria-labelledby": ariaLabelledBy,
    "aria-activedescendant": open ? activeId : undefined,
  };
  if (!open) ariaOverrides["aria-controls"] = undefined;

  return {
    context,
    text,
    setText,
    handleValueChange,
    handleClosedListKeys,
    ariaOverrides,
    focusHandlers,
    panelState,
  };
}

/**
 * `ComboboxInput`'s half of the open panel (`"panel"` layout): its top
 * corners take the panel's radius (see `PanelField`), its bottom corners are
 * square, and its own border, focus ring and transition are off — the
 * panel (`ComboboxContent`) draws border and ring around field and list
 * together. Inert while `data-panel` is absent, i.e. closed or `"popover"`.
 */
const panelInputClassName = [
  "data-[panel=open]:rounded-t-[min(var(--ui-radius-control,var(--radius-field)),var(--ui-radius-box,var(--radius-xl)))]",
  "data-[panel=open]:rounded-b-none data-[panel=open]:border-transparent data-[panel=open]:ring-0 data-[panel=open]:transition-none",
].join(" ");

/**
 * `ComboboxChipsInput`'s frame: as `panelInputClassName`, but the top corners
 * keep the field radius. Border and ring need `!`: the frame's own states are
 * `has-[input:focus-visible]:` selectors, whose `:has()` argument outranks a
 * `[data-panel=open]` attribute in specificity, whatever the variant order.
 */
const panelChipsFrameClassName =
  "data-[panel=open]:rounded-b-none data-[panel=open]:border-transparent! data-[panel=open]:ring-0! data-[panel=open]:transition-none";

/**
 * The field: the design system's `Input` (same `fieldVariants` look, same
 * `leadingIcon` slot, so a combobox search field is pixel-identical to a plain
 * search `Input`), carrying cmdk's combobox semantics.
 *
 * ARIA — what cmdk emits and what this part corrects (read from cmdk 1.1.1's
 * source, where `Command.Input` hard-codes its attributes):
 * - from cmdk: `role="combobox"`, `aria-autocomplete="list"`,
 *   `aria-controls` → the listbox id, `autocomplete="off"`;
 * - corrected here: `aria-expanded` (cmdk hard-codes `true`; here it is the
 *   popover's real state); `aria-controls` is dropped while the list is
 *   closed (the listbox is not mounted then); `aria-labelledby` (cmdk points
 *   it at its own, empty, hidden label, which would silence your
 *   `aria-label`) is only set when you pass it; and `aria-activedescendant`
 *   comes from `ComboboxList`, which observes the option carrying
 *   `aria-selected="true"`. cmdk's own `aria-activedescendant` stays empty
 *   for the option it highlights by itself when the list opens (observed
 *   with cmdk 1.1.1), so a screen reader heard nothing until the first arrow
 *   key.
 *
 * **Name it** with `aria-label` or `aria-labelledby`. There is no `id` prop:
 * cmdk keeps focus in the field by looking it up under its own id.
 *
 * Keyboard while **closed**: ↓ opens the list; Enter, Home, End and ↑ keep
 * their native text-field meaning (a surrounding form submits on Enter).
 * While **open** cmdk owns ↓/↑/Home/End/Enter, and Enter never submits a
 * form. To act on Enter yourself (e.g. "search everything" when no option is
 * highlighted), handle `onKeyDown` and call `preventDefault()` — cmdk skips
 * a prevented event.
 *
 * Selecting an option does not write its text into the field; set `value` in
 * the item's `onSelect` if your pattern wants that.
 */
const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      onKeyDown,
      onFocus,
      onBlur,
      className,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const {
      context: { anchorRef, layout },
      text,
      handleValueChange,
      handleClosedListKeys,
      ariaOverrides,
      focusHandlers,
      panelState,
    } = useComboboxField({
      part: "ComboboxInput",
      value,
      defaultValue,
      onValueChange,
      ariaLabelledBy,
      shape: "control",
      ariaInvalid: props["aria-invalid"],
      onFocus,
      onBlur,
    });

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      handleClosedListKeys(event);
    };

    return (
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="w-full">
          <CommandPrimitive.Input asChild value={text} onValueChange={handleValueChange}>
            <Input
              ref={ref}
              {...props}
              {...ariaOverrides}
              {...focusHandlers}
              data-panel={panelState}
              className={cn(layout === "panel" && panelInputClassName, className)}
              onKeyDown={handleKeyDown}
            />
          </CommandPrimitive.Input>
        </div>
      </PopoverAnchor>
    );
  },
);
ComboboxInput.displayName = "ComboboxInput";

/* ------------------------------------------------------------------------ */
/* Chips mode: several values in one field                                  */
/* ------------------------------------------------------------------------ */

interface ComboboxChipsContextValue {
  focusInput: () => void;
  disabled: boolean;
}

const ComboboxChipsContext = React.createContext<ComboboxChipsContextValue | null>(null);

/** Characters that end one value: comma and line breaks (paste). */
const CHIP_SEPARATORS = /[,\r\n]+/;

export interface ComboboxChipsInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<"input">,
    "value" | "defaultValue" | "onChange" | "type" | "id" | "children"
  > {
  /** The chips — `ComboboxChip` elements, in display order. */
  children?: React.ReactNode;
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

/**
 * Chips mode of the Combobox: one field frame holding several values as
 * chips plus the text input, wrapping onto new lines as it fills. Use it in
 * place of `ComboboxInput` inside `<Combobox>`; the suggestions are the same
 * `ComboboxContent` / `ComboboxList` / `ComboboxItem` as everywhere else, and
 * the input is the same cmdk combobox with the same ARIA corrections.
 *
 * ```tsx
 * <Combobox shouldFilter={false}>
 *   <ComboboxChipsInput
 *     aria-label="Benutzernamen"
 *     value={query}
 *     onValueChange={setQuery}
 *     onCommit={(names) => setPeople((p) => [...p, ...names.map(resolve)])}
 *     onRemoveLast={() => setPeople((p) => p.slice(0, -1))}
 *   >
 *     {people.map((p) => (
 *       <ComboboxChip key={p.id} label={p.name} onRemove={() => remove(p.id)} />
 *     ))}
 *   </ComboboxChipsInput>
 *   <ComboboxContent>
 *     <ComboboxList>
 *       {suggestions.map((s) => (
 *         <ComboboxItem key={s.id} value={s.id} onSelect={() => add(s)}>{s.name}</ComboboxItem>
 *       ))}
 *     </ComboboxList>
 *   </ComboboxContent>
 * </Combobox>
 * ```
 *
 * **Controlled data, no fetching.** The chips are your state: render one
 * `ComboboxChip` per value. The component only reports gestures —
 * `onCommit` (typed text), `ComboboxItem`'s `onSelect` (a suggestion),
 * `onRemoveLast` (Backspace) and `ComboboxChip`'s `onRemove`.
 *
 * Keyboard, on top of `ComboboxInput`'s:
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
 * `aria-label` / `aria-labelledby` (no `id` prop, as on `ComboboxInput`).
 * `aria-invalid` on the field turns the frame's border red, like `Input`.
 * `disabled` disables the input and every chip's remove button.
 *
 * Look: the framed `fieldVariants` field (border, surface, focus ring while
 * the input has focus), 50px tall with one row — a framed `Input`'s height
 * with 16px/24px body text; the frame's rows are fixed at 28px chips, so it
 * does not follow another body size the way `Input` does. Chips
 * and the input flow inline, so the input follows the last chip on its line
 * (10rem wide after chips, full width without). The
 * frame keeps the field radius in every Style — it grows to several lines,
 * where a capsule does not fit (as `Textarea`). `className` goes to the
 * frame (layout only); every other prop goes to the input. A mousedown on
 * the frame outside a chip's button focuses the input.
 */
const ComboboxChipsInput = React.forwardRef<HTMLInputElement, ComboboxChipsInputProps>(
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
      part: "ComboboxChipsInput",
      value,
      defaultValue,
      onValueChange,
      ariaLabelledBy,
      shape: "field",
      ariaInvalid: props["aria-invalid"],
      onFocus,
      onBlur,
    });
    const { open, setOpen, anchorRef, activeId, afterSelectRef, layout } = context;
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
      <ComboboxChipsContext.Provider value={chipsContext}>
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            data-slot="combobox-chips-input"
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
              layout === "panel" && panelChipsFrameClassName,
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
      </ComboboxChipsContext.Provider>
    );
  },
);
ComboboxChipsInput.displayName = "ComboboxChipsInput";

export type ComboboxChipTone = "default" | "warning" | "error";

export interface ComboboxChipLabels {
  /** Accessible name of the remove button. Default `"{label} entfernen"`. */
  remove: (label: string) => string;
  /** Screen-reader status of `tone="warning"`. Default "Warnung". */
  warning: string;
  /** Screen-reader status of `tone="error"`. Default "Fehler". */
  error: string;
}

const DEFAULT_CHIP_LABELS: ComboboxChipLabels = {
  remove: (label) => `${label} entfernen`,
  warning: "Warnung",
  error: "Fehler",
};

// Status tones are `Badge`'s filled colours (one mapping); the default chip
// keeps full `on-surface` text — it is a value, not a quiet status label.
const chipTones: Record<ComboboxChipTone, string> = {
  default: "bg-surface-container-high text-on-surface",
  warning: badgeFilledTones.warning,
  error: badgeFilledTones.error,
};

const chipToneIcons = { warning: TriangleAlert, error: CircleX } as const;

export interface ComboboxChipProps
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
  tone?: ComboboxChipTone;
  /** Shows the × button. Omitted, the chip cannot be removed. */
  onRemove?: () => void;
  labels?: Partial<ComboboxChipLabels>;
}

/**
 * One value in a `ComboboxChipsInput` (a `listitem`; it must be rendered
 * inside one). A pill of the chip's tone: optional leading slot, a status
 * icon for `warning` / `error`, the label (truncated when it is wider than
 * the field) and a remove button named "{label} entfernen". Removing moves
 * focus back to the text input, so the keyboard user is never left on a
 * button that just disappeared.
 */
const ComboboxChip = React.forwardRef<HTMLLIElement, ComboboxChipProps>(
  ({ label, leading, tone = "default", onRemove, labels, className, ...props }, ref) => {
    const chips = React.useContext(ComboboxChipsContext);
    if (!chips) throw new Error("<ComboboxChip> must be rendered inside <ComboboxChipsInput>.");
    const { remove, ...status } = { ...DEFAULT_CHIP_LABELS, ...labels };
    const ToneIcon = tone === "default" ? null : chipToneIcons[tone];

    return (
      <li
        ref={ref}
        data-slot="combobox-chip"
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
ComboboxChip.displayName = "ComboboxChip";

export type ComboboxContentProps = React.ComponentPropsWithoutRef<typeof PopoverContent>;

/** The panel's outer radius per field shape — see the note above `ComboboxContext`. */
const panelRadius: Record<PanelField["shape"], string> = {
  control:
    "rounded-[min(var(--ui-radius-control,var(--radius-field)),var(--ui-radius-box,var(--radius-xl)))]",
  field: "rounded-field",
};

/**
 * The panel's border and ring — the closed field's own states
 * (`fieldVariants` default), drawn around field and list together.
 */
const panelFrameState = (field: PanelField) => {
  if (field.invalid) return field.focused ? "border-error ring-2 ring-error" : "border-error";
  return field.focused ? "border-primary ring-2 ring-focus-ring" : "";
};

/**
 * The popover panel under the field (portalled, `z-50`). Its width follows
 * the field (`--radix-popper-anchor-width`); a width utility in `className`
 * overrides it. `align` defaults to `start`.
 *
 * It never takes focus: opening does not auto-focus it, closing does not
 * move focus anywhere, a mousedown inside is cancelled so the field keeps
 * focus, and a pointer-down or focus on the field itself does not count as
 * an outside interaction. Radix's `role="dialog"` is removed — the popup's
 * semantics are the listbox inside it.
 *
 * **`layout="panel"`** (on `Combobox`): one element draws the whole open
 * surface. The (still portalled, still `z-50`) content is moved up over the
 * field — its top edge on the field's top edge, exactly the field's width —
 * and draws ONE border, ONE outer radius and ONE `shadow-overlay` around
 * field and list. Its top part is a transparent, `pointer-events: none`
 * window as tall as the field, so the field underneath stays visible and
 * clickable (text selection, caret, a click into the field — none of it
 * reaches the panel). Under the window comes a single `outline-variant`
 * divider, then the list on the panel surface. While open the field drops
 * its own border, ring and bottom corners (`data-panel="open"`), and the
 * panel shows the field's states instead: `primary` border + focus ring
 * while the input has focus, `error` border with `aria-invalid`.
 * Radius: a `ComboboxInput` panel takes the field's radius capped at the
 * Style's box radius (rounded: 8px, pill: 24px); a `ComboboxChipsInput`
 * panel keeps the field radius. What `"panel"` fixes, overriding props:
 * width = the field's (a width utility in `className` is ignored), `side`
 * `bottom`, no collision flipping (`avoidCollisions={false}` — a list that
 * flipped above the field could not join it), no padding around the window.
 * TODO: the list's 20rem cap is not shortened to the space left below the
 * field (not yet confirmed whether a consumer needs it — JustRAG's search
 * sits in a 64px top bar).
 */
const ComboboxContent = React.forwardRef<
  React.ComponentRef<typeof PopoverContent>,
  ComboboxContentProps
>(
  (
    {
      className,
      align = "start",
      onOpenAutoFocus,
      onCloseAutoFocus,
      onInteractOutside,
      onMouseDown,
      children,
      ...props
    },
    ref,
  ) => {
    const { anchorRef, layout, field } = useComboboxContext("ComboboxContent");
    const panel = layout === "panel";
    return (
      <PopoverContent
        ref={ref}
        align={align}
        role={undefined}
        data-layout={layout}
        className={cn(
          "w-[var(--radix-popper-anchor-width)] overflow-hidden p-1",
          className,
          panel && [
            // Over the field: the wrapper Radix positions sits under the
            // field (sideOffset 0); the panel reaches up by the field's height.
            "pointer-events-none -mt-[var(--radix-popper-anchor-height)] w-[var(--radix-popper-anchor-width)] bg-transparent p-0",
            panelRadius[field.shape],
            panelFrameState(field),
          ],
        )}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          onInteractOutside?.(event);
          const target = event.target;
          if (target instanceof Node && anchorRef.current?.contains(target)) {
            event.preventDefault();
          }
        }}
        onMouseDown={(event) => {
          onMouseDown?.(event);
          event.preventDefault();
        }}
        {...props}
        {...(panel ? { side: "bottom", sideOffset: 0, avoidCollisions: false } : null)}
      >
        {panel ? (
          <>
            {/* The window onto the field: its height minus the panel's 1px
                top border and the 1px divider below, so the divider lies on
                the field's own (now transparent) bottom border. */}
            <div
              aria-hidden="true"
              data-slot="combobox-panel-field"
              className="h-[calc(var(--radix-popper-anchor-height)-2px)]"
            />
            {/* Hidden while it shows nothing (only a hidden, option-less
                list); the panel's bottom border then takes the divider's
                place, so an empty panel has exactly the framed field's box
                — but still the panel's `shadow-overlay` (and focus ring)
                around it, i.e. an open, elevated field with no list. */}
            <div
              data-slot="combobox-panel-body"
              className="pointer-events-auto border-t border-outline-variant bg-surface-container-lowest p-1 not-has-[>:not([hidden])]:hidden"
            >
              {children}
            </div>
          </>
        ) : (
          children
        )}
      </PopoverContent>
    );
  },
);
ComboboxContent.displayName = "ComboboxContent";

export interface ComboboxListProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> {
  /** Accessible name of the listbox. Default "Vorschläge". */
  label?: string;
}

/**
 * The `role="listbox"` (cmdk). Scrolls past 20rem; cmdk scrolls the
 * highlighted option into view.
 *
 * It watches its options (a `MutationObserver` on `aria-selected`, the
 * attribute cmdk renders) for two corrections to cmdk 1.1.1, both observed in
 * jsdom and Chromium rather than derived from cmdk's documentation:
 * - it reports the highlighted option's id to `ComboboxInput`'s
 *   `aria-activedescendant` (cmdk's own id misses its automatic highlight);
 * - when options are rendered but none is highlighted, it highlights the
 *   first enabled one — what cmdk itself does on every later keystroke, but
 *   skips when the first keystroke opens the list and mounts the options in
 *   the same update. Without it Enter did nothing right after the first
 *   character.
 * TODO: the root cause inside cmdk's internal update scheduler is not yet
 * confirmed; drop both corrections if a cmdk release fixes it.
 *
 * While it renders no option at all it is `hidden`: an empty `listbox` is an
 * ARIA error (axe `aria-required-children`) and says nothing useful. That is
 * why `ComboboxEmpty` and `ComboboxLoading` go **next to** the list inside
 * `ComboboxContent`, not into it — inside, they would be hidden with it.
 */
const ComboboxList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  ComboboxListProps
>(({ className, label = "Vorschläge", ...props }, ref) => {
  const { setActiveId, setHighlighted } = useComboboxContext("ComboboxList");
  const listRef = React.useRef<HTMLDivElement>(null);
  const [hasOptions, setHasOptions] = React.useState(false);
  React.useImperativeHandle(ref, () => listRef.current as HTMLDivElement, []);

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const sync = () => {
      setHasOptions(list.querySelector("[cmdk-item]") !== null);
      const active = list.querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]');
      setActiveId(active?.id);
      if (active) return;
      const first = list.querySelector<HTMLElement>('[cmdk-item]:not([aria-disabled="true"])');
      const value = first?.getAttribute("data-value");
      if (value) setHighlighted(value);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(list, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-selected", "id"],
    });
    return () => {
      observer.disconnect();
      setActiveId(undefined);
    };
  }, [setActiveId, setHighlighted]);

  return (
    <CommandPrimitive.List
      ref={listRef}
      label={label}
      hidden={!hasOptions}
      className={cn("max-h-80 overflow-x-hidden overflow-y-auto", className)}
      {...props}
    />
  );
});
ComboboxList.displayName = "ComboboxList";

/**
 * A titled group of options. cmdk renders the items in a `role="group"`
 * labelled by the heading (`aria-labelledby`), and in client mode hides the
 * whole group when none of its items match. The heading has `Command`'s
 * group-heading look, inset like the option text (`px-3`, `MenuItem`'s).
 */
const ComboboxGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden text-on-surface [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-on-surface-variant",
      className,
    )}
    {...props}
  />
));
ComboboxGroup.displayName = "ComboboxGroup";

export interface ComboboxItemProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  /**
   * Muted secondary text next to the label (a command palette's
   * description: "gestern", a path, a topic name). One line, truncated
   * first when the row is too narrow. Part of the option's accessible name.
   */
  description?: React.ReactNode;
  /**
   * Keyboard-shortcut hint at the row's trailing edge — a `Kbd` or a
   * `KbdGroup`. Decorative, as `Input`'s `shortcutHint`: hidden from assistive
   * tech and not part of the option's name or `value`.
   */
  shortcutHint?: React.ReactNode;
}

/**
 * The plain text of a label, derived from the React tree: strings and
 * numbers, through nested elements' `children`. It cannot see text a
 * component renders (e.g. `<HitText primary="…" />`): for such a label it
 * returns `""`, or only the plain part of mixed text (`"Chat: "` of
 * `Chat: <X />`) — which is why `ComboboxItem` asks for `value` there.
 */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

/**
 * One option (`role="option"`, `aria-selected` on the highlighted one — cmdk).
 * Speaks the `MenuItem` vocabulary; the highlight uses its hover surface.
 * `onSelect(value)` fires on click and on Enter (and on Tab in a
 * `ComboboxChipsInput`), then the list closes. Pass a
 * stable, unique `value` when the visible text is not unique or changes.
 *
 * Palette rows: `children` is the leading icon and the label; `description`
 * adds muted text next to the label and `shortcutHint` a right-aligned `Kbd`
 * hint. With either set and no `value`, the option's value is the text of
 * `children` alone — so `onSelect` receives the label and client filtering
 * matches the label, not the description or the keys (put the description
 * into `keywords` to match it too). This works only for a **plain-text
 * label** (strings, possibly inside plain elements such as a `<span>`). A
 * label rendered by a component, or mixed text plus a component (e.g.
 * `Chat: <X />`), **must pass `value`**. Without it, a mixed label's value
 * is its plain part alone, and a component label's falls back to cmdk's
 * text of the whole row, description included. cmdk (1.1.1) reads that
 * text from the rendered row, so the row has no value before it has
 * rendered once: when the list is opened by typing, such a row matches no
 * query; only after the query is cleared and the row shown does it match,
 * and `onSelect` then receives the whole row's text. Pass `value` too
 * whenever the label is not unique; it always wins. Without `description` /
 * `shortcutHint`, cmdk's own rule applies unchanged: a single string child
 * is the value, any other children the row's rendered text, with the same
 * gap when the list is opened by typing.
 */
const ComboboxItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  ComboboxItemProps
>(({ className, onSelect, description, shortcutHint, value, children, ...props }, ref) => {
  const { setOpen, afterSelectRef } = useComboboxContext("ComboboxItem");
  const palette = description != null || shortcutHint != null;
  const label = textOf(children).trim();
  return (
    <CommandPrimitive.Item
      ref={ref}
      value={value ?? (palette && label !== "" ? label : undefined)}
      className={cn(
        menuItemVariants(),
        "cursor-default rounded-lg select-none",
        "data-[selected=true]:bg-surface-container-high",
        // A Kbd is `surface-container-high` too: one step up on the
        // highlight. Only on rows with a shortcut hint, so plain rows keep
        // their class list unchanged.
        shortcutHint != null && "data-[selected=true]:[&_[data-slot=kbd]]:bg-surface-container-highest",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-60",
        "[&_svg]:size-4",
        className,
      )}
      onSelect={(selected) => {
        onSelect?.(selected);
        setOpen(false);
        afterSelectRef.current?.();
      }}
      {...props}
    >
      {palette ? (
        <>
          {children}
          {description != null ? (
            <span
              data-slot="combobox-item-description"
              className="min-w-0 truncate text-on-surface-variant"
            >
              {description}
            </span>
          ) : null}
          {shortcutHint != null ? (
            <span
              aria-hidden="true"
              data-slot="combobox-item-shortcut"
              className="ml-auto flex shrink-0 items-center"
            >
              {shortcutHint}
            </span>
          ) : null}
        </>
      ) : (
        // Unchanged for plain rows: a string child is still cmdk's value.
        children
      )}
    </CommandPrimitive.Item>
  );
});
ComboboxItem.displayName = "ComboboxItem";

/**
 * Shown when no option is rendered (client mode: nothing matches; server
 * mode: nothing was returned). Place it in `ComboboxContent` next to
 * `ComboboxList`, not inside it (see `ComboboxList`). In server mode render
 * it only once the request has settled, otherwise it shows during loading
 * too.
 */
const ComboboxEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn("px-3 py-6 text-center text-sm text-on-surface-variant", className)}
    {...props}
  />
));
ComboboxEmpty.displayName = "ComboboxEmpty";

export interface ComboboxLoadingProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Loading> {
  /** Accessible name of the progress indicator. Default "Wird geladen …". */
  label?: string;
}

/**
 * Server mode's in-flight state (cmdk's `role="progressbar"`, with a spinner).
 * Render it conditionally while your request runs, in `ComboboxContent` next
 * to `ComboboxList` (a progressbar is not a valid listbox child); `children`
 * is the visible text (hidden from assistive tech — `label` is announced).
 */
const ComboboxLoading = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Loading>,
  ComboboxLoadingProps
>(({ className, label = "Wird geladen …", children, ...props }, ref) => (
  <CommandPrimitive.Loading
    ref={ref}
    label={label}
    className={cn(
      "flex items-center justify-center px-3 py-6 text-sm text-on-surface-variant [&>div]:flex [&>div]:items-center [&>div]:gap-2",
      className,
    )}
    {...props}
  >
    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
    {children}
  </CommandPrimitive.Loading>
));
ComboboxLoading.displayName = "ComboboxLoading";

/**
 * A rule between groups. cmdk hides it while the field has text; pass
 * `alwaysRender` (e.g. in server mode) to keep it.
 */
const ComboboxSeparator = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-outline-variant", className)}
    {...props}
  />
));
ComboboxSeparator.displayName = "ComboboxSeparator";

export {
  Combobox,
  ComboboxInput,
  ComboboxChipsInput,
  ComboboxChip,
  ComboboxContent,
  ComboboxList,
  ComboboxGroup,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxLoading,
  ComboboxSeparator,
};
