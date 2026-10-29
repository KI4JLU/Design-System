import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  CarouselContext,
  edgeFadeStyle,
  snapOfSlide,
  useCarousel,
  useCarouselSlides,
  type CarouselApi,
} from "./carousel-context";

/*
 * The shadcn/ui `carousel` (https://ui.shadcn.com/r/styles/new-york-v4/carousel.json),
 * imported with the shadcn CLI on Embla Carousel and normalised: DS imports,
 * the context and hooks in `carousel-context.ts`, and the previous/next
 * buttons' screen-reader text as a `label` prop (English default) instead of a
 * fixed English string. `CarouselDots`, `CarouselContent`'s `fadeEdges` and
 * `wheel` (Embla's wheel-gestures plugin) are the DS's own additions.
 */

type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

export interface CarouselProps {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
  /**
   * Scroll with the mouse wheel and the trackpad too (Embla's wheel-gestures
   * plugin), not only by dragging and the buttons; it settles on a snap point.
   */
  wheel?: boolean;
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  wheel = false,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  // One plugin instance per carousel: Embla re-initialises when the array changes.
  const allPlugins = React.useMemo(
    () => (wheel ? [...(plugins ?? []), WheelGesturesPlugin()] : plugins),
    [wheel, plugins],
  );
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    allPlugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // A text field or another arrow-key control in a slide keeps its keys.
      const target = event.target as HTMLElement;
      if (
        target.isContentEditable ||
        target.closest('input, textarea, select, [role="slider"], [role="listbox"], [role="menu"], [role="radiogroup"], [role="tablist"], [role="grid"]')
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    // Registry code: Embla's API exists only after mount, so its first state
    // is read here, as the subscription below starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

export interface CarouselContentProps extends React.ComponentProps<"div"> {
  /** Fade the viewport out on the side(s) more slides lie on, instead of a hard clip. */
  fadeEdges?: boolean;
}

function CarouselContent({ className, fadeEdges = false, ...props }: CarouselContentProps) {
  const { carouselRef, orientation, canScrollPrev, canScrollNext } = useCarousel();

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden"
      data-slot="carousel-content"
      style={fadeEdges ? edgeFadeStyle(orientation, canScrollPrev, canScrollNext) : undefined}
    >
      <div
        className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}

type CarouselButtonProps = React.ComponentProps<typeof Button> & {
  /** Screen-reader text of the button. */
  label?: string;
};

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  label = "Previous slide",
  ...props
}: CarouselButtonProps) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      type="button"
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  label = "Next slide",
  ...props
}: CarouselButtonProps) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      type="button"
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

export interface CarouselDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name of the dot for slide `index` (0-based) of `count`. */
  dotLabel?: (index: number, count: number) => string;
}

/**
 * One dot per slide: the slides in view as long dots in the primary colour,
 * the rest small and muted. A dot scrolls its slide into view. Renders
 * nothing while every slide fits (the carousel cannot scroll and all are in view).
 */
function CarouselDots({
  className,
  dotLabel = (i, n) => `Slide ${i + 1} of ${n}`,
  ...props
}: CarouselDotsProps) {
  const { api, canScrollPrev, canScrollNext } = useCarousel();
  const { count, inView } = useCarouselSlides();
  const paged = canScrollPrev || canScrollNext || (inView.length > 0 && inView.length < count);
  if (count === 0 || !paged) return null;
  return (
    <div
      data-slot="carousel-dots"
      className={cn("flex items-center justify-center gap-1.5", className)}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => {
        const shown = inView.includes(i);
        return (
          <button
            key={i}
            type="button"
            aria-label={dotLabel(i, count)}
            aria-current={shown ? "true" : undefined}
            onClick={() => api?.scrollTo(snapOfSlide(api.internalEngine().slideRegistry, i))}
            className={cn(
              "h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              // The hidden slides' dots: a tint of the text colour, readable on any surface or glow.
              shown ? "w-6 bg-primary" : "w-2 bg-on-surface-variant/40 hover:bg-on-surface-variant/70",
            )}
          />
        );
      })}
    </div>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
};
