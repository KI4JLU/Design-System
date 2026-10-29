import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";
import { snapOfSlide, useCarouselSlides } from "./carousel-context";

// The wheel-gestures plugin, observed: `wheel` must hand it to Embla.
const wheelPlugin = vi.hoisted(() => vi.fn());
vi.mock("embla-carousel-wheel-gestures", async (importOriginal) => {
  const actual = await importOriginal<typeof import("embla-carousel-wheel-gestures")>();
  return {
    WheelGesturesPlugin: (...args: Parameters<typeof actual.WheelGesturesPlugin>) => {
      wheelPlugin();
      return actual.WheelGesturesPlugin(...args);
    },
  };
});

// Oracle for this file: the registry source of shadcn/ui's `carousel`
// (https://ui.shadcn.com/r/styles/new-york-v4/carousel.json) — a region with
// aria-roledescription "carousel", slides as groups with "slide", data-slots
// on every part, previous/next disabled while Embla cannot scroll — and, for
// the DS's CarouselDots / useCarouselSlides, Embla's documented
// `slidesInView` (the slides an IntersectionObserver reports as intersecting).

// A controllable IntersectionObserver: the test decides which slides are in view.
let report: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null = null;
class ControlledIntersectionObserver {
  constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
    report = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", ControlledIntersectionObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
  report = null;
});

function Counter() {
  const { count, inView } = useCarouselSlides();
  return <p data-testid="counter">{inView.length ? `${inView[0] + 1}–${inView[inView.length - 1] + 1} / ${count}` : "–"}</p>;
}

function renderCarousel() {
  return render(
    <Carousel aria-label="Rollen">
      <CarouselContent>
        {["A", "B", "C", "D", "E"].map((s) => (
          <CarouselItem key={s} data-testid={`slide-${s}`}>
            {s}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious label="Zurück" />
      <CarouselNext label="Weiter" />
      <Counter />
      <CarouselDots dotLabel={(i, n) => `Rolle ${i + 1} von ${n}`} />
    </Carousel>,
  );
}

function showSlides(visible: string[]) {
  const all = ["A", "B", "C", "D", "E"];
  act(() => {
    report?.(all.map((s) => ({ target: screen.getByTestId(`slide-${s}`), isIntersecting: visible.includes(s) })));
  });
}

describe("Carousel", () => {
  it("is a carousel region of slides, every part marked with its data-slot", () => {
    renderCarousel();
    const region = screen.getByRole("region", { name: "Rollen" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(region).toHaveAttribute("data-slot", "carousel");
    const slides = screen.getAllByRole("group");
    expect(slides).toHaveLength(5);
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides[0]).toHaveAttribute("data-slot", "carousel-item");
  });

  it("names previous and next by their label and disables them while nothing can scroll", () => {
    renderCarousel();
    // jsdom measures nothing: Embla sees no overflow.
    expect(screen.getByRole("button", { name: "Zurück" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();
  });

  it("counts the slides in view and shows one dot per slide, the visible ones current", () => {
    renderCarousel();
    showSlides(["A", "B", "C"]);
    expect(screen.getByTestId("counter")).toHaveTextContent("1–3 / 5");
    const dots = screen.getAllByRole("button", { name: /^Rolle \d von 5$/ });
    expect(dots).toHaveLength(5);
    expect(dots.map((d) => d.getAttribute("aria-current"))).toEqual(["true", "true", "true", null, null]);
    showSlides(["C", "D", "E"]);
    expect(screen.getByTestId("counter")).toHaveTextContent("3–5 / 5");
  });

  it("shows no dots while every slide is in view", () => {
    renderCarousel();
    showSlides(["A", "B", "C", "D", "E"]);
    expect(screen.queryByRole("button", { name: /^Rolle/ })).toBeNull();
  });

  it("scrolls a dot's slide into view on click", () => {
    renderCarousel();
    showSlides(["A", "B", "C"]);
    // Embla scrolls to the slide; jsdom has no geometry, so it only must not throw.
    fireEvent.click(screen.getByRole("button", { name: "Rolle 5 von 5" }));
    expect(screen.getByRole("region", { name: "Rollen" })).toBeInTheDocument();
  });
});

describe("Carousel keyboard and forms", () => {
  it("leaves arrow keys to a text field in a slide, and handles them elsewhere", () => {
    render(
      <Carousel aria-label="Rollen">
        <CarouselContent>
          <CarouselItem>
            <input aria-label="Name" />
          </CarouselItem>
          <CarouselItem>B</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    // fireEvent returns false when a handler called preventDefault.
    expect(fireEvent.keyDown(screen.getByRole("textbox", { name: "Name" }), { key: "ArrowLeft" })).toBe(true);
    expect(fireEvent.keyDown(screen.getByRole("region", { name: "Rollen" }), { key: "ArrowLeft" })).toBe(false);
  });

  it("does not submit an enclosing form from previous / next", () => {
    renderCarousel();
    expect(screen.getByRole("button", { name: "Zurück" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Weiter" })).toHaveAttribute("type", "button");
  });
});

describe("snapOfSlide", () => {
  it("finds the snap that holds a slide when snaps group slides", () => {
    // Six slides, two per snap (slidesToScroll: 2).
    const registry = [[0, 1], [2, 3], [4, 5]];
    expect(snapOfSlide(registry, 1)).toBe(0);
    expect(snapOfSlide(registry, 2)).toBe(1);
    expect(snapOfSlide(registry, 5)).toBe(2);
  });

  it("falls back to the slide index without a registry entry", () => {
    expect(snapOfSlide(undefined, 3)).toBe(3);
    expect(snapOfSlide([[0], [1]], 4)).toBe(4);
  });
});

describe("Carousel wheel", () => {
  // Oracle: Embla's documented wheel-gestures plugin is what makes a carousel
  // scroll by mouse wheel and trackpad; only `wheel` adds it.
  it("adds the wheel-gestures plugin only with `wheel`", () => {
    wheelPlugin.mockClear();
    const { unmount } = render(<Carousel aria-label="A"><CarouselContent><CarouselItem>1</CarouselItem></CarouselContent></Carousel>);
    expect(wheelPlugin).not.toHaveBeenCalled();
    unmount();
    render(<Carousel aria-label="B" wheel><CarouselContent><CarouselItem>1</CarouselItem></CarouselContent></Carousel>);
    expect(wheelPlugin).toHaveBeenCalledTimes(1);
  });
});

describe("edgeFadeStyle", () => {
  it("fades only the side(s) more slides lie on", async () => {
    const { edgeFadeStyle } = await import("./carousel-context");
    expect(edgeFadeStyle("horizontal", false, false)).toBeUndefined();
    expect(edgeFadeStyle("horizontal", false, true)?.maskImage).toBe(
      "linear-gradient(to right, black, black calc(100% - 1.5rem), transparent)",
    );
    expect(edgeFadeStyle("horizontal", true, true)?.maskImage).toBe(
      "linear-gradient(to right, transparent, black 1.5rem, black calc(100% - 1.5rem), transparent)",
    );
  });
});
