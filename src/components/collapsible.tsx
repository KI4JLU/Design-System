import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

/**
 * A region that a button shows and hides — Radix Collapsible, unstyled, the
 * same shape as shadcn's `collapsible`. The trigger is a real `<button>` with
 * `aria-expanded` and `aria-controls` pointing at the content; the closed
 * content is unmounted (pass `forceMount` to keep it). Root, trigger and
 * content carry `data-state="open|closed"` for styling (`group-data-[state=open]:…`).
 *
 * The building block of `Reasoning`, `ChainOfThought` and `Task`. For a
 * disclosure with its own look use one of those; for a menu or an anchored
 * panel use `DropdownMenu` / `Popover`.
 */
const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
const CollapsibleContent = CollapsiblePrimitive.Content;

export type {
  CollapsibleProps,
  CollapsibleTriggerProps,
  CollapsibleContentProps,
} from "@radix-ui/react-collapsible";
export { Collapsible, CollapsibleTrigger, CollapsibleContent };
