import { Check, type LucideIcon } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

/**
 * Labeled dropdown button for a single filter/sort dimension above a list —
 * shows the active option in its own label once it differs from the default
 * (e.g. "Filter (Aktiv)"). Pair with `ListToolbar`. Value/onChange stay plain `string` (like
 * `SegmentedControl`) — narrow at the call site with `as YourUnionType`.
 */
export interface FilterMenuOption {
  value: string;
  label: string;
}

export interface FilterMenuProps {
  icon: LucideIcon;
  label: string;
  options: FilterMenuOption[];
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
}

function FilterMenu({ icon: Icon, label, options, value, defaultValue, onChange }: FilterMenuProps) {
  const isActive = value !== defaultValue;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full flex-1 lg:w-auto lg:flex-none">
          <Icon className="text-[16px]" width="1em" height="1em" aria-hidden />
          {label}
          {isActive && <span>({options.find((option) => option.value === value)?.label})</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
          >
            {option.label}
            {value === option.value && <Check className="ml-auto text-[16px]" width="1em" height="1em" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { FilterMenu };
