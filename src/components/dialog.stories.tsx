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
  DialogBody,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { FormItem, FormLabel, FormControl } from "./form";
import { expect, screen, userEvent, waitFor } from "storybook/test";

/** Open-by-default stories render in their own iframe on the docs page, so their modals don't stack. */
const OPEN_IN_IFRAME = { docs: { story: { inline: false, iframeHeight: 560 } } };

const TERMS = [
  ["Vorlesung", "lecture"],
  ["Übung", "tutorial"],
  ["Prüfungsamt", "examinations office"],
  ["Studiengang", "degree programme"],
  ["Modulhandbuch", "module handbook"],
  ["Leistungspunkte", "credit points"],
  ["Hörsaal", "lecture hall"],
  ["Rückmeldung", "re-registration"],
  ["Lehrstuhl", "chair"],
  ["Fachbereich", "faculty"],
];

const meta = {
  title: "Components/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

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

const SIZES = [
  ["sm", 384],
  ["default", 512],
  ["lg", 672],
  ["xl", 768],
] as const;

/**
 * `size` setzt die Breite: `sm` 384px · `default` 512px · `lg` 672px ·
 * `xl` 768px (z. B. die Vorlagen-Bibliothek der Transkription).
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {SIZES.map(([size]) => (
        <Dialog key={size}>
          <DialogTrigger asChild>
            <Button variant="outline">Größe {size}</Button>
          </DialogTrigger>
          <DialogContent size={size} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Dialog in Größe {size}</DialogTitle>
            </DialogHeader>
            <p className="m-0 text-sm text-on-surface-variant">
              Die Breite folgt der Größe; auf schmalen Bildschirmen nutzt jeder Dialog die volle Breite.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Schließen</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const [size, px] of SIZES) {
      await userEvent.click(canvas.getByRole("button", { name: `Größe ${size}` }));
      const dialog = await screen.findByRole("dialog");
      await expect(dialog.getBoundingClientRect().width).toBe(px);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    }
  },
};

/**
 * Langer Inhalt: `DialogBody` scrollt allein, Kopf und Fußzeile bleiben
 * sichtbar. Der Dialog ist auf die Fensterhöhe begrenzt.
 */
export const LongScrollingBody: Story = {
  parameters: OPEN_IN_IFRAME,
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>Glossar bearbeiten</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Glossar bearbeiten</DialogTitle>
          <DialogDescription>Begriffe, die der Übersetzer immer gleich überträgt.</DialogDescription>
        </DialogHeader>
        <DialogBody data-testid="body">
          <div className="grid grid-cols-2 gap-4">
            {TERMS.map(([de, en]) => (
              <div key={de} className="contents">
                <FormItem>
                  <FormLabel>Deutsch</FormLabel>
                  <FormControl>
                    <Input defaultValue={de} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Englisch</FormLabel>
                  <FormControl>
                    <Input defaultValue={en} />
                  </FormControl>
                </FormItem>
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter data-testid="footer">
          <DialogClose asChild>
            <Button variant="secondary">Abbrechen</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Speichern</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    const body = screen.getByTestId("body");
    const footer = screen.getByTestId("footer");
    // The body scrolls, the frame does not, and the whole dialog fits the window.
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await expect(dialog.scrollHeight).toBeLessThanOrEqual(dialog.clientHeight);
    const rect = dialog.getBoundingClientRect();
    await expect(rect.top).toBeGreaterThanOrEqual(0);
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(rect.bottom);
  },
};

/** Ein langer Titel bricht um, statt unter den Schließen-Knopf zu laufen. */
export const LongTitle: Story = {
  parameters: OPEN_IN_IFRAME,
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>Nutzer anzeigen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Prof. Dr. Maximiliane Musterfrau-Beispielhausen
          </DialogTitle>
          <DialogDescription>
            maximiliane.musterfrau-beispielhausen@uni-giessen.de
          </DialogDescription>
        </DialogHeader>
        <p className="m-0 text-sm text-on-surface">Rolle: Administratorin</p>
      </DialogContent>
    </Dialog>
  ),
  play: async () => {
    const title = await screen.findByRole("heading", { name: /Musterfrau/ });
    const close = screen.getByRole("button", { name: "Schließen" });
    await expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(
      close.getBoundingClientRect().left,
    );
  },
};
