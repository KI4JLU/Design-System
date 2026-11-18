import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Slot } from "@radix-ui/react-slot";
import { createPortal } from "react-dom";

import { cn } from "../lib/utils";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

/** Pointer travel that still counts as resting, in px. */
const REST_SLOP_PX = 4;

type Item = {
  id: string;
  el: HTMLElement;
  side?: Side;
  align?: Align;
  className?: string;
};

/**
 * What the items read. `activeId` and `slotEl` live in a store rather than
 * in context state, so a switch re-renders the two items involved and not
 * every row of a long list.
 */
type Group = {
  subscribe: (listener: () => void) => () => void;
  slotFor: (id: string) => HTMLElement | null;
  enter: (item: Item, e: React.PointerEvent) => void;
  move: (item: Item, e: React.PointerEvent) => void;
  leave: (id: string) => void;
  press: (id: string) => void;
  focus: (item: Item) => void;
  blur: (id: string) => void;
  remove: (id: string) => void;
};

const GroupContext = React.createContext<Group | null>(null);

function prefersReducedMotion() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * Keyboard focus only: a row focused by a click must not open its preview.
 * Focus on a control inside the trigger counts (a chip's remove button).
 */
function isFocusVisible(el: Element) {
  try {
    const focused = el.ownerDocument.activeElement;
    return Boolean(focused && el.contains(focused) && focused.matches(":focus-visible"));
  } catch {
    return true;
  }
}

type Timing = { restDelay: number; warmDuration: number; closeDelay: number };

/**
 * The group's behaviour, outside React: timers and the pointer's state change
 * without rendering, and only `show` / `hide` reach the component.
 */
function createGroup(initial: Timing, setActive: (item: Item) => void, setOpen: (open: boolean) => void) {
  let timing = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const s = {
    activeId: null as string | null,
    slotEl: null as HTMLElement | null,
    open: false,
    /** The item under the pointer, and the one with keyboard focus: a
     *  preview stays while either still holds for its item. */
    hoverId: null as string | null,
    focusId: null as string | null,
    /** The item whose rest timer is running. */
    pendingId: null as string | null,
    /** No preview for this item until the pointer or focus has left it. */
    suppressedId: null as string | null,
    origin: { x: 0, y: 0 },
    closedAt: -Infinity,
    rest: undefined as ReturnType<typeof setTimeout> | undefined,
    close: undefined as ReturnType<typeof setTimeout> | undefined,
  };

  const cancelRest = () => {
    clearTimeout(s.rest);
    s.pendingId = null;
  };
  const show = (item: Item) => {
    cancelRest();
    clearTimeout(s.close);
    s.activeId = item.id;
    s.open = true;
    setActive(item);
    setOpen(true);
    emit();
  };
  /** `cold`: the next item waits for a rest again (press, Escape, scroll). */
  const hide = (cold = false) => {
    cancelRest();
    clearTimeout(s.close);
    if (cold) s.closedAt = -Infinity;
    if (!s.open) return;
    if (!cold) s.closedAt = performance.now();
    s.open = false;
    setOpen(false);
  };
  const arm = (item: Item) => {
    clearTimeout(s.rest);
    s.pendingId = item.id;
    s.rest = setTimeout(() => show(item), timing.restDelay);
  };
  const isWarm = () => s.open || performance.now() - s.closedAt < timing.warmDuration;
  const scheduleClose = () => {
    clearTimeout(s.close);
    s.close = setTimeout(() => hide(), timing.closeDelay);
  };
  const begin = (item: Item) => {
    clearTimeout(s.close);
    if (s.open && s.activeId === item.id) return;
    if (isWarm()) show(item);
    else arm(item);
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    slotFor: (id: string) => (s.activeId === id ? s.slotEl : null),
    enter: (item: Item, e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      s.hoverId = item.id;
      if (s.suppressedId === item.id) return;
      s.origin = { x: e.clientX, y: e.clientY };
      begin(item);
    },
    move: (item: Item, e: React.PointerEvent) => {
      if (e.pointerType === "touch" || s.suppressedId === item.id) return;
      if (s.open && s.activeId === item.id) return;
      const moved = Math.hypot(e.clientX - s.origin.x, e.clientY - s.origin.y) > REST_SLOP_PX;
      // Still within the slop of where the timer started: let it run.
      if (s.pendingId === item.id && !moved) return;
      s.origin = { x: e.clientX, y: e.clientY };
      arm(item);
    },
    leave: (id: string) => {
      if (s.hoverId === id) s.hoverId = null;
      if (s.focusId === id) return;
      if (s.pendingId === id) cancelRest();
      if (s.suppressedId === id) s.suppressedId = null;
      if (s.open && s.activeId === id) scheduleClose();
    },
    press: (id: string) => {
      s.suppressedId = id;
      hide(true);
    },
    focus: (item: Item) => {
      if (!isFocusVisible(item.el)) return;
      s.focusId = item.id;
      if (s.suppressedId === item.id) return;
      begin(item);
    },
    blur: (id: string) => {
      if (s.focusId === id) s.focusId = null;
      if (s.hoverId === id) return;
      if (s.pendingId === id) cancelRest();
      if (s.suppressedId === id) s.suppressedId = null;
      if (s.open && s.activeId === id) scheduleClose();
    },
    remove: (id: string) => {
      if (s.hoverId === id) s.hoverId = null;
      if (s.focusId === id) s.focusId = null;
      if (s.pendingId === id) cancelRest();
      if (s.activeId === id) hide(true);
    },
    // For the group itself, not the items.
    hide,
    /** The pointer left the card: close, unless its item still has the pointer or focus. */
    cardLeave: () => {
      if (s.activeId !== null && (s.hoverId === s.activeId || s.focusId === s.activeId)) return;
      scheduleClose();
    },
    cancelClose: () => clearTimeout(s.close),
    suppressActive: () => {
      s.suppressedId = s.activeId;
    },
    setSlot: (el: HTMLElement | null) => {
      s.slotEl = el;
      emit();
    },
    setTiming: (next: Timing) => {
      timing = next;
    },
    dispose: () => {
      clearTimeout(s.rest);
      clearTimeout(s.close);
    },
  };
}

export interface HoverPreviewGroupProps {
  children: React.ReactNode;
  /** How long the pointer has to rest on an item before its preview opens, in ms. */
  restDelay?: number;
  /**
   * How long the group stays warm after its preview closed, in ms: an item
   * entered within it shows its preview at once.
   */
  warmDuration?: number;
  /** Grace period for the pointer to reach the next item or the card, in ms. */
  closeDelay?: number;
  /** Where the card opens; an item's own `side` wins. Default `top`. */
  side?: Side;
  /** Default `start`. */
  align?: Align;
  sideOffset?: number;
  /** Classes for the card; an item's own `className` is added on top. */
  className?: string;
}

/**
 * The previews of a list, a rail or a row of chips, as one calm surface.
 *
 * - **Rest, not pass.** A preview opens once the pointer has been still on an
 *   item for `restDelay`. Moving across the items opens nothing.
 * - **Warm.** While a preview is open (and for `warmDuration` after), the
 *   next item shows its preview at once.
 * - **One card.** The group renders a single card. It moves to the next item
 *   and fades the new content in, instead of closing and reopening. With
 *   reduced motion it does not slide.
 *
 * Keyboard focus opens a preview the same way (after the rest delay, at once
 * while warm). A press on the item (pointer, Enter or Space), Escape and any
 * scroll close it. Touch
 * opens nothing: a preview is a pointer and keyboard affordance, so whatever
 * it shows must be reachable another way.
 *
 * A `HoverPreview` outside a group is a group of one.
 */
function HoverPreviewGroup({
  children,
  restDelay = 400,
  warmDuration = 300,
  closeDelay = 100,
  side = "top",
  align = "start",
  sideOffset = 4,
  className,
}: HoverPreviewGroupProps) {
  const [active, setActive] = React.useState<Item | null>(null);
  const [open, setOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  // The card's anchor: the active item's element (Radix `virtualRef`). Set in
  // a layout effect, which runs before the anchor's own effect reads it.
  const anchorRef = React.useRef<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    anchorRef.current = active?.el ?? null;
  }, [active]);
  const [group] = React.useState(() => createGroup({ restDelay, warmDuration, closeDelay }, setActive, setOpen));
  React.useEffect(() => {
    group.setTiming({ restDelay, warmDuration, closeDelay });
  }, [group, restDelay, warmDuration, closeDelay]);

  React.useEffect(() => group.dispose, [group]);
  const setSlot = React.useCallback((el: HTMLDivElement | null) => group.setSlot(el), [group]);

  // The card is anchored to its item: scrolling would carry it away from it.
  // Not only while it is open: a scroll during the rest delay moves the item
  // from under the pointer, so it cancels the pending preview too.
  React.useEffect(() => {
    const close = () => group.hide(true);
    // Capture: scroll events do not bubble, and the scroller is an ancestor.
    window.addEventListener("scroll", close, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", close, { capture: true });
  }, [group]);

  // Slide to the next item only on a switch; a card that opens appears in place.
  const shown = React.useRef<{ open: boolean; id: string | null }>({ open: false, id: null });
  React.useLayoutEffect(() => {
    const id = active?.id ?? null;
    const wrapper = contentRef.current?.parentElement;
    if (wrapper) {
      const switched = open && shown.current.open && shown.current.id !== id;
      wrapper.style.transition =
        switched && !prefersReducedMotion() ? "transform 200ms cubic-bezier(0.2, 0, 0, 1)" : "none";
    }
    shown.current = { open, id };
  }, [active, open]);

  return (
    <GroupContext.Provider value={group}>
      {children}
      <PopoverPrimitive.Root
        open={open}
        onOpenChange={(next) => {
          // Escape or a press outside (Radix): gone until asked for again.
          if (next) return;
          group.suppressActive();
          group.hide(true);
        }}
      >
        <PopoverPrimitive.Anchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            ref={contentRef}
            // A preview, not a dialog: no role, and focus stays where it is.
            role={undefined}
            data-slot="hover-preview"
            side={active?.side ?? side}
            align={active?.align ?? align}
            sideOffset={sideOffset}
            collisionPadding={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            // Focus moving on is the items' business (blur), not a dismissal.
            onFocusOutside={(e) => e.preventDefault()}
            // The pointer may move onto the card (WCAG 1.4.13).
            onPointerEnter={group.cancelClose}
            onPointerLeave={group.cardLeave}
            className={cn(
              "z-50 w-auto rounded-xl border bg-surface-container-lowest p-2 text-on-surface shadow-overlay outline-none duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              className,
              active?.className,
            )}
          >
            <div ref={setSlot} />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </GroupContext.Provider>
  );
}

type TriggerProps = React.HTMLAttributes<HTMLElement>;

export interface HoverPreviewProps {
  /** The preview: usually a `FilePreview`. Rendered only while it shows. */
  content: React.ReactNode;
  /** The trigger. It gets the hover and focus handlers (`Slot`), so it must forward props and ref. */
  children: React.ReactElement<TriggerProps>;
  /** Where the card opens for this item; default: the group's. */
  side?: Side;
  align?: Align;
  /** Classes for the card while it shows this item. */
  className?: string;
  /** No preview; the trigger renders untouched. */
  disabled?: boolean;
}

function HoverPreviewItem({ content, children, side, align, className, disabled = false }: HoverPreviewProps) {
  const group = React.useContext(GroupContext)!;
  const id = React.useId();
  const elRef = React.useRef<HTMLElement | null>(null);
  const slot = React.useSyncExternalStore(
    group.subscribe,
    () => group.slotFor(id),
    () => null,
  );

  React.useEffect(() => () => group.remove(id), [group, id]);
  React.useEffect(() => {
    if (disabled) group.remove(id);
  }, [disabled, group, id]);

  const item = (): Item | null => {
    const el = elRef.current;
    return el && !disabled ? { id, el, side, align, className } : null;
  };

  return (
    <>
      <Slot
        ref={elRef}
        onPointerEnter={(e: React.PointerEvent) => {
          const it = item();
          if (it) group.enter(it, e);
        }}
        onPointerMove={(e: React.PointerEvent) => {
          const it = item();
          if (it) group.move(it, e);
        }}
        onPointerLeave={() => group.leave(id)}
        onPointerDown={() => {
          if (!disabled) group.press(id);
        }}
        // Enter and Space press the trigger too, without a pointer.
        onKeyDown={(e: React.KeyboardEvent) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) group.press(id);
        }}
        onFocus={() => {
          const it = item();
          if (it) group.focus(it);
        }}
        onBlur={() => group.blur(id)}
      >
        {children}
      </Slot>
      {slot &&
        createPortal(
          <div className="animate-in fade-in-0 duration-150 motion-reduce:animate-none">{content}</div>,
          slot,
        )}
    </>
  );
}

/**
 * A preview card for one trigger: it opens when the pointer **rests** on the
 * trigger (or keyboard focus stays on it), never while the pointer is only
 * passing over. Put the triggers of one list, rail or chip row into a
 * `HoverPreviewGroup` and they share one card that moves between them.
 *
 * For a large preview — a picture, a page. A short hint is a `Tooltip`; a
 * card with links or actions in it is a `Popover` (see `InlineCitationCard`).
 * The trigger should not also carry a `title`: the two would show together.
 */
function HoverPreview(props: HoverPreviewProps) {
  const group = React.useContext(GroupContext);
  if (group) return <HoverPreviewItem {...props} />;
  return (
    <HoverPreviewGroup>
      <HoverPreviewItem {...props} />
    </HoverPreviewGroup>
  );
}

export { HoverPreview, HoverPreviewGroup };
