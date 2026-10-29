import * as React from "react";
import type useEmblaCarousel from "embla-carousel-react";
import type { UseEmblaCarouselType } from "embla-carousel-react";

/**
 * The context `Carousel` provides to its parts, and the hooks built on it. In
 * its own module so `carousel.tsx` exports nothing but components
 * (react-refresh's "only export components" rule — as `combobox-context.ts`).
 */
export type CarouselApi = UseEmblaCarouselType[1];

export interface CarouselContextValue {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  orientation: "horizontal" | "vertical";
}

export const CarouselContext = React.createContext<CarouselContextValue | null>(null);

/** The carousel around the caller: its Embla API, scrolling and whether it can. */
export function useCarousel(): CarouselContextValue {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

export interface CarouselSlides {
  /** How many slides there are. */
  count: number;
  /** The slides in view, ascending (0-based) — for a "1–3 of 5" counter or dots. */
  inView: number[];
}

/**
 * The slides of the carousel around the caller and which of them are in
 * view, kept current as it scrolls and resizes. A slide is in view per
 * Embla's `inViewThreshold` option — 0 by default, where a neighbour merely
 * touching the edge counts; a counter wants e.g. `0.6`. Before Embla has measured
 * (and where it cannot, e.g. without IntersectionObserver) every slide counts
 * as in view.
 */
export function useCarouselSlides(): CarouselSlides {
  const { api } = useCarousel();
  const [slides, setSlides] = React.useState<CarouselSlides>({ count: 0, inView: [] });
  React.useEffect(() => {
    if (!api) return;
    const update = () => {
      const count = api.slideNodes().length;
      const inView = [...api.slidesInView()].sort((a, b) => a - b);
      setSlides({ count, inView: inView.length ? inView : Array.from({ length: count }, (_, i) => i) });
    };
    update();
    api.on("slidesInView", update);
    api.on("reInit", update);
    return () => {
      api.off("slidesInView", update);
      api.off("reInit", update);
    };
  }, [api]);
  return slides;
}

/** How far the faded edge of `CarouselContent fadeEdges` reaches. */
const FADE = "1.5rem";

/**
 * The mask that fades a carousel's viewport out on the side(s) more slides
 * lie on, so a peeking slide ends in a fade instead of a hard clip.
 */
export function edgeFadeStyle(
  orientation: "horizontal" | "vertical",
  fadeStart: boolean,
  fadeEnd: boolean,
): React.CSSProperties | undefined {
  if (!fadeStart && !fadeEnd) return undefined;
  const dir = orientation === "horizontal" ? "to right" : "to bottom";
  const start = fadeStart ? `transparent, black ${FADE}` : "black";
  const end = fadeEnd ? `black calc(100% - ${FADE}), transparent` : "black";
  const mask = `linear-gradient(${dir}, ${start}, ${end})`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

/**
 * The scroll snap that shows slide `index`. With `slidesToScroll` > 1 (or
 * "auto") a snap holds several slides, so a slide's index is not its snap's;
 * Embla's slide registry lists each snap's slides.
 */
export function snapOfSlide(registry: number[][] | undefined, index: number): number {
  const snap = registry?.findIndex((slides) => slides.includes(index)) ?? -1;
  return snap >= 0 ? snap : index;
}
