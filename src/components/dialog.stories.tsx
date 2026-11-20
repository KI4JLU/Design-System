import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { expect, waitFor, within } from "storybook/test";

const meta = {
  title: "Components/Overlays/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * **A form in a dialog** — the most common dialog in JLURAG („Neues Thema",
 * „Umbenennen …"): title, one or two fields, Abbrechen and the primary action
 * in the footer.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the dialog is named by its title and described by its description
 *    [ARIA `dialog` name and description];
 * 2. focus starts in the first field, so the user can type at once [focus];
 * 3. Escape closes it and focus returns to the button that opened it [the
 *    dialog gone; focus].
 */
export const Form: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Neues Thema</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Thema</DialogTitle>
          <DialogDescription>Gib deinem Thema einen Namen. Du kannst ihn später ändern.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-topic-name">Name</Label>
          <Input id="new-topic-name" placeholder="z. B. Prüfungsordnung" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DialogClose>
          <Button>Erstellen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Neues Thema" });
    await userEvent.click(opener);
    const dialog = await body.findByRole("dialog", { name: "Neues Thema" });
    await expect(dialog).toHaveAccessibleDescription(
      "Gib deinem Thema einen Namen. Du kannst ihn später ändern.",
    );
    await waitFor(() => expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveFocus());

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(opener).toHaveFocus();
  },
};

/** Radix liefert Fokus-Falle, Esc-zum-Schließen, Scroll-Lock und ARIA gratis. */
export const Confirm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Element löschen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Element löschen?</DialogTitle>
          <DialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Abbrechen</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive">Löschen</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
