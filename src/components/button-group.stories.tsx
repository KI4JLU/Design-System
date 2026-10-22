import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group";
import { Button } from "./button";

/**
 * shadcn/ui `button-group`
 * (https://ui.shadcn.com/r/styles/new-york-v4/button-group.json), imported
 * with the shadcn CLI as a registry dependency of AI Elements' `message`.
 * Joins its children into one bar: inner corners squared, inner borders shared.
 */
const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three outline buttons as one horizontal group. */
export const Default: Story = {
  render: () => (
    <ButtonGroup aria-label="Ansicht">
      <Button variant="outline">Liste</Button>
      <Button variant="outline">Raster</Button>
      <Button variant="outline">Karte</Button>
    </ButtonGroup>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group", { name: "Ansicht" });
    await expect(group).toHaveAttribute("data-slot", "button-group");
    // Upstream sets data-orientation only from an explicit prop; the
    // horizontal default is the cva default, not an attribute.
    await expect(group).not.toHaveAttribute("data-orientation");
  },
};

/** A text segment and a separator between buttons. */
export const WithTextAndSeparator: Story = {
  render: () => (
    <ButtonGroup aria-label="Seiten">
      <Button variant="secondary">Zurück</Button>
      <ButtonGroupSeparator />
      <ButtonGroupText>Seite 2</ButtonGroupText>
      <ButtonGroupSeparator />
      <Button variant="secondary">Weiter</Button>
    </ButtonGroup>
  ),
};

/** The same buttons stacked. */
export const Vertical: Story = {
  render: () => (
    <ButtonGroup aria-label="Ansicht" orientation="vertical">
      <Button variant="outline">Liste</Button>
      <Button variant="outline">Raster</Button>
      <Button variant="outline">Karte</Button>
    </ButtonGroup>
  ),
};

/** The default group in the dark theme. */
export const DefaultDark: Story = {
  ...Default,
  globals: { theme: "dark" },
};
