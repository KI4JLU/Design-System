import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";
import { useCarouselSlides } from "./carousel-context";

/**
 * The shadcn/ui `carousel` (https://ui.shadcn.com/r/styles/new-york-v4/carousel.json),
 * imported with the shadcn CLI on Embla Carousel. `CarouselDots` and
 * `useCarouselSlides` are the DS's own: one dot per slide (the visible ones
 * long) and the slides in view for a „1–3 von 5" counter.
 */
const meta = {
  title: "Components/Carousel",
  component: Carousel,
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const ROLES = ["Forschung", "Tutor", "Verwaltung", "Lektorat", "Zusammenfassung"];

function Range() {
  const { count, inView } = useCarouselSlides();
  if (!inView.length) return null;
  return (
    <p className="m-0 text-sm text-on-surface-variant">
      {inView[0] + 1}–{inView[inView.length - 1] + 1} von {count}
    </p>
  );
}

export const Default: Story = {
  render: () => (
    <div className="mx-auto max-w-md px-12">
      <Carousel aria-label="Rollen">
        <CarouselContent>
          {ROLES.map((r) => (
            <CarouselItem key={r}>
              <div className="flex h-32 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface">
                {r}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious label="Zurück" />
        <CarouselNext label="Weiter" />
      </Carousel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Rollen" })).toHaveAttribute("aria-roledescription", "carousel");
    await expect(canvas.getAllByRole("group")).toHaveLength(5);
  },
};

/** Several slides per view, the next one peeking in with a faded edge, a counter and the dots. */
export const WithDots: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl">
      <Carousel aria-label="Rollen" opts={{ align: "start", inViewThreshold: 0.6 }}>
        <Range />
        <CarouselContent className="mt-3" fadeEdges>
          {ROLES.map((r) => (
            <CarouselItem key={r} className="basis-[30%]">
              <div className="flex h-32 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface">
                {r}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className="mt-4" dotLabel={(i, n) => `Rolle ${i + 1} von ${n}`} />
      </Carousel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("1–3 von 5")).toBeVisible();
    await expect(canvas.getAllByRole("button", { name: /^Rolle \d von 5$/ })).toHaveLength(5);
  },
};
