import * as React from "react";
import { Check, ListFilter } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "./dropdown-menu";
import { SidebarSectionButton } from "./sidebar-section";

/** One setting of the menu: its name, its current value and the values to choose from. */
export interface SidebarFilter {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  /** Draw a separator above this row (the filters, then how the list is arranged). */
  separatorBefore?: boolean;
}

export interface SidebarFilterMenuProps {
  /** Accessible name of the trigger, and its tooltip. */
  label: string;
  /** Accessible name while a filter hides rows; defaults to `label`. */
  activeLabel?: string;
  filters: SidebarFilter[];
  onValueChange: (key: string, value: string) => void;
  /** A filter is hiding rows: the trigger turns primary and stays in sight. */
  active?: boolean;
  /** "Zurücksetzen": offered with `onReset`, disabled while everything is at its default. */
  resetLabel?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
  /** Further entries under the reset (e.g. "Neuen Abschnitt erstellen"). */
  actions?: { label: string; onSelect: () => void }[];
  icon?: React.ReactNode;
}

/**
 * The filter menu of a side panel's list, beside its section heading: each
 * row names a setting and its current value and opens the values; choosing
 * one keeps the menu open, so several can be set in one go.
 */
function SidebarFilterMenu({
  label, activeLabel, filters, onValueChange, active = false, resetLabel, onReset, resetDisabled, actions = [], icon,
}: SidebarFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarSectionButton active={active} aria-label={active ? (activeLabel ?? label) : label} title={label}>
          {icon ?? <ListFilter size={16} aria-hidden="true" />}
        </SidebarSectionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-72">
        {filters.map((filter) => {
          const current = filter.options.find((option) => option.value === filter.value);
          return (
            <React.Fragment key={filter.key}>
              {filter.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {/* Name left, current value right, in one box that takes
                      the row's free width: the chevron the trigger adds then
                      sits directly after the value. */}
                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-4 whitespace-nowrap">
                    <span>{filter.label}</span>
                    <span className="truncate text-right text-on-surface-variant">{current?.label}</span>
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-44">
                  {filter.options.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      role="menuitemradio"
                      aria-checked={filter.value === option.value}
                      selected={filter.value === option.value}
                      onSelect={(e) => {
                        e.preventDefault();
                        onValueChange(filter.key, option.value);
                      }}
                    >
                      {option.label}
                      {filter.value === option.value && <Check className="ml-auto !size-4" aria-hidden="true" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </React.Fragment>
          );
        })}
        {onReset && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={resetDisabled} onSelect={onReset}>
              {resetLabel}
            </DropdownMenuItem>
          </>
        )}
        {actions.length > 0 && <DropdownMenuSeparator />}
        {actions.map((action) => (
          <DropdownMenuItem key={action.label} onSelect={action.onSelect}>
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SidebarFilterMenu };
