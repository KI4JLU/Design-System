import * as React from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  /** Required unless the item opens a `submenu`. */
  onSelect?: (e: Event) => void;
  /**
   * Nested choices: the item becomes a submenu trigger (with its chevron) —
   * e.g. a setting with a few values ("Synchronisation" → manual / daily).
   */
  submenu?: ActionMenuItem[];
  /** The current value among its siblings: primary text and a trailing check. */
  checked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  /** Draw a separator above this item. */
  separatorBefore?: boolean;
  /**
   * A short neutral pill at the end of the row, e.g. "Admin" on an action only
   * administrators see. Part of the item's accessible name.
   */
  badge?: string;
}

export interface ActionMenuProps {
  actions: ActionMenuItem[];
  /** Accessible name of the ⋮ trigger. */
  label: string;
  /** Classes for the trigger button (size, shape). */
  triggerClassName?: string;
  align?: "start" | "center" | "end";
}

/**
 * The ⋮ overflow menu of a card or list row: a ghost icon trigger and a
 * dropdown of labelled actions. Renders nothing when `actions` is empty.
 *
 * Its React events still bubble through the host (the menu is portaled, but
 * React bubbles along the component tree), so a clickable host must ignore
 * clicks from `[role="menu"]` / `[role="menuitem"]` and the trigger button.
 */
export function ActionMenu(props: ActionMenuProps) {
  if (props.actions.length === 0) return null;
  return <ActionMenuDropdown {...props} />;
}

function ActionMenuDropdown({ actions, label, triggerClassName, align = "end" }: ActionMenuProps) {
  // Closed by a click elsewhere, the menu does not hand focus back to its
  // trigger: the user has moved on, and a returned focus would draw the
  // trigger's focus ring and keep its host's focus-driven extras (a hover
  // preview, the revealed ⋯) up. Closed by Esc or a chosen item, focus returns
  // as usual — the keyboard path.
  const closedOutside = React.useRef(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("shrink-0", triggerClassName)} aria-label={label}>
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        onPointerDownOutside={() => {
          closedOutside.current = true;
        }}
        onCloseAutoFocus={(e) => {
          if (closedOutside.current) e.preventDefault();
          closedOutside.current = false;
        }}
      >
        <ActionMenuItems actions={actions} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The rows of an ActionMenu (and of each of its submenus). */
function ActionMenuItems({ actions }: { actions: ActionMenuItem[] }) {
  return (
    <>
      {actions.map((a, i) => (
        <React.Fragment key={a.label}>
          {a.separatorBefore && i > 0 && <DropdownMenuSeparator />}
          {a.submenu ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={a.disabled}>
                {a.icon}
                {a.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <ActionMenuItems actions={a.submenu} />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem
              variant={a.destructive ? "destructive" : undefined}
              selected={a.checked}
              disabled={a.disabled}
              onSelect={a.onSelect}
              // With a badge the name is set explicitly: from the content, the
              // two inline fragments would join without a space. Typeahead
              // still matches the label alone.
              aria-label={a.badge ? `${a.label} (${a.badge})` : undefined}
              aria-current={a.checked ? "true" : undefined}
              textValue={a.label}
            >
              {a.icon}
              {a.label}
              {a.badge && <Badge className="ml-auto">{a.badge}</Badge>}
              {a.checked && <Check aria-hidden="true" className="ml-auto !size-4" />}
            </DropdownMenuItem>
          )}
        </React.Fragment>
      ))}
    </>
  );
}
