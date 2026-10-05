import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, within } from "storybook/test";
import { FormActionBar } from "./form-action-bar";
import { Badge } from "./badge";
import { Button } from "./button";
import { SettingsCards } from "../test/fixtures/settings-cards";

const meta = {
  title: "Components/FormActionBar",
  component: FormActionBar,
  // axe violations fail the story test instead of being reported as todo.
  parameters: { a11y: { test: "error" } },
  args: { sticky: true, children: null },
  argTypes: {
    message: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof FormActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const actions = (
  <>
    <Button variant="secondary" type="button">
      Abbrechen
    </Button>
    <Button type="submit">Speichern</Button>
  </>
);

/**
 * A visible scroll container (the page's `<main>` in the app) holding the
 * transcription module's settings form, the bar as its last child.
 */
const ScrollFrame = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    data-testid="scroll-frame"
    className={`h-120 overflow-y-auto rounded-xl border border-outline-variant bg-surface ${className ?? ""}`}
  >
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-stack-lg p-gutter">
      <h1 className="m-0 font-headline-md text-headline-md font-semibold">Transkription</h1>
      <SettingsCards />
      {children}
    </form>
  </div>
);

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export const Playground: Story = {
  args: { sticky: false, children: actions, message: "Ungespeicherte Änderungen" },
};

/**
 * **Sticky in a long form.** Scroll the frame: the bar stays 16px above its
 * bottom edge, over the cards; at the end it rests below the last card.
 * The `play` function measures both positions in Chromium.
 */
export const StickyInLongForm: Story = {
  render: () => (
    <ScrollFrame>
      <FormActionBar>{actions}</FormActionBar>
    </ScrollFrame>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("scroll-frame");
    const bar = canvasElement.querySelector<HTMLElement>("[data-slot=form-action-bar]")!;
    const cards = within(canvasElement).getAllByTestId("settings-card");
    const last = cards[cards.length - 1];

    await expect(getComputedStyle(bar).position).toBe("sticky");
    await expect(getComputedStyle(bar).zIndex).toBe("10");

    // Top of the scroll: the form overflows, the bar is pinned inside the frame.
    frame.scrollTop = 0;
    await nextFrame();
    const frameBox = frame.getBoundingClientRect();
    await expect(last.getBoundingClientRect().top).toBeGreaterThan(frameBox.bottom);
    const pinned = bar.getBoundingClientRect();
    await expect(pinned.top).toBeGreaterThan(frameBox.top);
    await expect(frameBox.bottom - pinned.bottom).toBeGreaterThanOrEqual(16);
    await expect(frameBox.bottom - pinned.bottom).toBeLessThanOrEqual(18);

    // End of the scroll: the bar sits below the last card and covers none of it.
    frame.scrollTop = frame.scrollHeight;
    await nextFrame();
    await expect(bar.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      last.getBoundingClientRect().bottom,
    );
  },
};

/**
 * **With an error message.** In the app this is an `Alert`; here a `Badge`
 * stands in. The message sits left of the actions, above them when narrow.
 */
export const WithErrorMessage: Story = {
  render: () => (
    <ScrollFrame>
      <FormActionBar
        message={
          <div role="alert" className="flex flex-wrap items-center gap-stack-sm">
            <Badge tone="error">Fehler</Badge>
            <span>Speichern fehlgeschlagen. Bitte erneut versuchen.</span>
          </div>
        }
      >
        {actions}
      </FormActionBar>
    </ScrollFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const message = canvas.getByRole("alert");
    const save = canvas.getByRole("button", { name: "Speichern" });
    // Wide bar: one row, message left of the actions.
    await expect(message.getBoundingClientRect().right).toBeLessThanOrEqual(
      save.getBoundingClientRect().left,
    );
  },
};

/**
 * **Narrow.** Below 28rem of the bar's own width (a container query, so this
 * frame shows it even on a wide screen): the message on top, the actions full
 * width with the primary action first. Nothing is shrunk.
 */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
  render: () => (
    <ScrollFrame className="max-w-80">
      <FormActionBar message="Ungespeicherte Änderungen">{actions}</FormActionBar>
    </ScrollFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const actionsBox = canvasElement
      .querySelector("[data-slot=form-action-bar-actions]")!
      .getBoundingClientRect();
    const save = canvas.getByRole("button", { name: "Speichern" }).getBoundingClientRect();
    const cancel = canvas.getByRole("button", { name: "Abbrechen" }).getBoundingClientRect();
    const message = canvasElement
      .querySelector("[data-slot=form-action-bar-message]")!
      .getBoundingClientRect();

    await expect(save.width).toBeCloseTo(actionsBox.width, 0);
    await expect(cancel.width).toBeCloseTo(actionsBox.width, 0);
    await expect(save.bottom).toBeLessThanOrEqual(cancel.top);
    await expect(message.bottom).toBeLessThanOrEqual(save.top);
  },
};

/** `sticky={false}`: the same bar as a static row, card elevation. */
export const Static: Story = {
  render: () => (
    <form onSubmit={(e) => e.preventDefault()} className="max-w-2xl">
      <FormActionBar sticky={false} message="Zuletzt gespeichert vor 5 Minuten">
        {actions}
      </FormActionBar>
    </form>
  ),
};
