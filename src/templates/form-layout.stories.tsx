import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { FormLayout } from "./form-layout";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Stack } from "../components/stack";
import * as formStories from "../components/form.stories";
import * as selectStories from "../components/select.stories";
import { SettingsCards } from "../test/fixtures/settings-cards";

// Portable Stories: Feld-Beispiele aus den bestehenden Component-Stories
// werden als Formularinhalt wiederverwendet, nicht neu gemockt.
const { Field, WithError } = composeStories(formStories, {});
const { InForm: SelectInForm } = composeStories(selectStories, {});

const meta = {
  title: "Templates/FormLayout",
  component: FormLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  argTypes: {
    size: { control: "select", options: ["reading", "content", "page"] },
    stickyActions: { control: "boolean" },
  },
} satisfies Meta<typeof FormLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settings: Story = {
  args: {
    title: "Element-Einstellungen",
    description: "Name, Standard-Modell und Fehlerzustände.",
  },
  render: (args) => (
    <form onSubmit={(e) => e.preventDefault()}>
      <FormLayout
        {...args}
        actions={
          <>
            <Button variant="secondary" type="button">
              Abbrechen
            </Button>
            <Button type="submit">Speichern</Button>
          </>
        }
      >
        <Card className="p-6">
          <Stack gap="md">
            <Field />
            <SelectInForm />
          </Stack>
        </Card>
        <Card className="p-6">
          <WithError />
        </Card>
      </FormLayout>
    </form>
  ),
};

/**
 * **Long settings form: `stickyActions` + `size="content"`.** The
 * transcription module's settings, wider than the reading measure, inside a
 * visible scroll container (the shell's `<main>` in the app). The actions
 * stay in a `FormActionBar` at the bottom while the cards scroll.
 *
 * The `play` function checks in Chromium that the bar is pinned, and that a
 * field focused while it sits behind the bar is scrolled clear of it (the
 * fields' scroll margin, WCAG 2.4.11).
 */
export const StickyActionsWide: Story = {
  args: {
    title: "Transkription",
    description: "Einstellungen des Moduls für alle Nutzenden.",
    size: "content",
    stickyActions: true,
  },
  render: (args) => (
    <div data-testid="scroll-frame" className="h-screen overflow-y-auto">
      <form onSubmit={(e) => e.preventDefault()}>
        <FormLayout
          {...args}
          actions={
            <>
              <Button variant="secondary" type="button">
                Abbrechen
              </Button>
              <Button type="submit">Speichern</Button>
            </>
          }
        >
          <SettingsCards />
        </FormLayout>
      </form>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("scroll-frame");
    const bar = canvasElement.querySelector<HTMLElement>("[data-slot=form-action-bar]")!;
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

    await expect(getComputedStyle(bar).position).toBe("sticky");
    frame.scrollTop = 0;
    await nextFrame();
    const frameBox = frame.getBoundingClientRect();
    await expect(bar.getBoundingClientRect().bottom).toBeLessThanOrEqual(frameBox.bottom);

    // Scroll a field to lie right behind the bar, then focus it.
    const input = within(canvasElement).getByLabelText("Aufbewahrung (Tage)");
    const barBox = bar.getBoundingClientRect();
    const fieldBox = input.getBoundingClientRect();
    frame.scrollTop += (fieldBox.top + fieldBox.bottom) / 2 - (barBox.top + barBox.bottom) / 2;
    await nextFrame();
    const covered = input.getBoundingClientRect();
    await expect(covered.bottom).toBeGreaterThan(bar.getBoundingClientRect().top);

    input.focus();
    await nextFrame();
    await expect(input.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      bar.getBoundingClientRect().top,
    );
  },
};
