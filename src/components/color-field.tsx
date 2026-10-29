import * as React from "react";
import { cn } from "../lib/utils";
import { normalizeHex } from "../lib/hex-color";


export interface ColorFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** `#RRGGBB`. */
  value: string;
  /** Called with `#RRGGBB` (upper case) — never with an incomplete value. */
  onChange: (value: string) => void;
  /** Names the field (both the swatch and the hex input carry it). */
  label: string;
  disabled?: boolean;
}

/**
 * A colour as a pill: a round swatch that opens the system colour picker,
 * and the hex value, typed in place. The hex input commits only a complete
 * `#RRGGBB` (with or without `#`); anything else snaps back on blur. Pair it
 * with `SettingsRow` (label left, field right).
 */
const ColorField = React.forwardRef<HTMLDivElement, ColorFieldProps>(
  ({ value, onChange, label, disabled = false, className, ...props }, ref) => {
    const [draft, setDraft] = React.useState(value.toUpperCase());
    const [prev, setPrev] = React.useState(value);
    if (prev !== value) {
      // Follow outside changes (the swatch, a reset) during render.
      setPrev(value);
      setDraft(value.toUpperCase());
    }
    return (
      <div
        ref={ref}
        data-slot="color-field"
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-outline-variant bg-surface-container-lowest py-1.5 pr-4 pl-1.5",
          "focus-within:ring-2 focus-within:ring-focus-ring",
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        <span
          className="relative size-6 shrink-0 overflow-hidden rounded-full border border-outline-variant"
          style={{ background: value }}
        >
          <input
            type="color"
            aria-label={label}
            value={value.toLowerCase()}
            disabled={disabled}
            onChange={(e) => {
              const next = normalizeHex(e.target.value);
              if (next) onChange(next);
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </span>
        <input
          type="text"
          aria-label={`${label} (Hex)`}
          value={draft}
          disabled={disabled}
          spellCheck={false}
          maxLength={7}
          onChange={(e) => {
            setDraft(e.target.value);
            const next = normalizeHex(e.target.value);
            if (next) onChange(next);
          }}
          onBlur={() => setDraft(value.toUpperCase())}
          className="w-[7ch] bg-transparent text-sm text-on-surface tabular-nums outline-none"
        />
      </div>
    );
  },
);
ColorField.displayName = "ColorField";

export { ColorField };
