import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { Palette, Shield, SlidersHorizontal, Trash2, User } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";
import { SettingsDialog, SettingsRow } from "./settings-dialog";
import { AppearanceSettings } from "./appearance-settings";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Textarea } from "./textarea";
import { page, resolvedColor, resolvedStyle } from "../test/fixtures/combobox-panel";

const meta = {
  title: "Components/SettingsDialog",
  component: SettingsDialog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  // Starts closed: the dialog is modal and would cover the canvas (and the
  // docs page) on load. The button is the trigger an app would have.
  const [open, setOpen] = useState(false);
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Einstellungen öffnen</Button>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        sections={[
          {
            value: "appearance",
            label: "Darstellung",
            icon: <Palette aria-hidden="true" />,
            // The row labels, so the search finds the section by them.
            keywords: ["Farbschema", "Kontrast", "Akzentfarbe", "Stil"],
            // Wired to the real providers: the Storybook decorator mounts
            // ThemeProvider + AppearanceProvider, so a choice here restyles the
            // whole canvas (the toolbar's next change wins again).
            content: <AppearanceSettings />,
          },
          {
            value: "profile",
            label: "Profil",
            icon: <User aria-hidden="true" />,
            keywords: ["Benutzername", "E-Mail"],
            content: (
              <>
                <SettingsRow label="Benutzername" control={<span className="text-on-surface-variant">@grace</span>} />
                <SettingsRow label="E-Mail" control={<span className="text-on-surface-variant">grace@uni-giessen.de</span>} />
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

export const Default: Story = {
  args: { open: false, onOpenChange: () => {}, sections: [] },
  render: () => <Demo />,
};

/**
 * `size="xl"` + `fitTo` + `footer`: an editor that is saved explicitly. From
 * `sm` it covers the content column (here the box right of the fake sidebar),
 * below `sm` the whole screen; the overlay still disables the sidebar.
 */
function WorkspaceDemo() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const area = useRef<HTMLDivElement>(null);
  return (
    <div className="flex h-dvh">
      <aside className="w-64 shrink-0 border-r border-outline-variant bg-surface-container-low p-4 text-sm">Seitenleiste</aside>
      <div ref={area} className="flex-1 p-6">
        <Button onClick={() => setOpen(true)}>Thema-Einstellungen öffnen</Button>
      </div>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        title="Thema-Einstellungen"
        size="xl"
        fitTo={area}
        sections={[
          {
            value: "behavior",
            label: "Verhalten",
            icon: <SlidersHorizontal aria-hidden="true" />,
            keywords: ["System-Prompt", "Persona", "Ton"],
            content: (
              <Textarea aria-label="System-Prompt" value={draft} onChange={(e) => setDraft(e.target.value)} className="mt-5 min-h-72" />
            ),
          },
          {
            value: "roles",
            label: "Rollen & Rechte",
            icon: <Shield aria-hidden="true" />,
            keywords: ["Quellen", "Zitate", "Download"],
            content: <SettingsRow label="Betrachter sehen Quellen" control={<span className="text-on-surface-variant">Nein</span>} />,
          },
        ]}
        footer={(
          <>
            <span className="text-sm text-on-surface-variant">{draft ? "" : "Keine Änderungen"}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
              <Button disabled={!draft}>Speichern</Button>
            </div>
          </>
        )}
      />
    </div>
  );
}

export const Workspace: Story = {
  args: { open: false, onOpenChange: () => {}, sections: [] },
  render: () => <WorkspaceDemo />,
};

/**
 * Delete in the footer: an editor whose object can be deleted. The footer's
 * left group holds the delete action — always `ghost-destructive`, never a
 * neutral `ghost` with a trash icon — next to the status text; Abbrechen and
 * Speichern stay on the right. Delete opens a confirm step whose own button is
 * `destructive`. The pattern to copy for „Thema löschen" and the like.
 */
function DeleteInFooterDemo() {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState("");
  const area = useRef<HTMLDivElement>(null);
  return (
    <div className="flex h-dvh">
      <aside className="w-64 shrink-0 border-r border-outline-variant bg-surface-container-low p-4 text-sm">Seitenleiste</aside>
      <div ref={area} className="flex-1 p-6">
        <Button onClick={() => setOpen(true)}>Thema-Einstellungen öffnen</Button>
      </div>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        title="Thema-Einstellungen"
        size="xl"
        fitTo={area}
        sections={[
          {
            value: "behavior",
            label: "Verhalten",
            icon: <SlidersHorizontal aria-hidden="true" />,
            keywords: ["System-Prompt", "Persona", "Ton"],
            content: (
              <Textarea aria-label="System-Prompt" value={draft} onChange={(e) => setDraft(e.target.value)} className="mt-5 min-h-72" />
            ),
          },
        ]}
        footer={(
          <>
            <div className="flex items-center gap-3">
              <Button variant="ghost-destructive" onClick={() => setConfirming(true)}>
                <Trash2 aria-hidden="true" className="size-4" />
                Löschen
              </Button>
              <span className="text-sm text-on-surface-variant">{draft ? "" : "Keine Änderungen"}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
              <Button disabled={!draft}>Speichern</Button>
            </div>
          </>
        )}
      />
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thema löschen?</DialogTitle>
            <DialogDescription>Chats und Quellen des Themas werden mitgelöscht. Das kann nicht rückgängig gemacht werden.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirming(false);
                setOpen(false);
              }}
            >
              Endgültig löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const DeleteInFooter: Story = {
  args: { open: false, onOpenChange: () => {}, sections: [] },
  render: () => <DeleteInFooterDemo />,
  // ORACLE: the browser — rendered positions inside the footer and computed
  // colours against the `--color-error` tokens resolved on a probe element,
  // never the variants' class strings.
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    const error = resolvedColor(canvasElement, "var(--color-error)");

    await userEvent.click(canvas.getByRole("button", { name: "Thema-Einstellungen öffnen" }));
    const dialog = await body.findByRole("dialog", { name: "Thema-Einstellungen" });
    const footer = dialog.querySelector<HTMLElement>('[data-slot="settings-dialog-footer"]');
    if (!footer) throw new Error("SettingsDialog rendered no footer");
    const inFooter = within(footer);

    // Delete sits left, Abbrechen and Speichern right, on one row.
    const del = inFooter.getByRole("button", { name: "Löschen" }).getBoundingClientRect();
    const cancel = inFooter.getByRole("button", { name: "Abbrechen" }).getBoundingClientRect();
    const save = inFooter.getByRole("button", { name: "Speichern" }).getBoundingClientRect();
    const box = footer.getBoundingClientRect();
    await expect(del.right).toBeLessThan(cancel.left);
    await expect(cancel.right).toBeLessThanOrEqual(save.left);
    await expect(del.left - box.left).toBeLessThan(box.right - del.right);
    await expect(save.right - box.left).toBeGreaterThan(box.right - save.right);
    // Same row: vertical centres within a pixel (a ghost and an outline
    // button round their boxes differently).
    await expect(Math.abs((del.top + del.bottom) / 2 - (cancel.top + cancel.bottom) / 2)).toBeLessThanOrEqual(1);

    // The delete action reads as dangerous at rest: red text.
    await expect(getComputedStyle(inFooter.getByRole("button", { name: "Löschen" })).color).toBe(error);

    // The confirm step's own button is the filled destructive one.
    await userEvent.click(inFooter.getByRole("button", { name: "Löschen" }));
    const confirm = await body.findByRole("dialog", { name: "Thema löschen?" });
    const final = within(confirm).getByRole("button", { name: "Endgültig löschen" });
    await expect(getComputedStyle(final).backgroundColor).toBe(resolvedStyle(canvasElement, "backgroundColor", "var(--color-error)"));

    // Abbrechen in the confirm step keeps the editor open.
    await userEvent.click(within(confirm).getByRole("button", { name: "Abbrechen" }));
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Thema löschen?" })).toBeNull());
    await expect(body.getByRole("dialog", { name: "Thema-Einstellungen" })).toBeVisible();

    await userEvent.click(inFooter.getByRole("button", { name: "Abbrechen" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};
