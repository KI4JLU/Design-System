import * as React from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: (e: Event) => void;
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
export function ActionMenu({ actions, label, triggerClassName, align = "end" }: ActionMenuProps) {
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("shrink-0", triggerClassName)} aria-label={label}>
          <MoreVertical aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((a, i) => (
          <React.Fragment key={a.label}>
            {a.separatorBefore && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant={a.destructive ? "destructive" : undefined}
              disabled={a.disabled}
              onSelect={a.onSelect}
              // With a badge the name is set explicitly: from the content, the
              // two inline fragments would join without a space. Typeahead
              // still matches the label alone.
              aria-label={a.badge ? `${a.label} (${a.badge})` : undefined}
              textValue={a.label}
            >
              {a.icon}
              {a.label}
              {a.badge && <Badge className="ml-auto">{a.badge}</Badge>}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
