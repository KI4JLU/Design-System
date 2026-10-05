import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../lib/utils";

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /**
   * Accessible name per thumb, in value order (`aria-label`). A range needs
   * one per thumb, e.g. `["Start", "Ende"]`. Missing entries fall back to the
   * slider's own `aria-label` / `aria-labelledby`.
   */
  thumbLabels?: string[];
  /**
   * Spoken value per thumb (`aria-valuetext`), e.g. `"1:23 von 4:10"` for a
   * seek bar. Without it screen readers read the bare number.
   */
  getValueText?: (value: number, index: number) => string;
}

/**
 * Accessible slider on Radix: one thumb per entry in `value` /
 * `defaultValue` — one value is a seek or volume slider, two a range.
 * Keyboard (arrows, PageUp/PageDown, Home/End) and pointer drag come from
 * Radix.
 *
 * Naming: `thumbLabels` names each thumb. `aria-label` / `aria-labelledby`
 * on the slider name the thumbs that have no own label; when every thumb is
 * named by `thumbLabels`, they name the whole slider instead (`role="group"`),
 * so a range reads as "Probefenster, Start" and "Probefenster, Ende".
 *
 * Focus lands on the thumbs, so they carry the field wiring: `aria-describedby`
 * and `aria-invalid` go to every thumb, `id` to the first one. Inside
 * `FormItem` + `FormControl` the `FormLabel` names the slider and the
 * description or error describes it.
 */
const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      thumbLabels,
      getValueText,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    // Mirror the uncontrolled value so each thumb can report its valuetext.
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? [min]);
    const values = value ?? uncontrolled;
    const handleValueChange = (next: number[]) => {
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    };

    const allThumbsNamed = values.every((_, index) => !!thumbLabels?.[index]);
    const nameGroup = allThumbsNamed && (!!ariaLabel || !!ariaLabelledBy);

    return (
      <SliderPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        min={min}
        role={nameGroup ? "group" : undefined}
        aria-label={nameGroup ? ariaLabel : undefined}
        aria-labelledby={nameGroup ? ariaLabelledBy : undefined}
        className={cn(
          "relative flex w-full touch-none items-center select-none",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
          className,
        )}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(
            "relative grow overflow-hidden rounded-full bg-surface-container-high",
            "data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full",
            "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
          )}
        >
          <SliderPrimitive.Range
            className={cn(
              "absolute rounded-full bg-primary",
              "data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
            )}
          />
        </SliderPrimitive.Track>
        {values.map((thumbValue, index) => {
          const thumbLabel = thumbLabels?.[index];
          return (
            <SliderPrimitive.Thumb
              key={index}
              id={index === 0 ? id : undefined}
              aria-label={thumbLabel ?? (nameGroup ? undefined : ariaLabel)}
              aria-labelledby={thumbLabel || nameGroup ? undefined : ariaLabelledBy}
              aria-valuetext={getValueText?.(thumbValue, index)}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              className={cn(
                "block size-5 rounded-full border-2 border-primary bg-surface-container-lowest shadow-card",
                "transition-[box-shadow] motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                "data-[disabled]:pointer-events-none",
              )}
            />
          );
        })}
      </SliderPrimitive.Root>
    );
  },
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
