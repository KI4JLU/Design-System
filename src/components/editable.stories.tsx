import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
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
  const [value, setValue] = useState("Arbeit");
  return (
    <Editable value={value} onValueChange={setValue} onSubmit={setValue} placeholder="Name">
      <EditableArea>
        <EditablePreview aria-label="Name bearbeiten" />
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
    await userEvent.click(canvas.getByText("Arbeit"));
    const field = await canvas.findByRole("textbox", { name: "Name" });
    await expect(field).toHaveValue("Arbeit");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByText("Arbeit")).toBeVisible();
  },
};
