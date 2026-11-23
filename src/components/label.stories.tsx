import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId } from "react";
import { expect } from "storybook/test";
import { Input } from "./input";
import { Label } from "./label";

/**
 * The shared form label. Inside a `Form` the `FormLabel` ties it to its
 * control (see `Components/Forms/Form`); outside one, `htmlFor` does.
 */
const meta = {
  title: "Components/Forms/Label",
  component: Label,
  parameters: { layout: "padded" },
  args: { children: "Name des Themas" },
  render: function Render(args) {
    // One id per mounted example: on the Docs page every example is in one
    // document, and a shared id would tie each label to the first field.
    const id = useId();
    return (
      <div className="flex w-80 flex-col gap-1.5">
        <Label {...args} htmlFor={id} />
        <Input id={id} placeholder="z. B. Prüfungsordnung" />
      </div>
    );
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * **A label above its field**, tied by `htmlFor`.
 *
 * `play` oracles: the field's accessible name is the label [ARIA]; a click
 * on the label moves the focus into the field [focus].
 */
export const WithInput: Story = {
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Name des Themas" });
    await userEvent.click(canvas.getByText("Name des Themas"));
    await expect(field).toHaveFocus();
  },
};

/**
 * **Beside a disabled field** the label dims too: it follows a field marked
 * `peer` (`peer-disabled:`), so the field comes first in the DOM.
 *
 * `play` oracle: the label is less opaque than at rest [computed opacity].
 */
export const DisabledField: Story = {
  render: function Render(args) {
    const id = useId();
    return (
      <div className="flex w-80 flex-col-reverse gap-1.5">
        <Input id={id} className="peer" disabled defaultValue="Prüfungsordnung" />
        <Label {...args} htmlFor={id} />
      </div>
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Name des Themas" })).toBeDisabled();
    await expect(Number(getComputedStyle(canvas.getByText("Name des Themas")).opacity)).toBeLessThan(1);
  },
};
