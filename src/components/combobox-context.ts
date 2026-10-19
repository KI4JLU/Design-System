import * as React from "react";

/**
 * The shared engine of `Combobox` and `TokenInput`: the context the
 * `Combobox` root provides to its parts, and the hook every text field of
 * the two components is built on. In its own module so `combobox.tsx` and
 * `token-input.tsx` export nothing but components (react-refresh's "only
 * export components" rule — the reason `sidebar-context.ts` exists too).
 *
 * **Not part of the package API**: `src/index.ts` exports none of it. The
 * listbox, highlight and keyboard model stay cmdk's, held by the one
 * `Combobox` root; `TokenInput` renders that root and the same
 * `ComboboxContent` panel, so there is exactly one listbox and one keyboard
 * model in the library.
 */
export interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  /** DOM id of the highlighted option, as observed by `ComboboxList`. */
  activeId: string | undefined;
  setActiveId: (id: string | undefined) => void;
  /** Sets cmdk's highlighted value (held by the root, passed to cmdk controlled). */
  setHighlighted: (value: string) => void;
  /**
   * Called by `ComboboxItem` after an option was selected. `TokenInput`
   * sets it to clear its text: there an accepted suggestion becomes a chip,
   * so the query that found it is spent.
   */
  afterSelectRef: React.RefObject<(() => void) | null>;
  /** What `ComboboxContent` needs to know about the field it draws around. */
  field: PanelField;
  setField: (patch: Partial<PanelField>) => void;
}

/**
 * The field as `ComboboxContent` draws around it — the panel, not the
 * field, carries the border, radius and focus ring while the list is open.
 * Reported by the text field part.
 * - `shape`: `"control"` — `ComboboxInput`, whose radius follows the Style
 *   like a button; `"field"` — `TokenInput`'s chips frame, field radius in
 *   every Style.
 * - `focused`: the text input has focus (the panel then shows the focus
 *   border and ring the closed field shows).
 * - `invalid`: `aria-invalid` on the field (the panel's border turns red).
 */
export interface PanelField {
  shape: "control" | "field";
  focused: boolean;
  invalid: boolean;
}

export const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

export function useComboboxContext(part: string): ComboboxContextValue {
  const context = React.useContext(ComboboxContext);
  if (!context) throw new Error(`<${part}> must be rendered inside <Combobox>.`);
  return context;
}

interface ComboboxFieldOptions {
  part: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabelledBy?: string;
  /** The field's corner in the open panel — see `PanelField`. */
  shape: PanelField["shape"];
  ariaInvalid?: React.AriaAttributes["aria-invalid"];
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

/**
 * What every text field built on the engine shares (`ComboboxInput`,
 * `TokenInput`'s input): controlled or uncontrolled text, "an edit opens
 * the list", the keys left to the text field while the list is closed, and
 * the ARIA corrections to cmdk's input documented on `ComboboxInput`.
 */
export function useComboboxField({
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
  const { open, setOpen, activeId, setField } = context;
  const invalid = ariaInvalid === true || ariaInvalid === "true";

  // `ComboboxContent` draws the field's border, radius and focus ring while
  // the list is open, so it has to know them.
  React.useLayoutEffect(() => {
    setField({ shape, invalid });
  }, [setField, shape, invalid]);

  const focusHandlers = {
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
      setField({ focused: true });
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
      setField({ focused: false });
    },
  };
  /**
   * List open: the styling hook for the field's half of the joined panel
   * (`data-[panel=open]:` classes). A `data-*` variant comes after
   * `focus-visible:` and `aria-*` in Tailwind's variant order, with the
   * same specificity, so it wins over `Input`'s own focus and invalid border;
   * `TokenInput`'s frame states (`has-*`) outrank it (see
   * `panelChipsFrameClassName` there).
   */
  const panelState = open ? "open" : undefined;
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
