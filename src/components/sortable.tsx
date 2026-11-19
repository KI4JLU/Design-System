import * as React from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, MeasuringStrategy, MouseSensor, TouchSensor, closestCenter, pointerWithin,
  useDndContext, useDraggable, useDroppable, useSensor, useSensors,
  type Active, type Announcements, type Collision, type CollisionDetection, type DragEndEvent, type DragMoveEvent,
  type DraggableAttributes, type DraggableSyntheticListeners, type Over,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { Slot } from "@radix-ui/react-slot";
import { GripHorizontal, GripVertical } from "lucide-react";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";

/* ---------------------------------------------------------------------------
 * Sortable — drag-to-reorder for cards or rows in one or more GROUPS.
 *
 * Hand-built (no registry has "sort inside a group, outline the other group,
 * commit on drop"), on the registries' contract for sortables (ReUI / Dice UI
 * `Sortable` and `Kanban`): a compound of `Sortable` (root) · `SortableGroup`
 * · `SortableItem` · `SortableItemHandle` · `SortableOverlay`, controlled by
 * `value` + `getItemValue`, reporting through `onValueCommit(value, meta)`,
 * `asChild` to render onto the consumer's own element, `data-slot` and
 * `data-dragging` state attributes.
 *
 * BEHAVIOUR. An item sorts within its group — the others slide aside. Over
 * ANOTHER group that group is marked (`data-drop-target`) and its items make
 * room where the item would land; it lands on drop. `value` only changes on a
 * drop, through `onValueCommit`: the room is made with transforms, so the
 * consumer renders nothing differently while dragging.
 *
 * COST. Only items that can be sorted to are drop targets. Items of a locked
 * group are plain draggables: they are neither measured nor re-rendered while
 * something is carried, so a long list stays cheap. An item's element only
 * renders again when its own drag state or place changes.
 *
 * THE WHOLE ITEM IS THE MOUSE/TOUCH HANDLE. A mouse drag starts after 6px of
 * movement, so a click still opens the item. Touch takes a LONG PRESS: a
 * swipe still scrolls and a tap still opens. While the finger holds, the item
 * sinks a little over the press time; when the drag starts the phone gives a
 * short buzz (where `navigator.vibrate` exists). The click a drag ends with
 * is swallowed.
 *
 * THE KEYBOARD HANDLE IS A BUTTON IN THE ITEM (`SortableItemHandle`), not the
 * item: the item holds its own controls, and a focusable wrapper around them
 * would nest interactive controls.
 *
 * THE DRAGGED ITEM IS AN OVERLAY (`SortableOverlay`). It follows the pointer
 * in a layer of its own while its place stays behind, faded: so it can cross
 * into another group, and nothing clips or covers it.
 * ------------------------------------------------------------------------- */

/** A group's own droppable (its whole area) carries this id. */
const groupDropId = (group: string) => `group:${group}`;
const groupOfDropId = (id: string | number) => (String(id).startsWith("group:") ? String(id).slice(6) : null);

const groupOf = (entry: Active | Over | null): string | null => {
  if (!entry) return null;
  const data = entry.data.current;
  // A sorted item names its group through its SortableContext, an item of a locked group itself.
  return groupOfDropId(entry.id) ?? (data?.sortable?.containerId as string | undefined) ?? (data?.group as string | undefined) ?? null;
};
/** Whether `entry` is a group being sorted among the groups (not an item, not a plain drop area). */
const isGroupDrag = (entry: Active | null) => !!entry && groupOfDropId(entry.id) !== null;

/** Hands `node` to a forwarded ref of either kind. */
function assignRef<T>(ref: React.ForwardedRef<T>, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

/** The long press that starts a touch drag. */
const LONG_PRESS_MS = 300;
/** A click this soon after a drop is the drop's own. */
const CLICK_AFTER_DROP_MS = 300;

function prefersReducedMotion() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/** What a drop did, beside the new `value`. */
export interface SortableCommitMeta<T> {
  /** An item was moved, or a whole group among the groups. */
  kind: "item" | "group";
  /** The item's value (`getItemValue`), or the group's key. */
  id: string;
  /** The group the item came from / landed in. For `kind: "group"` both are the group itself. */
  fromGroup: string;
  toGroup: string;
  /** The item (or group) it was dropped on; null for a drop on a group's free area or outside. */
  overId: string | null;
  /** The drop was let go beside the list (`outside`). */
  outside: boolean;
  previousValue: Record<string, T[]>;
}

interface SortableState {
  /** When the last drop happened — the click right after it is swallowed. */
  droppedAt: React.RefObject<number>;
  /** The item a finger is long-pressing, before the drag starts. */
  pressingId: string | null;
  /** Counts the drags, so a drop zone can tell this drag from the last. */
  dragSerial: number;
  reducedMotion: boolean;
  disabled: boolean;
  activeId: string | null;
  lockedGroups: readonly string[];
  sortableGroups: readonly string[];
  strategy: "grid" | "vertical";
}
const SortableStateContext = React.createContext<SortableState | null>(null);

/** Where an item from another group would land: the group, the index in it, and the room it needs. */
interface ForeignDrop {
  group: string;
  index: number;
  height: number;
  /** The groups after it: they move down by the room, so nothing is laid out again. */
  below: readonly string[];
}
const ForeignDropContext = React.createContext<ForeignDrop | null>(null);

function useSortableState(consumer: string) {
  const state = React.useContext(SortableStateContext);
  if (!state) throw new Error(`\`${consumer}\` must be used within \`Sortable\``);
  return state;
}

export interface SortableProps<T> {
  /** The groups in their order, each with its items in their order. */
  value: Record<string, T[]>;
  /** An item's id: unique across all groups. Strings are their own id. */
  getItemValue?: (item: T) => string;
  /** A drop changed something: the new `value`, and what happened. Not called for a drop that changes nothing. */
  onValueCommit: (value: Record<string, T[]>, meta: SortableCommitMeta<T>) => void;
  /** `grid` (cards, default) or `vertical` (rows). */
  strategy?: "grid" | "vertical";
  /** No dragging. */
  disabled?: boolean;
  /**
   * Groups whose items keep their order (a list sorted by date): items can be
   * carried out of and into them, but are not sorted inside by hand.
   */
  lockedGroups?: readonly string[];
  /** Groups that are themselves sorted among the groups, by their `SortableGroupHandle`. */
  sortableGroups?: readonly string[];
  /** Where an item lands in a group when dropped on its free area, not on an item. Default `end`. */
  placement?: "start" | "end";
  /**
   * An item let go beside `boundsRef` (left or right of it) goes to `group`:
   * dragging a row out of a sidebar returns it to the plain list.
   */
  outside?: { boundsRef: React.RefObject<HTMLElement | null>; group: string };
  /** A drag began / ended (dropped or cancelled) — for the consumer's own drag state. */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  announcements?: Announcements;
  screenReaderInstructions?: ScreenReaderInstructions;
  children: React.ReactNode;
}

function Sortable<T>({
  value, getItemValue, onValueCommit, strategy = "grid", disabled = false, lockedGroups = NONE, sortableGroups = NONE,
  placement = "end", outside, onDragStart, onDragEnd: onDragEndProp, announcements, screenReaderInstructions, children,
}: SortableProps<T>) {
  const idOf = React.useCallback(
    (item: T) => (getItemValue ? getItemValue(item) : String(item)),
    [getItemValue],
  );
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A finger that moves 8px during the press is scrolling, not dragging.
    useSensor(TouchSensor, { activationConstraint: { delay: LONG_PRESS_MS, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pressingId, setPressingId] = React.useState<string | null>(null);
  const [dragSerial, setDragSerial] = React.useState(0);
  const [foreign, setForeign] = React.useState<ForeignDrop | null>(null);
  const droppedAt = React.useRef(0);
  // Whether the pointer has left the list sideways (`outside`).
  const isOutside = React.useRef(false);
  // The group the carried item is over, for the auto-scroll below.
  const overGroup = React.useRef<string | null>(null);
  /* The list scrolls under a carried item only where that can bring a place
     to drop into view. Not beside the list (`outside`): the item is on its
     way somewhere else. And over a locked group — one target as a whole —
     only towards the side where other groups are: scrolling further into it
     reaches nothing. */
  const autoScroll = React.useMemo(() => ({
    canScroll: (element: Element) => {
      if (isOutside.current) return false;
      const group = overGroup.current;
      if (group === null || !lockedGroups.includes(group) || pointerY.current === null) return true;
      const keys = Object.keys(valueRef.current);
      const at = keys.indexOf(group);
      // The pointer in the scroller's lower half pulls it down, in the upper half up.
      const box = element.getBoundingClientRect();
      const down = pointerY.current > box.top + box.height / 2;
      return down ? at < keys.length - 1 : at > 0;
    },
  }), [lockedGroups]);
  const pointerY = React.useRef<number | null>(null);
  const valueRef = React.useRef<Record<string, unknown[]>>(value);
  React.useEffect(() => {
    valueRef.current = value;
  });
  const reducedMotion = prefersReducedMotion();

  /* Under the pointer, an ITEM wins over a group's area. Over the gaps of its
     own group an item snaps to the nearest item of that group (the area would
     read as „no move" and the list would flicker back); over another group's
     area it targets that group. Without a pointer (keyboard) the arrow keys
     have already moved the item onto a target's top-left corner, so the
     target is the one whose corner it sits on; an item wins the tie with its
     own group's area. A dragged GROUP only meets the other sortable groups. */
  const collision: CollisionDetection = (args) => {
    if (isGroupDrag(args.active)) {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.sortableGroup === true),
      });
    }
    if (!args.pointerCoordinates) {
      const { left, top } = args.collisionRect;
      let best: Collision | null = null;
      let bestDistance = Infinity;
      for (const container of args.droppableContainers) {
        const rect = args.droppableRects.get(container.id);
        if (!rect) continue;
        const distance = Math.hypot(rect.left - left, rect.top - top);
        const isItem = groupOfDropId(container.id) === null;
        const tie = Math.abs(distance - bestDistance) < 1;
        if ((!tie && distance < bestDistance) || (tie && isItem && best && groupOfDropId(best.id) !== null)) {
          best = { id: container.id, data: { droppableContainer: container, value: distance } };
          bestDistance = distance;
        }
      }
      return best ? [best] : [];
    }
    const bounds = outside?.boundsRef.current?.getBoundingClientRect();
    const { x } = args.pointerCoordinates;
    pointerY.current = args.pointerCoordinates.y;
    isOutside.current = !!bounds && (x < bounds.left || x > bounds.right);
    if (isOutside.current) return [];
    const hits = pointerWithin(args);
    const under = hits.find((h) => groupOfDropId(h.id) !== null);
    // Past the list's end there is no group under the pointer: the last one it was over still counts.
    if (under) overGroup.current = groupOfDropId(under.id);
    const itemHit = hits.find((h) => groupOfDropId(h.id) === null);
    const own = groupOf(args.active);
    if (itemHit) return [itemHit];
    const areaHit = hits.find((h) => groupOfDropId(h.id) !== null);
    // Outside every group and drop zone: no target, so a release there cancels.
    if (!areaHit) return [];
    if (groupOfDropId(areaHit.id) !== own) return [areaHit];
    if (own !== null && lockedGroups.includes(own)) return [];
    const sameGroup = args.droppableContainers.filter(
      (c) => groupOfDropId(c.id) === null && (c.data.current?.sortable?.containerId as string | undefined) === own,
    );
    return closestCenter({ ...args, droppableContainers: sameGroup });
  };

  /* While an item is over another group whose items are sorted: the place it
     would take — before the item under it, or after it once it is past that
     item's middle; on the group's free area, at `placement`. */
  const trackForeign = ({ active, over }: DragMoveEvent) => {
    let next: ForeignDrop | null = null;
    const [from, to] = [groupOf(active), isOutside.current ? null : groupOf(over)];
    if (!isGroupDrag(active) && over && from && to && from !== to && to in value && !lockedGroups.includes(to)) {
      const ids = value[to].map(idOf);
      const at = ids.indexOf(String(over.id));
      const carried = active.rect.current.translated;
      const after = at >= 0 && !!carried && carried.top + carried.height / 2 > over.rect.top + over.rect.height / 2;
      const index = at >= 0 ? at + (after ? 1 : 0) : placement === "start" ? 0 : ids.length;
      const keys = Object.keys(value);
      // An empty group has nothing to move aside: whatever it shows in its
      // place (a „nothing here yet" line) is the room.
      const height = ids.length === 0 ? 0 : active.rect.current.initial?.height ?? 0;
      next = { group: to, index, height, below: keys.slice(keys.indexOf(to) + 1) };
    }
    setForeign((prev) =>
      prev?.group === next?.group && prev?.index === next?.index && prev?.height === next?.height ? prev : next,
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    onDragEndProp?.();
    const landing = foreign;
    setForeign(null);
    const leftList = isOutside.current;
    isOutside.current = false;
    droppedAt.current = performance.now();
    setActiveId(null);
    setPressingId(null);

    if (isGroupDrag(active)) {
      const keys = Object.keys(value);
      const [id, overGroup] = [groupOfDropId(active.id) as string, over ? groupOfDropId(over.id) : null];
      const [from, to] = [keys.indexOf(id), overGroup === null ? -1 : keys.indexOf(overGroup)];
      if (from < 0 || to < 0 || from === to) return;
      const next: Record<string, T[]> = {};
      for (const key of arrayMove(keys, from, to)) next[key] = value[key];
      onValueCommit(next, { kind: "group", id, fromGroup: id, toGroup: id, overId: overGroup, outside: false, previousValue: value });
      return;
    }

    const id = String(active.id);
    const from = groupOf(active);
    if (!from || !(from in value)) return;
    const to = leftList && outside ? outside.group : groupOf(over);
    if (!to || !(to in value)) return;
    const overId = !leftList && over && groupOfDropId(over.id) === null ? String(over.id) : null;
    const meta: SortableCommitMeta<T> = {
      kind: "item", id, fromGroup: from, toGroup: to, overId, outside: leftList, previousValue: value,
    };
    const fromItems = value[from];
    const item = fromItems.find((entry) => idOf(entry) === id);
    if (item === undefined) return;

    if (from === to) {
      if (lockedGroups.includes(from) || overId === null || overId === id) return;
      const [at, target] = [fromItems.findIndex((e) => idOf(e) === id), fromItems.findIndex((e) => idOf(e) === overId)];
      if (at < 0 || target < 0) return;
      onValueCommit({ ...value, [from]: arrayMove(fromItems, at, target) }, meta);
      return;
    }
    const toItems = value[to].filter((entry) => idOf(entry) !== id);
    const target = overId === null ? -1 : toItems.findIndex((e) => idOf(e) === overId);
    // Where the room was made is where it lands.
    const index = landing?.group === to
      ? Math.min(landing.index, toItems.length)
      : target >= 0 ? target : placement === "start" ? 0 : toItems.length;
    onValueCommit(
      {
        ...value,
        [from]: fromItems.filter((entry) => idOf(entry) !== id),
        [to]: [...toItems.slice(0, index), item, ...toItems.slice(index)],
      },
      meta,
    );
  };

  const state = React.useMemo<SortableState>(
    () => ({ droppedAt, pressingId, dragSerial, reducedMotion, disabled, activeId, lockedGroups, sortableGroups, strategy }),
    [pressingId, dragSerial, reducedMotion, disabled, activeId, lockedGroups, sortableGroups, strategy],
  );
  const groupIds = React.useMemo(() => sortableGroups.map(groupDropId), [sortableGroups]);

  return (
    <SortableStateContext.Provider value={state}>
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        autoScroll={autoScroll}
        // A drop zone appears on drag start and moves the list below it.
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        // Pending fires for the mouse's 6px too; only a delay is a long press.
        onDragPending={({ id, constraint }) => {
          if ("delay" in constraint) setPressingId(String(id));
        }}
        onDragAbort={() => setPressingId(null)}
        onDragStart={({ active, activatorEvent }) => {
          onDragStart?.();
          setActiveId(String(active.id));
          setDragSerial((n) => n + 1);
          setPressingId(null);
          if (typeof TouchEvent !== "undefined" && activatorEvent instanceof TouchEvent) navigator.vibrate?.(10);
        }}
        onDragMove={trackForeign}
        onDragOver={trackForeign}
        onDragCancel={() => {
          onDragEndProp?.();
          setForeign(null);
          isOutside.current = false;
          droppedAt.current = performance.now();
          setActiveId(null);
          setPressingId(null);
        }}
        onDragEnd={onDragEnd}
        // The live region and the instructions go to <body>, not after the
        // list: inline they would become the container's last children.
        accessibility={{ announcements, screenReaderInstructions, container: typeof document === "undefined" ? undefined : document.body }}
      >
        <ForeignDropContext.Provider value={foreign}>
          <SortableContext items={groupIds} strategy={verticalListSortingStrategy} disabled={disabled}>
            {children}
          </SortableContext>
        </ForeignDropContext.Provider>
      </DndContext>
    </SortableStateContext.Provider>
  );
}
const NONE: readonly string[] = [];

/** Whether an item from ANOTHER group is over `group` — the drop would move it here. */
function useForeignOver(group: string): boolean {
  const { active, over } = useDndContext();
  return !!active && !isGroupDrag(active) && groupOf(active) !== group && groupOf(over) === group;
}

/** The mark of a group an item from another group would land in: a dashed outline around a grid. */
const DROP_TARGET = cn(
  "relative data-[drop-target]:after:pointer-events-none data-[drop-target]:after:absolute data-[drop-target]:after:-inset-2",
  "data-[drop-target]:after:-bottom-[calc(0.5rem+var(--sortable-room,0px))] data-[drop-target]:after:rounded-xl",
  "data-[drop-target]:after:outline-2 data-[drop-target]:after:outline-dashed data-[drop-target]:after:outline-primary",
);

interface GroupHandle {
  setRef: (node: HTMLElement | null) => void;
  props: Record<string, unknown>;
}
const GroupHandleContext = React.createContext<GroupHandle | null>(null);
const GroupContext = React.createContext<string | null>(null);

export interface SortableGroupProps extends React.HTMLAttributes<HTMLElement> {
  /** The group's key in `value`. */
  value: string;
  /** The items' ids, in the order they are rendered. */
  items: string[];
  /** Render onto the child element (a `Grid`, a `SidebarSection`) instead of a `<div>`. */
  asChild?: boolean;
  /**
   * The group brings its own look for `data-drop-target` / `data-dragging`:
   * the default dashed outline is left off.
   */
  unstyled?: boolean;
}

/**
 * One group: its whole area takes drops from other groups, and carries
 * `data-drop-target` while an item from another group is over it. A group
 * named in `sortableGroups` is itself sorted among the groups — by a
 * `SortableGroupHandle` inside it — and carries `data-dragging` then.
 */
type GroupElementProps = Omit<SortableGroupProps, "value" | "items"> & {
  groupRef: React.Ref<HTMLElement>;
  dropTarget: boolean;
  /** The room its items make for a foreign item, in px: handed on as `--sortable-room`. */
  room: number;
  dragging: boolean;
  transform: string | undefined;
  transition: string | undefined;
};

/* The group's element, memoised on its own props: it renders again when the
   group becomes (or stops being) the target, moves or is carried — not on
   every step of a drag its `SortableGroup` hears about. With `asChild` that
   spares the consumer's section the same. */
const GroupElement = React.memo(function GroupElement({
  groupRef, dropTarget, room, dragging, transform, transition, asChild = false, unstyled = false, className, style, children,
  ...props
}: GroupElementProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={groupRef as React.Ref<HTMLDivElement>}
      // On the consumer's own element its own `data-slot` stays.
      {...(asChild ? null : { "data-slot": "sortable-group" })}
      data-drop-target={dropTarget || undefined}
      data-dragging={dragging || undefined}
      className={cn(!unstyled && DROP_TARGET, className)}
      style={{
        ...style,
        // The group's box does not grow with the room (that would lay the list
        // out again): a look that should enclose it extends by this much.
        ...(room ? ({ "--sortable-room": `${room}px` } as React.CSSProperties) : null),
        transform,
        transition,
        ...(dragging ? { position: "relative", zIndex: 1 } : null),
      }}
      {...props}
    >
      {children}
    </Comp>
  );
});

const SortableGroup = React.forwardRef<HTMLElement, SortableGroupProps>(({ value, items, ...props }, ref) => {
  const state = useSortableState("SortableGroup");
  const sortsItself = state.sortableGroups.includes(value);
  // One node, one registration: a sortable group is its own drop area.
  const sortable = useSortable({ id: groupDropId(value), data: { sortableGroup: true }, disabled: !sortsItself || state.disabled });
  const foreignOver = useForeignOver(value);
  const landing = React.useContext(ForeignDropContext);
  /* A group above makes room for a foreign item: this one moves down by that
     room — a transform, like the items' own, so the list is not laid out
     again and nothing jumps. */
  const pushed = landing !== null && landing.below.includes(value) ? landing.height : 0;
  const locked = state.lockedGroups.includes(value);
  const { setNodeRef } = sortable;
  const setRefs = React.useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node);
      assignRef(ref, node);
    },
    [setNodeRef, ref],
  );
  const handle = React.useMemo<GroupHandle | null>(
    // Pointer only: the handle is a heading with its own button inside, so
    // it takes no button role and no key handler. Groups are moved by
    // keyboard from the consumer's own menu.
    () => (sortsItself
      ? { setRef: sortable.setActivatorNodeRef, props: { onMouseDown: sortable.listeners?.onMouseDown, onTouchStart: sortable.listeners?.onTouchStart } }
      : null),
    [sortsItself, sortable.setActivatorNodeRef, sortable.listeners],
  );
  const element = (
    <GroupElement
      groupRef={setRefs}
      dropTarget={foreignOver}
      room={landing !== null && landing.group === value ? landing.height : 0}
      dragging={sortable.isDragging}
      // A group moves along the list only.
      transform={
        sortable.transform
          ? CSS.Translate.toString({ ...sortable.transform, x: 0 })
          : pushed ? `translate3d(0px, ${pushed}px, 0)` : undefined
      }
      transition={
        state.reducedMotion
          ? undefined
          : sortable.transition ?? (state.activeId !== null && !sortable.isDragging ? "transform 200ms ease" : undefined)
      }
      {...props}
    />
  );
  return (
    <GroupContext.Provider value={value}>
      <GroupHandleContext.Provider value={handle}>
        {/* A locked group is one drop target as a whole: its items are not
            sorted, so it sets up no sorting for them at all. */}
        {locked ? (
          element
        ) : (
          <SortableContext
            id={value}
            items={items}
            strategy={state.strategy === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
            disabled={state.disabled}
          >
            {element}
          </SortableContext>
        )}
      </GroupHandleContext.Provider>
    </GroupContext.Provider>
  );
});
SortableGroup.displayName = "SortableGroup";

export interface SortableGroupHandleProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

/**
 * The part of a sortable group it is dragged by (its heading), with mouse or
 * touch. There is no keyboard drag for groups: offer "move up / down" in the
 * group's menu. Outside a sortable group it renders its child
 * unchanged.
 */
const SortableGroupHandle = React.forwardRef<HTMLElement, SortableGroupHandleProps>(
  ({ asChild = false, onClickCapture, ...props }, ref) => {
    const handle = React.useContext(GroupHandleContext);
    const state = React.useContext(SortableStateContext);
    const setRef = handle?.setRef;
    const setRefs = React.useCallback(
      (node: HTMLElement | null) => {
        setRef?.(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [setRef, ref],
    );
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={setRefs as React.Ref<HTMLDivElement>}
        {...(asChild ? null : { "data-slot": "sortable-group-handle" })}
        {...props}
        {...handle?.props}
        // The click that ends a drag must not act on the heading.
        onClickCapture={(e: React.MouseEvent<HTMLElement>) => {
          onClickCapture?.(e);
          if (!state || performance.now() - state.droppedAt.current > CLICK_AFTER_DROP_MS) return;
          e.stopPropagation();
          e.preventDefault();
        }}
      />
    );
  },
);
SortableGroupHandle.displayName = "SortableGroupHandle";

interface ItemHandle {
  setRef: (node: HTMLElement | null) => void;
  attributes: Record<string, unknown>;
}
const ItemHandleContext = React.createContext<ItemHandle | null>(null);

export interface SortableItemProps extends React.HTMLAttributes<HTMLElement> {
  /** The item's id (`getItemValue`): unique across all groups, and not starting with `group:`. */
  value: string;
  /** Render onto the child element (a `SidebarCard`) instead of a wrapping `<div>`. */
  asChild?: boolean;
}

interface ItemParts {
  setNodeRef: (node: HTMLElement | null) => void;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
  /** The element's transform and its transition, ready for `style`. */
  transform: string | undefined;
  transition: string | undefined;
}

type ItemElementProps = Omit<SortableItemProps, "value"> & {
  elementRef: React.Ref<HTMLElement>;
  dragging: boolean;
  pressing: boolean;
  transform: string | undefined;
  transition: string | undefined;
  startMouse: unknown;
  startTouch: unknown;
  droppedAt: React.RefObject<number>;
};

/* The item's element. Memoised on its own props, so it renders again only
   when this item's drag state or place changes — not on every step of a drag
   that its `SortableItem` hears about. With `asChild` that spares the
   consumer's row (its menu, its preview) the same. */
const ItemElement = React.memo(function ItemElement({
  elementRef, dragging, pressing, transform, transition, startMouse, startTouch, droppedAt, asChild = false, className,
  style, onClickCapture, onContextMenu, children, ...props
}: ItemElementProps) {
  // Mouse and touch start on the whole item. Events from a portaled menu
  // still bubble through the React tree; only presses inside the item's own
  // DOM count.
  const fromInside = (handler: unknown) => (e: React.SyntheticEvent) => {
    if (typeof handler === "function" && e.currentTarget.contains(e.target as Node)) handler(e);
  };
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={elementRef as React.Ref<HTMLDivElement>}
      // Mouse convenience only, like the item's own click; the keyboard path is the handle.
      {...(asChild ? null : { "data-slot": "sortable-item", role: "presentation" })}
      data-dragging={dragging || undefined}
      style={{ ...style, transform, transition }}
      className={cn(
        // No text selection, iOS callout, tap highlight or scroll delay on a
        // long press — on the item AND every descendant.
        "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]",
        "[&_*]:select-none [&_*]:[-webkit-touch-callout:none]",
        // The press being counted: the item sinks over the press time.
        pressing && "scale-[0.96]",
        dragging && "opacity-40",
        className,
      )}
      onMouseDown={fromInside(startMouse)}
      onTouchStart={fromInside(startTouch)}
      onClickCapture={(e: React.MouseEvent<HTMLElement>) => {
        onClickCapture?.(e);
        if (performance.now() - droppedAt.current > CLICK_AFTER_DROP_MS) return;
        e.stopPropagation();
        e.preventDefault();
      }}
      // Android opens its context menu on a long press; while this item is
      // being pressed or dragged the press is ours.
      onContextMenu={(e: React.MouseEvent<HTMLElement>) => {
        onContextMenu?.(e);
        if (pressing || dragging) e.preventDefault();
      }}
      {...props}
    >
      {children}
    </Comp>
  );
});

/** What both kinds of item share: refs, the long-press guard, the handle context, the memoised element. */
function ItemShell({
  value, parts, forwardedRef, ...props
}: SortableItemProps & { parts: ItemParts; forwardedRef: React.ForwardedRef<HTMLElement> }) {
  const state = useSortableState("SortableItem");
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } = parts;
  const pressing = state.pressingId === value;

  /* iOS Safari starts its own long-press gesture — selecting the word under
     the finger — unless the selection is refused: CSS alone does not stop it
     on every iOS version, a cancelled `selectstart` does. React has no
     `onSelectStart`, hence the listener. */
  const nodeRef = React.useRef<HTMLElement | null>(null);
  const setRefs = React.useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node;
      setNodeRef(node);
      assignRef(forwardedRef, node);
    },
    [setNodeRef, forwardedRef],
  );
  React.useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const refuse = (e: Event) => e.preventDefault();
    node.addEventListener("selectstart", refuse);
    return () => node.removeEventListener("selectstart", refuse);
  }, []);

  const onKeyDown = listeners?.onKeyDown;
  const handle = React.useMemo<ItemHandle>(
    () => ({ setRef: setActivatorNodeRef, attributes: { ...attributes, onKeyDown } }),
    [setActivatorNodeRef, attributes, onKeyDown],
  );
  // The move's own transition, plus the press (scale) and the fade. None of
  // it with reduced motion.
  const transition = state.reducedMotion
    ? undefined
    : [parts.transition, `scale ${pressing ? LONG_PRESS_MS : 150}ms ease-out`, "opacity 150ms ease-out"].filter(Boolean).join(", ");
  return (
    <ItemHandleContext.Provider value={handle}>
      <ItemElement
        elementRef={setRefs}
        dragging={isDragging}
        pressing={pressing}
        transform={parts.transform}
        transition={transition}
        startMouse={listeners?.onMouseDown}
        startTouch={listeners?.onTouchStart}
        droppedAt={state.droppedAt}
        {...props}
      />
    </ItemHandleContext.Provider>
  );
}

type ItemKindProps = SortableItemProps & { group: string | null; forwardedRef: React.ForwardedRef<HTMLElement> };

/** An item that is sorted: a drop target, sliding aside for the others — and for an item from another group. */
function SortedItem({ group, ...props }: ItemKindProps) {
  const state = useSortableState("SortableItem");
  const landing = React.useContext(ForeignDropContext);
  const sortable = useSortable({ id: props.value, disabled: state.disabled });
  const room = landing !== null && landing.group === group && sortable.index >= landing.index ? landing.height : 0;
  const parts: ItemParts = {
    ...sortable,
    transform: sortable.transform ? CSS.Translate.toString(sortable.transform) : room ? `translate3d(0px, ${room}px, 0)` : undefined,
    // dnd-kit animates the shifts of its own group; making room for a foreign
    // item, and giving it back, moves the same way while something is carried.
    transition: sortable.transition ?? (state.activeId !== null && !sortable.isDragging ? "transform 200ms ease" : undefined),
  };
  return <ItemShell {...props} parts={parts} />;
}

/** An item of a locked group: carried out of it, but no drop target and never shifted. */
function LockedItem({ group, ...props }: ItemKindProps) {
  const state = useSortableState("SortableItem");
  const draggable = useDraggable({ id: props.value, disabled: state.disabled, data: { group } });
  const parts: ItemParts = { ...draggable, transform: undefined, transition: undefined };
  return <ItemShell {...props} parts={parts} />;
}

/** One item: the whole element is the mouse and touch handle. `data-dragging` while it is carried. */
const SortableItem = React.forwardRef<HTMLElement, SortableItemProps>((props, ref) => {
  const state = useSortableState("SortableItem");
  // Groups register under that prefix; an item with it would be taken for one.
  if (groupOfDropId(props.value) !== null) {
    throw new Error("`SortableItem` value must not start with \"group:\"");
  }
  const group = React.useContext(GroupContext);
  const Kind = group !== null && state.lockedGroups.includes(group) ? LockedItem : SortedItem;
  return <Kind {...props} group={group} forwardedRef={ref} />;
});
SortableItem.displayName = "SortableItem";

export type SortableItemHandleProps = Omit<ButtonProps, "children"> & {
  /** Accessible name ("Verschieben: Biochemie"). */
  label: string;
  /** A vertical grip (beside a list row) instead of the horizontal one (over a card). */
  vertical?: boolean;
};

/** The grip of a sortable item: its keyboard handle. Renders nothing outside a `SortableItem`. */
function SortableItemHandle({ label, vertical = false, variant = "ghost", size = "icon", onClick, ...props }: SortableItemHandleProps) {
  const handle = React.useContext(ItemHandleContext);
  if (!handle) return null;
  const { setRef, attributes } = handle;
  return (
    <Button
      ref={setRef}
      variant={variant}
      size={size}
      data-slot="sortable-item-handle"
      {...attributes}
      aria-label={label}
      title={label}
      // A click on the grip must not open the item.
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    >
      {vertical ? <GripVertical size={14} aria-hidden="true" /> : <GripHorizontal size={16} aria-hidden="true" />}
    </Button>
  );
}

export interface SortableDropZoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The group a drop here lands in. */
  group: string;
  children: React.ReactNode;
}

/**
 * A drop target for a group that has no items yet, shown only while an item
 * is dragged — so an empty group can still be dropped into.
 *
 * ONE FRAME LATE for a pointer, on purpose. The overlay keeps the rect the
 * dragged item had when the drag started; a zone above the item that appeared
 * in that same frame would push the item down first, and the overlay would
 * hang a zone's height below the pointer for the whole drag.
 */
function SortableDropZone({ group, className, children, ...props }: SortableDropZoneProps) {
  const { active, activatorEvent, measureDroppableContainers } = useDndContext();
  const { setNodeRef } = useDroppable({ id: groupDropId(group) });
  const foreignOver = useForeignOver(group);
  const dragging = active !== null && !isGroupDrag(active);
  const serial = useSortableState("SortableDropZone").dragSerial;
  const [shownFor, setShownFor] = React.useState(-1);
  React.useEffect(() => {
    if (!dragging) return;
    const frame = requestAnimationFrame(() => setShownFor(serial));
    return () => cancelAnimationFrame(frame);
  }, [dragging, serial]);
  // The keyboard moves the overlay onto the targets' rects, so it has to see
  // the shifted layout from the start: no wait there.
  const byKeyboard = typeof KeyboardEvent !== "undefined" && activatorEvent instanceof KeyboardEvent;
  const shown = dragging && (byKeyboard || shownFor === serial);
  // The droppable was registered all along, without a node: showing it adds
  // no container, so nothing re-measures by itself.
  React.useLayoutEffect(() => {
    if (shown) measureDroppableContainers([]);
  }, [shown, measureDroppableContainers]);
  if (!shown) return null;
  return (
    <div
      ref={setNodeRef}
      data-slot="sortable-drop-zone"
      data-drop-target={foreignOver || undefined}
      className={cn(
        "flex min-h-20 items-center justify-center rounded-xl border-2 border-dashed border-outline-variant p-4 text-sm text-on-surface-variant transition-colors",
        "data-[drop-target]:border-primary data-[drop-target]:bg-primary/5 data-[drop-target]:text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SortableOverlayProps {
  /** The carried item, by its id. Groups move themselves and get no overlay. */
  children: (params: { value: string }) => React.ReactNode;
  /** How much the carried copy is lifted: a card more than a full-width row. */
  lift?: "card" | "row";
  className?: string;
}

/**
 * The carried item, in a layer of its own on `<body>`: lifted — a little
 * larger, with a shadow — and flown to its place on drop (dropped in place
 * with reduced motion).
 */
function SortableOverlay({ children, lift = "card", className }: SortableOverlayProps) {
  const { activeId, reducedMotion } = useSortableState("SortableOverlay");
  const { active } = useDndContext();
  const carried = activeId !== null && !isGroupDrag(active) ? activeId : null;
  if (typeof document === "undefined") return null;
  // On <body>: a scrolling column (a sidebar) would clip the carried item at its edge.
  return createPortal(
    <DragOverlay dropAnimation={reducedMotion ? null : undefined} zIndex={1000}>
      {carried ? (
        // The scale sits one level down: dnd-kit measures the overlay's only
        // child, and a scaled one would put the keyboard's target corners off
        // the items'.
        <div className="h-full" data-slot="sortable-overlay">
          <div className={cn("h-full rounded-xl shadow-xl", lift === "row" ? "scale-[1.01]" : "scale-[1.03]", className)}>
            {children({ value: carried })}
          </div>
        </div>
      ) : null}
    </DragOverlay>,
    document.body,
  );
}

export {
  Sortable, SortableGroup, SortableGroupHandle, SortableItem, SortableItemHandle, SortableDropZone, SortableOverlay,
};
