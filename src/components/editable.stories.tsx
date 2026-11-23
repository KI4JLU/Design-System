import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Editable, EditableArea, EditableInput, EditablePreview } from "./editable";

/**
 * Edit a short text in place (imported from the Dice UI registry): the text
 * turns into a field on a click; Enter or leaving the field saves, Escape
 * keeps the old text.
 */
const meta = {
  title: "Components/Forms/Editable",
  component: Editable,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Editable>;

export default meta;
type Story = StoryObj<typeof meta>;

function Title() {
  return (
    <Editable defaultValue="Arbeit" placeholder="Name">
      <EditableArea>
        <EditablePreview />
        <EditableInput aria-label="Name" />
      </EditableArea>
    </Editable>
  );
}

export const Default: Story = {
  render: () => <Title />,
  // Oracle: a click turns the text into a field holding it; Escape gives the text back.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Arbeit"));
    const field = await canvas.findByRole("textbox", { name: "Name" });
    await expect(field).toHaveValue("Arbeit");
    // Editable focuses the field a frame later; Escape before that goes nowhere.
    await waitFor(() => expect(field).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await expect(await canvas.findByText("Arbeit")).toBeVisible();
  },
};
