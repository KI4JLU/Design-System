import * as React from "react";
import { Check, Pipette } from "lucide-react";
import { cn } from "../lib/utils";
import { normalizeHex } from "../lib/hex-color";
import { COLOR_PRESETS } from "../lib/category-color";
import { onColor } from "../lib/legible-color";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface ColorFieldLabels {
  /** The entry that opens the browser's own colour picker. Default "Eigene Farbe…". */
  custom: string;
  /** Accessible name of the preset grid. Default "Systemfarben". */
  presets: string;
}

const DEFAULT_LABELS: ColorFieldLabels = {
  custom: "Eigene Farbe…",
  presets: "Systemfarben",
};

export interface ColorFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** `#RRGGBB`. */
  value: string;
  /** Called with `#RRGGBB` (upper case) — never with an incomplete value. */
  onChange: (value: string) => void;
  /** Names the field (the trigger carries it, with the current value). */
  label: string;
  disabled?: boolean;
  /** The colours offered as a grid, `#RRGGBB`. Default `COLOR_PRESETS`. */
  presets?: readonly string[];
  labels?: Partial<ColorFieldLabels>;
}

/**
 * A colour as a pill: a round swatch and the hex value. It opens a grid of
 * the system's colours (`presets`); only „Eigene Farbe…" under it opens the
 * browser's own picker, for a colour outside the palette. Pair it with
 * `SettingsRow` (label left, field right).
 */
const ColorField = React.forwardRef<HTMLDivElement, ColorFieldProps>(
  ({ value, onChange, label, disabled = false, presets = COLOR_PRESETS, labels: labelOverrides, className, ...props }, ref) => {
    const labels = { ...DEFAULT_LABELS, ...labelOverrides };
    const [open, setOpen] = React.useState(false);
    const nativeRef = React.useRef<HTMLInputElement>(null);
    const current = normalizeHex(value) ?? value.toUpperCase();
    const custom = !presets.some((p) => normalizeHex(p) === current);

    const pick = (next: string) => {
      const hex = normalizeHex(next);
      if (hex) onChange(hex);
    };
    const openNative = () => {
      setOpen(false);
      const input = nativeRef.current;
      if (!input) return;
      // showPicker keeps the picker anchored at the field; click() where it is missing.
      try {
        input.showPicker();
      } catch {
        input.click();
      }
    };

    return (
      <div ref={ref} data-slot="color-field" className={cn("relative inline-flex", className)} {...props}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={disabled}
            aria-label={`${label}: ${current}`}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-full border border-outline-variant bg-surface-container-lowest py-1.5 pr-4 pl-1.5",
              "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <span aria-hidden="true" className="size-6 shrink-0 rounded-full border border-outline-variant" style={{ background: current }} />
            <span className="text-sm text-on-surface tabular-nums">{current}</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-3">
            <div role="group" aria-label={labels.presets} className="grid grid-cols-5 gap-2">
              {presets.map((p) => {
                const hex = normalizeHex(p) ?? p;
                const selected = hex === current;
                return (
                  <button
                    key={hex}
                    type="button"
                    aria-label={hex}
                    aria-pressed={selected}
                    onClick={() => {
                      pick(hex);
                      setOpen(false);
                    }}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-outline-variant outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest"
                    style={{ background: hex }}
                  >
                    {selected && <Check aria-hidden="true" className="size-4" style={{ color: onColor(hex) }} />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-pressed={custom}
              onClick={openNative}
              className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-[var(--ui-radius-control)] px-2 py-1.5 text-sm text-on-surface outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {custom ? (
                <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-outline-variant" style={{ background: current }} />
              ) : (
                <Pipette aria-hidden="true" className="size-4 shrink-0 text-on-surface-variant" />
              )}
              {labels.custom}
            </button>
          </PopoverContent>
        </Popover>
        {/* The browser's own picker, opened only by „Eigene Farbe…": under the
            swatch, so it anchors at the field, but out of reach otherwise. */}
        <input
          ref={nativeRef}
          type="color"
          tabIndex={-1}
          aria-hidden="true"
          value={current.toLowerCase()}
          disabled={disabled}
          onChange={(e) => pick(e.target.value)}
          className="pointer-events-none absolute top-1.5 left-1.5 size-6 opacity-0"
        />
      </div>
    );
  },
);
ColorField.displayName = "ColorField";

export { ColorField };
