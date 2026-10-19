import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { LoaderCircle } from "lucide-react";

import { cn } from "../lib/utils";
import {
  ComboboxContext,
  useComboboxContext,
  useComboboxField,
  type PanelField,
} from "./combobox-context";
import { Input, type InputProps } from "./input";
import { Kbd, KbdGroup } from "./kbd";
import { menuItemVariants } from "./menu-item-variants";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";

/*
 * The open panel's outer radius for a `ComboboxInput`:
 *   min(var(--ui-radius-control,var(--radius-field)),var(--ui-radius-box,var(--radius-xl)))
 * — the field's own radius (`--ui-radius-control`, the Style's button
 * radius), capped at the Style's multi-line box radius (`--ui-radius-box`).
 * Rounded Style: min(8px, 12px) = 8px, the closed field's corner. Pill Style:
 * min(9999px, 24px) = 24px — a capsule cannot frame a multi-line box, and
 * 24px is within a pixel of the 50px field's capsule corner (25px). A
 * `TokenInput` keeps the field radius (`--radius-field`) in every Style,
 * open or closed. The expression is written out in every class that
 * uses it: Tailwind only generates CSS for class names that appear literally
 * in source (here, and in every consumer compiling these strings from `dist`).
 */

type CommandRootProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>;

export interface ComboboxProps
  extends Omit<CommandRootProps, "value" | "defaultValue" | "onValueChange" | "label"> {
  /** Controlled open state of the list. */
  open?: boolean;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called whenever the combobox asks to open or close the list. */
  onOpenChange?: (open: boolean) => void;
}

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
 * **One look:** field and open list read as ONE surface, as in a command
 * palette — one border, one outer radius, one shadow, no gap, a single
 * `outline-variant` divider between field and list. Closed, the field is the
 * ordinary framed field. See `ComboboxContent` for how the joined geometry
 * is drawn and what it fixes (width, side). Works with the framed field only,
 * not with `ComboboxInput`'s `variant="inline"` / `"title"`.
 *
 * **Single-line only.** `ComboboxInput` is the one field of the family: one
 * line of text, one query. Several values in one field (chips that wrap onto
 * new lines) are a different pattern with its own component,
 * `TokenInput` — it uses the same engine (this root, `ComboboxContent`,
 * `ComboboxList`, `ComboboxItem`) underneath.
 *
 * **Palette widths** (two CSS custom properties on any ancestor):
 * `--combobox-width` sets the closed field's width (capped by its container,
 * centred; unset = the container's full width, as before) and
 * `--combobox-open-width` the width the field grows to while the list is
 * open (an overlay centred on the field, capped by the nearest inline-size
 * container and by the viewport minus the 24px gutters; unset = no growth).
 * `AppShellLayout`'s search slot sets 24rem / 40rem; anywhere else nothing
 * changes until you set them on a wrapper. A `ComboboxFooter` adds the
 * palette's context + key-hint row under the list.
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
 * **Focus never leaves the input** while the list is open: the panel does
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
 * `Command*`'s own props pass through (`shouldFilter`, `filter`, `loop`, …).
 * Two defaults differ from cmdk's, both because the list hangs off a text
 * field: `loop` is on (↓ on the last option wraps to the first), and
 * `vimBindings` is off (Ctrl+N/P/J/K are caret keys in a macOS text field,
 * which cmdk would otherwise swallow). cmdk's `value` / `onValueChange` (the
 * highlighted option) and its visually hidden `label` are not exposed — name
 * the field on `ComboboxInput`.
 */
const Combobox = React.forwardRef<React.ComponentRef<typeof CommandPrimitive>, ComboboxProps>(
  (
    {
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      loop = true,
      vimBindings = false,
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
        field,
        setField,
      }),
      [open, setOpen, activeId, field, setField],
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

/**
 * `ComboboxInput`'s half of the open panel: its top corners take the
 * panel's radius (see `PanelField`), its bottom corners are square, and its
 * own border, focus ring and transition are off — the
 * panel (`ComboboxContent`) draws border and ring around field and list
 * together. Inert while `data-panel` is absent, i.e. while the list is closed.
 */
const panelInputClassName = [
  "data-[panel=open]:rounded-t-[min(var(--ui-radius-control,var(--radius-field)),var(--ui-radius-box,var(--radius-xl)))]",
  "data-[panel=open]:rounded-b-none data-[panel=open]:border-transparent data-[panel=open]:ring-0 data-[panel=open]:transition-none",
].join(" ");

/**
 * `ComboboxInput`'s in-flow box — what the surrounding layout sees, open or closed.
 * Its width is `--combobox-width` capped at the container (`100%`), centred;
 * unset, the field fills its container as before. `AppShellLayout`'s search
 * slot sets it (24rem), so a palette-style search sits narrower than the slot.
 * The box never changes while the list is open: the growth below is an
 * overlay, so neighbours do not move and the row's height stays.
 */
const fieldSlotClassName = "mx-auto w-[min(var(--combobox-width,100%),100%)]";

/**
 * `ComboboxInput`'s anchor growth while the list is open (command-palette
 * style; `TokenInput` never grows): it
 * takes negative inline margins of `min(0px, (100% − W) / 2)` — `100%` being
 * the in-flow box above — so an auto-width block widens to `W`, centred on its
 * box, without changing the box or anything around it (the overflow is
 * painted, not laid out). `W` =
 *   min(var(--combobox-open-width, 0px), 100cqw, 100vw − 2 × var(--spacing-gutter))
 * — the requested palette width, capped by the nearest inline-size container
 * (`AppShellLayout`'s bar row is one; with none, `cqw` is the viewport) and by
 * the viewport minus the 24px gutters. It never shrinks the field: with
 * `--combobox-open-width` unset (`0px`) the margin is 0 and nothing grows —
 * a combobox in a form or dialog keeps its width. `relative z-10` paints the
 * grown field over the bar's side regions. Not animated: the panel is
 * positioned from measurements of this element (Radix / floating-ui, taken
 * once per animation frame — see `ComboboxContent`), so a width transition
 * would show field and panel apart mid-animation. TODO: whether that lag is
 * visible in practice is not yet confirmed (not measured); an instant change
 * also needs no `prefers-reduced-motion` branch. The panel measures this element, so its
 * width (`--radix-popper-anchor-width`) is the grown width.
 */
const fieldGrowClassName =
  "data-[panel=open]:relative data-[panel=open]:z-10 data-[panel=open]:mx-[min(0px,calc((100%_-_min(var(--combobox-open-width,0px),100cqw,100vw_-_2*var(--spacing-gutter)))/2))]";

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
 *   list's real state); `aria-controls` is dropped while the list is
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
      context: { anchorRef },
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
      <div data-slot="combobox-field" className={fieldSlotClassName}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} data-panel={panelState} className={fieldGrowClassName}>
            <CommandPrimitive.Input asChild value={text} onValueChange={handleValueChange}>
              <Input
                ref={ref}
                {...props}
                {...ariaOverrides}
                {...focusHandlers}
                data-panel={panelState}
                className={cn(panelInputClassName, className)}
                onKeyDown={handleKeyDown}
              />
            </CommandPrimitive.Input>
          </div>
        </PopoverAnchor>
      </div>
    );
  },
);
ComboboxInput.displayName = "ComboboxInput";

/**
 * `PopoverContent`'s props. Some cannot take effect, because the panel is
 * joined to the field: `side`, `sideOffset` and `avoidCollisions` are
 * overridden (`"bottom"`, `0`, `false`; `updatePositionStrategy` is forced
 * to `"always"`), `align` makes no visible difference
 * (the panel is exactly the field's width) and a width utility in
 * `className` is ignored. See `ComboboxContent`.
 */
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
 * The open list and the panel it shares with the field — portalled (an
 * `overflow` ancestor such as the app bar cannot clip it) and `z-50`. ONE
 * element draws the whole open surface: it is moved up over the field — its
 * top edge on the field's top edge, exactly the field's width — and draws
 * ONE border, ONE outer radius and ONE `shadow-overlay` around field and
 * list. Its top part is a transparent, `pointer-events: none` window as tall
 * as the field, so the field underneath stays visible and clickable (text
 * selection, caret, a click into the field — none of it reaches the panel).
 * Under the window comes a single `outline-variant` divider, then the list
 * on the panel surface. While open the field drops its own border, ring and
 * bottom corners (`data-panel="open"`), and the panel shows the field's
 * states instead: `primary` border + focus ring while the input has focus,
 * `error` border with `aria-invalid`. Radius: a `ComboboxInput` panel takes
 * the field's radius capped at the Style's box radius (rounded: 8px, pill:
 * 24px); a `TokenInput` panel keeps the field radius.
 *
 * What the panel fixes, overriding props: width = the field's — for a
 * `ComboboxInput`, the grown field's while it is widened to
 * `--combobox-open-width` (see `fieldGrowClassName`) — (a width utility in `className` is ignored, and
 * `align` makes no visible difference), `side="bottom"` and `sideOffset={0}` (a passed `side` or
 * `sideOffset` is overridden), no collision flipping (`avoidCollisions` is
 * forced to `false` — a list that flipped above the field could not join
 * it), `updatePositionStrategy="always"` (see the note at the prop), no
 * padding around the window. `className` reaches the panel element
 * for anything else.
 *
 * It never takes focus: opening does not auto-focus it, closing does not
 * move focus anywhere, a mousedown inside is cancelled so the field keeps
 * focus, and a pointer-down or focus on the field itself does not count as
 * an outside interaction. Radix's `role="dialog"` is removed — the popup's
 * semantics are the listbox inside it.
 *
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
    const { anchorRef, field } = useComboboxContext("ComboboxContent");
    return (
      <PopoverContent
        ref={ref}
        align={align}
        role={undefined}
        data-slot="combobox-content"
        className={cn(
          "overflow-hidden",
          className,
          // Over the field: the wrapper Radix positions sits under the field
          // (sideOffset 0); the panel reaches up by the field's height.
          "pointer-events-none -mt-[var(--radix-popper-anchor-height)] w-[var(--radix-popper-anchor-width)] bg-transparent p-0",
          panelRadius[field.shape],
          panelFrameState(field),
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
        side="bottom"
        sideOffset={0}
        avoidCollisions={false}
        // A `ComboboxInput` resizes itself when the list opens (`fieldGrowClassName`).
        // With Radix's default ("optimized") floating-ui watches the field
        // with a ResizeObserver, and that growth made Chromium report
        // "ResizeObserver loop completed with undelivered notifications"
        // (5 of 25 runs of `Default` with a 952px growth, 0 of 25 with this).
        // "always" follows the field per animation frame instead — one
        // `getBoundingClientRect` per frame, only while the list is open.
        // TODO: why floating-ui's own loop guard (floating-ui#1740) does not
        // catch this case is not yet confirmed.
        updatePositionStrategy="always"
      >
        {/* The window onto the field: its height minus the panel's 1px top
            border and the 1px divider below, so the divider lies on the
            field's own (now transparent) bottom border. */}
        <div
          aria-hidden="true"
          data-slot="combobox-panel-field"
          className="h-[calc(var(--radix-popper-anchor-height)-2px)]"
        />
        {/* Hidden while it shows nothing (only a hidden, option-less list —
            a `ComboboxFooter` alone does not count: it annotates a list, it
            is not one); the panel's bottom border then takes the divider's
            place, so an empty panel has exactly the framed field's box — but
            still the panel's `shadow-overlay` (and focus ring) around it,
            i.e. an open, elevated field with no list. */}
        <div
          data-slot="combobox-panel-body"
          className="pointer-events-auto border-t border-outline-variant bg-surface-container-lowest p-1 not-has-[>:not([hidden],[data-slot=combobox-footer])]:hidden"
        >
          {children}
        </div>
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
 * `TokenInput`), then the list closes. Pass a
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

export interface ComboboxFooterLabels {
  /** Next to the ↵ key. Default "Öffnen". */
  open: string;
  /** Next to the ↑ ↓ keys. Default "Navigieren". */
  navigate: string;
  /** Next to the esc key. Default "Schließen". */
  close: string;
}

const DEFAULT_FOOTER_LABELS: ComboboxFooterLabels = {
  open: "Öffnen",
  navigate: "Navigieren",
  close: "Schließen",
};

export interface ComboboxFooterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The context at the leading edge — what the list searches, e.g. the
   * scope and „Alle Seiten". Plain text (or inline elements around text):
   * no controls, the panel holds nothing focusable.
   */
  children?: React.ReactNode;
  /** The words next to the three key hints. */
  labels?: Partial<ComboboxFooterLabels>;
}

/**
 * The palette's footer row: the context on the left, three key hints on the
 * right (`↵` open, `↑` `↓` navigate, `esc` close, each a `Kbd`). Place it in
 * `ComboboxContent` after `ComboboxList` (and `ComboboxEmpty` /
 * `ComboboxLoading`) — next to the list, not inside it: a listbox may own
 * only options and groups. It sits on the panel surface below a single
 * `outline-variant` divider, edge to edge, as part of the one joined panel,
 * and is shown only while the panel shows something else too (a footer
 * alone does not open an empty panel's list part). In a footer narrower than
 * 28rem (a narrow field, a phone) the hints drop their words and keep the
 * keys; if even the keys do not fit, they wrap onto a second line — nothing
 * runs under the panel's `overflow-hidden`. The context truncates first.
 *
 * Never focusable and not part of the listbox. Assistive tech: the context
 * text is ordinary text (reachable in a screen reader's browse mode, never
 * announced on its own); the key hints are `aria-hidden` — they restate
 * what the combobox role already conveys (↓/↑ move through the options,
 * Enter selects, Escape closes), so reading them out would be noise. Name
 * the scope in the field's own label if it matters to the user.
 */
const ComboboxFooter = React.forwardRef<HTMLDivElement, ComboboxFooterProps>(
  ({ className, children, labels, ...props }, ref) => {
    const words = { ...DEFAULT_FOOTER_LABELS, ...labels };
    return (
      <div
        ref={ref}
        data-slot="combobox-footer"
        className={cn(
          // Edge to edge under the body's `p-1`: the divider spans the panel.
          // An inline-size container: the hints' compact form below keys on
          // the footer's own width, not the viewport's.
          "@container -mx-1 mt-1 -mb-1 border-t border-outline-variant px-3 py-2 text-xs text-on-surface-variant",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-4">
          <div data-slot="combobox-footer-context" className="min-w-0 flex-1 truncate">
            {children}
          </div>
          {/* Compact below a 28rem footer (a narrow field, a phone): the
              words go, the keys stay. The keys alone are ~120px, and should
              even that not fit, the hints wrap onto a second line rather
              than run under the panel's `overflow-hidden`. */}
          <div
            aria-hidden="true"
            data-slot="combobox-footer-hints"
            className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1"
          >
            <span data-slot="combobox-footer-hint" className="inline-flex shrink-0 items-center gap-1.5">
              <Kbd>↵</Kbd>
              <span className="@max-[28rem]:hidden">{words.open}</span>
            </span>
            <span data-slot="combobox-footer-hint" className="inline-flex shrink-0 items-center gap-1.5">
              <KbdGroup>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </KbdGroup>
              <span className="@max-[28rem]:hidden">{words.navigate}</span>
            </span>
            <span data-slot="combobox-footer-hint" className="inline-flex shrink-0 items-center gap-1.5">
              <Kbd>esc</Kbd>
              <span className="@max-[28rem]:hidden">{words.close}</span>
            </span>
          </div>
        </div>
      </div>
    );
  },
);
ComboboxFooter.displayName = "ComboboxFooter";

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxGroup,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxLoading,
  ComboboxSeparator,
  ComboboxFooter,
};
