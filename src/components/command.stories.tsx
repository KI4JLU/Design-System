import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, MessageSquare, Plus, Settings } from "lucide-react";
import { expect, userEvent, waitFor } from "storybook/test";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

/**
 * shadcn/ui `command` (cmdk): a list filtered by what is typed above it,
 * moved through with the arrow keys and chosen with Enter. It is the list
 * inside the chat field's command menu (`PromptInputCommand`,
 * `PromptInputCommandInput` … in `prompt-input.tsx` are this component under
 * the composer's names); a search in the app bar is `Combobox`, which adds
 * the field and the popover around such a list.
 */
const meta = {
  title: "Components/Lists & Filters/Command",
  component: Command,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

function Palette() {
  const [chosen, setChosen] = useState("");
  return (
    <div className="flex max-w-md flex-col gap-3">
      <Command className="border border-outline-variant shadow-sm" label="Befehle">
        <CommandInput placeholder="Befehl oder Quelle suchen …" />
        <CommandList>
          <CommandEmpty>Keine Treffer</CommandEmpty>
          <CommandGroup heading="Aktionen">
            <CommandItem onSelect={setChosen}>
              <Plus aria-hidden="true" />
              Neuer Chat
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={setChosen}>
              <Settings aria-hidden="true" />
              Einstellungen
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quellen">
            <CommandItem onSelect={setChosen}>
              <FileText aria-hidden="true" />
              Modulhandbuch_2026.pdf
            </CommandItem>
            <CommandItem onSelect={setChosen}>
              <FileText aria-hidden="true" />
              Prüfungsordnung.docx
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Chats">
            <CommandItem onSelect={setChosen}>
              <MessageSquare aria-hidden="true" />
              Fristen im Wintersemester
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <p className="m-0 text-sm text-on-surface-variant" data-testid="chosen">
        {chosen ? `Gewählt: ${chosen}` : "Nichts gewählt"}
      </p>
    </div>
  );
}

/**
 * Three groups, a shortcut on „Neuer Chat". `play` oracles [ARIA; text]:
 * all five options at rest; typing „prüf" leaves the one matching option and
 * hides the groups without a match; Enter chooses the highlighted option
 * (cmdk highlights the first match); typing something without a match shows „Keine Treffer" and no
 * option.
 */
export const Default: Story = {
  render: () => <Palette />,
  play: async ({ canvas }) => {
    const field = canvas.getByRole("combobox");
    await expect(canvas.getAllByRole("option")).toHaveLength(5);

    await userEvent.type(field, "prüf");
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(1));
    await expect(canvas.getByRole("option", { name: /Prüfungsordnung/ })).toBeVisible();
    await expect(canvas.queryByRole("group", { name: "Aktionen" })).toBeNull();

    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByTestId("chosen")).toHaveTextContent("Gewählt: Prüfungsordnung.docx");

    await userEvent.clear(field);
    await userEvent.type(field, "xyz");
    await waitFor(() => expect(canvas.queryAllByRole("option")).toHaveLength(0));
    await expect(canvas.getByText("Keine Treffer")).toBeVisible();
  },
};
