import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { Palette, Shield, SlidersHorizontal, User } from "lucide-react";
import { SettingsDialog, SettingsRow } from "./settings-dialog";
import { AppearanceSettings } from "./appearance-settings";
import { Button } from "./button";
import { Textarea } from "./textarea";

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
