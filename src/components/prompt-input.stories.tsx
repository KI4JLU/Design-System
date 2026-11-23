import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { ArrowUp } from "lucide-react";
import { expect, fn, waitFor } from "storybook/test";
import { InputGroupAddon } from "./input-group";
import { PromptInput, PromptInputSubmit, PromptInputTextarea } from "./prompt-input";

/**
 * The chat composer's form: it owns the draft, the attachments and the
 * submit. How it looks in the app — plus menu, adaptive textarea, tools and
 * send overlaid on the frame — is `Components/AI/PromptInputAdaptiveTextarea
 * → ChatComposer`. These stories pin what the form does.
 */
const meta = {
  title: "Components/AI/PromptInput",
  component: PromptInput,
  parameters: { layout: "padded" },
  args: { onSubmit: fn(), onError: fn() },
} satisfies Meta<typeof PromptInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A minimal composer: the textarea and a send button that is off while empty. */
function Composer(props: ComponentProps<typeof PromptInput>) {
  const [value, setValue] = useState("");
  return (
    <div className="w-[560px]">
      <PromptInput
        {...props}
        onSubmit={(message, event) => {
          setValue("");
          return props.onSubmit(message, event);
        }}
      >
        <PromptInputTextarea
          aria-label="Nachricht"
          placeholder="Stelle eine Frage …"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <InputGroupAddon align="block-end" className="justify-end">
          <PromptInputSubmit className="size-10" aria-label="Senden" disabled={!value.trim()}>
            <ArrowUp aria-hidden="true" />
          </PromptInputSubmit>
        </InputGroupAddon>
      </PromptInput>
    </div>
  );
}

/**
 * **Sending**: Enter sends, Shift+Enter starts a new line, an empty draft is
 * not sent.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. Enter on an empty draft sends nothing, the send button is off
 *    [`onSubmit` calls; `disabled`];
 * 2. Shift+Enter adds a line instead of sending [the value; `onSubmit`];
 * 3. Enter sends the whole draft, both lines, and empties the field [the
 *    `onSubmit` message; the value].
 */
export const Sending: Story = {
  render: (args) => <Composer {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Nachricht" });
    const send = canvas.getByRole("button", { name: "Senden" });

    await userEvent.click(field);
    await userEvent.keyboard("{Enter}");
    await expect(send).toBeDisabled();
    await expect(args.onSubmit).not.toHaveBeenCalled();

    await userEvent.type(field, "Wie lange dauert die Klausur?");
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    await userEvent.type(field, "Und wie oft darf ich sie wiederholen?");
    await expect(field).toHaveValue(
      "Wie lange dauert die Klausur?\nUnd wie oft darf ich sie wiederholen?",
    );
    await expect(args.onSubmit).not.toHaveBeenCalled();

    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
    const [message] = (args.onSubmit as ReturnType<typeof fn>).mock.calls[0];
    await expect(message.text).toBe(
      "Wie lange dauert die Klausur?\nUnd wie oft darf ich sie wiederholen?",
    );
    await expect(field).toHaveValue("");
  },
};

/** A drop of `files` onto `target`, as the browser sends it. */
function drop(target: HTMLElement, files: File[]) {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  for (const type of ["dragenter", "dragover", "drop"]) {
    target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }));
  }
}

/**
 * **File rules**: `accept`, `maxFiles` and `maxFileSize` turn a dropped file
 * away and say why through `onError`; a file that passes is attached and sent
 * with the message.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. a file of a type not accepted is refused with `accept` [the `onError`
 *    code];
 * 2. a file over the size limit is refused with `max_file_size` [the code];
 * 3. a PDF within the limits goes out with the message [the `onSubmit`
 *    message's `files`].
 */
export const FileRules: Story = {
  args: { accept: "application/pdf", maxFiles: 2, maxFileSize: 1024 },
  render: (args) => <Composer {...args} />,
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const form = canvasElement.querySelector("form")!;
    const onError = args.onError as ReturnType<typeof fn>;

    drop(form, [new File(["x"], "Notizen.txt", { type: "text/plain" })]);
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    await expect(onError.mock.calls[0][0].code).toBe("accept");

    drop(form, [new File(["x".repeat(4096)], "Gross.pdf", { type: "application/pdf" })]);
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(2));
    await expect(onError.mock.calls[1][0].code).toBe("max_file_size");

    drop(form, [new File(["%PDF-1.4"], "Pruefungsordnung.pdf", { type: "application/pdf" })]);
    const field = canvas.getByRole("textbox", { name: "Nachricht" });
    await userEvent.type(field, "Fasse das zusammen");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
    const [message] = (args.onSubmit as ReturnType<typeof fn>).mock.calls[0];
    await expect(message.files.map((f: { filename?: string }) => f.filename)).toEqual([
      "Pruefungsordnung.pdf",
    ]);
  },
};
