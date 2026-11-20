import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { expect } from "storybook/test";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "./input-group";

/**
 * A field with things attached at its edges: an icon, a hint, a button.
 * JLURAG's chat composer is one (`PromptInput` renders an `InputGroup`; see
 * `Components/AI/PromptInputAdaptiveTextarea → ChatComposer`); this is the
 * plain form.
 */
const meta = {
  title: "Components/Forms/InputGroup",
  component: InputGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchField() {
  const [value, setValue] = useState("Prüfung");
  return (
    <InputGroup className="w-96">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Quellen durchsuchen"
        placeholder="Quellen durchsuchen …"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>12 Treffer</InputGroupText>
        {value && (
          <InputGroupButton size="icon-xs" aria-label="Suche leeren" onClick={() => setValue("")}>
            <X aria-hidden="true" />
          </InputGroupButton>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}

/**
 * **A search field** with a leading icon, a hit count and a clear button.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the addons sit inside the field's frame, the icon before the text and
 *    the button after it [the boxes];
 * 2. a click on the icon puts the focus into the field — the addon is part
 *    of the field, not dead space [focus];
 * 3. the clear button empties the field [the value].
 */
export const Search: Story = {
  render: () => <SearchField />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const group = canvasElement.querySelector<HTMLElement>("[data-slot='input-group']")!;
    const field = canvas.getByRole("textbox", { name: "Quellen durchsuchen" });
    const icon = group.querySelector("svg")!;
    const clear = canvas.getByRole("button", { name: "Suche leeren" });
    const frame = group.getBoundingClientRect();
    await expect(icon.getBoundingClientRect().right).toBeLessThanOrEqual(field.getBoundingClientRect().left + 1);
    await expect(clear.getBoundingClientRect().right).toBeLessThanOrEqual(frame.right);
    await expect(icon.getBoundingClientRect().left).toBeGreaterThanOrEqual(frame.left);

    await userEvent.click(icon);
    await expect(field).toHaveFocus();

    await userEvent.click(clear);
    await expect(field).toHaveValue("");
  },
};

/**
 * **Invalid**: `aria-invalid` on the control turns the whole frame to the
 * error colour, not only the input inside it.
 *
 * `play` oracle: the frame's border colour equals the `--color-error` token
 * [computed style against the token, read back through a probe].
 */
export const Invalid: Story = {
  render: () => (
    <InputGroup className="w-96">
      <InputGroupInput aria-label="Kürzel" aria-invalid="true" defaultValue="Ä!" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>Nur Buchstaben</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<HTMLElement>("[data-slot='input-group']")!;
    const probe = document.createElement("span");
    probe.style.color = "var(--color-error)";
    canvasElement.appendChild(probe);
    const error = getComputedStyle(probe).color;
    probe.remove();
    await expect(getComputedStyle(group).borderTopColor).toBe(error);
  },
};
