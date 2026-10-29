import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { Activity, Database, Globe, Palette, Shield, SlidersHorizontal, Trash2, User, Users } from "lucide-react";
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
 * `maximizable` adds the toggle next to the close button that lets it fill
 * the window.
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
        maximizable
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

/**
 * Groups: many sections, told apart by a small grey heading over each run
 * (`group` on the section). The admin window of an app is the case — a flat
 * list of ten rows says nothing about which belong together. Sections of one
 * group stay together in `sections`; a search that matches nothing in a group
 * hides its heading.
 */
function GroupsDemo() {
  const [open, setOpen] = useState(false);
  const row = (label: string) => <SettingsRow label={label} control={<span className="text-on-surface-variant">–</span>} />;
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Admin öffnen</Button>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        title="Admin-Einstellungen"
        size="xl"
        sections={[
          // Tall on purpose: the content scrolls, so the fade at its edge can be checked.
          { value: "models", label: "KI-Modelle", group: "Konfiguration", icon: <SlidersHorizontal aria-hidden="true" />, content: Array.from({ length: 24 }, (_, i) => <div key={i}>{row(`Konfiguration ${i + 1}`)}</div>) },
          // Tall as well: switching between two sections that both overflow is what shows the scroll reset.
          { value: "auth", label: "Anmeldung", group: "Konfiguration", icon: <Shield aria-hidden="true" />, content: Array.from({ length: 24 }, (_, i) => <div key={i}>{row(`Anbieter ${i + 1}`)}</div>) },
          { value: "overview", label: "KB-Übersicht", group: "Wissensbasen", icon: <Database aria-hidden="true" />, content: row("Wissensbasen") },
          { value: "public", label: "Öffentliche KBs", group: "Wissensbasen", icon: <Globe aria-hidden="true" />, keywords: ["global"], content: row("Veröffentlicht") },
          { value: "users", label: "Benutzer", group: "Nutzer", icon: <Users aria-hidden="true" />, content: row("Konten") },
          { value: "health", label: "System-Health", group: "Betrieb", icon: <Activity aria-hidden="true" />, content: row("Warteschlangen") },
        ]}
      />
    </div>
  );
}

export const Groups: Story = {
  args: { open: false, onOpenChange: () => {}, sections: [] },
  render: () => <GroupsDemo />,
  // ORACLE: the browser — the heading's computed size and colour against the
  // `--color-outline` token resolved on a probe element, its inset against the
  // rows', and the roles the dialog exposes.
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Admin öffnen" }));
    const dialog = await body.findByRole("dialog", { name: "Admin-Einstellungen" });
    const inDialog = within(dialog);

    // No title of its own in the column: the first thing in it is the search.
    const title = inDialog.getByText("Admin-Einstellungen");
    await expect(title).toHaveClass("sr-only");
    // The section scrolls under its title, not up to the dialog's top edge: the
    // scroll box starts at or below the heading, so the scrollbar does too.
    const heading = inDialog.getByRole("heading", { level: 2, name: "KI-Modelle" });
    const scroller = dialog.querySelector<HTMLElement>('[data-slot="settings-dialog-content"]');
    if (!scroller) throw new Error("SettingsDialog rendered no content box");
    await expect(getComputedStyle(scroller).overflowY).toBe("auto");
    await expect(scroller.getBoundingClientRect().top).toBeGreaterThanOrEqual(heading.getBoundingClientRect().bottom);
    await expect(heading.getBoundingClientRect().top).toBeGreaterThan(dialog.getBoundingClientRect().top);

    // Content that has scrolled under the title fades out there (a mask, not an overlay).
    // At rest: no top fade (nothing is under the title yet), a bottom one (more follows).
    await waitFor(() => expect(scroller.dataset.scrollFade).toBe("bottom"));
    scroller.scrollTop = 120;
    await waitFor(() => expect(scroller.dataset.scrollFade).toContain("top"));
    await expect(getComputedStyle(scroller).maskImage).not.toBe("none");
    scroller.scrollTop = 0;
    await waitFor(() => expect(scroller.dataset.scrollFade ?? "").not.toContain("top"));

    // A new section starts at the top, not where the last one was scrolled to.
    scroller.scrollTop = 200;
    await expect(scroller.scrollTop).toBeGreaterThan(0);
    await userEvent.click(inDialog.getByRole("button", { name: "Anmeldung" }));
    // The other section overflows too, so 0 here is the reset, not the browser clamping a short section.
    const box = () => dialog.querySelector<HTMLElement>('[data-slot="settings-dialog-content"]')!;
    await waitFor(() => expect(box().scrollHeight).toBeGreaterThan(box().clientHeight));
    await expect(box().scrollTop).toBe(0);
    await userEvent.click(inDialog.getByRole("button", { name: "KI-Modelle" }));

    // …and the first group stands off the search by at least 16px.
    const searchBox = inDialog.getByRole("searchbox").getBoundingClientRect();
    await expect(inDialog.getByRole("group", { name: "Konfiguration" }).getBoundingClientRect().top - searchBox.bottom)
      .toBeGreaterThanOrEqual(16);

    // One labelled group per run, its rows inside it, in order.
    const kbs = inDialog.getByRole("group", { name: "Wissensbasen" });
    await expect(within(kbs).getAllByRole("button").map((b) => b.textContent)).toEqual(["KB-Übersicht", "Öffentliche KBs"]);
    await expect(inDialog.getAllByRole("group")).toHaveLength(4);

    // The label reads as the sidebar's list title does: 13px, outline grey,
    // and its text starts where the rows' content starts (same box edge, same inset).
    const label = inDialog.getByText("Wissensbasen");
    await expect(getComputedStyle(label).fontSize).toBe("13px");
    await expect(getComputedStyle(label).color).toBe(resolvedColor(canvasElement, "var(--color-outline)"));
    const row = within(kbs).getByRole("button", { name: "KB-Übersicht" });
    await expect(label.getBoundingClientRect().left).toBe(row.getBoundingClientRect().left);
    await expect(getComputedStyle(label).paddingLeft).toBe(getComputedStyle(row).paddingLeft);

    // Searching drops the headings of groups with no match.
    await userEvent.type(inDialog.getByRole("searchbox"), "global");
    await expect(inDialog.queryByRole("group", { name: "Konfiguration" })).toBeNull();
    await expect(inDialog.getByRole("group", { name: "Wissensbasen" })).toBeVisible();
    await expect(inDialog.getAllByRole("group")).toHaveLength(1);
  },
};
