import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Search } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { Input } from "./input";
import { PanelSection } from "./panel-section";
import { SettingsDialog, SettingsRow } from "./settings-dialog";
import { Switch } from "./switch";
import { Textarea } from "./textarea";

/**
 * The titled blocks a settings window is made of. JustRAG builds its admin
 * tabs (Websuche, Namen, Richtlinien, Confluence) and a topic's settings
 * (Rolle, Rechte) from them, inside a `SettingsDialog`.
 */
const meta = {
  title: "Components/Forms/PanelSection",
  component: PanelSection,
  parameters: { layout: "padded" },
  args: { title: "Websuche" },
} satisfies Meta<typeof PanelSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two sections of the admin console's „Suche" tab, as JustRAG composes them. */
function SearchSettings() {
  const [web, setWeb] = useState(true);
  const [academic, setAcademic] = useState(false);
  return (
    <div className="flex flex-col gap-6 pt-5">
      <PanelSection title="Websuche" hint="Antworten dürfen Ergebnisse aus dem Web zitieren.">
        <SettingsRow label="Websuche aktivieren" control={<Switch aria-label="Websuche aktivieren" checked={web} onCheckedChange={setWeb} />} />
        <SettingsRow label="Google-API-Schlüssel" control={<Input aria-label="Google-API-Schlüssel" type="password" placeholder="AIza…" />} />
      </PanelSection>
      <PanelSection title="Akademische Suche">
        <SettingsRow
          label="Akademische Suche aktivieren"
          control={<Switch aria-label="Akademische Suche aktivieren" checked={academic} onCheckedChange={setAcademic} />}
        />
      </PanelSection>
    </div>
  );
}

function SettingsWindow() {
  // Starts closed, as the dialog is modal; the button is the app's trigger.
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Admin-Einstellungen öffnen</Button>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        title="Admin-Einstellungen"
        sections={[
          {
            value: "search",
            label: "Suche",
            icon: <Search aria-hidden="true" />,
            keywords: ["Websuche", "Google", "Akademische Suche"],
            content: <SearchSettings />,
          },
        ]}
      />
    </>
  );
}

/**
 * **In a settings window** — where `PanelSection` belongs: sections of one
 * `SettingsDialog` tab, each a titled block of `SettingsRow`s, a rule between
 * them.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. each section is a region named by its title, an `<h3>` [ARIA];
 * 2. the rule sits between sections, not above the first [computed border];
 * 3. a search for one row keeps that row and its section's title — the title
 *    is the row's heading — and hides the other section [visibility].
 */
export const InSettingsWindow: Story = {
  render: () => <SettingsWindow />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Admin-Einstellungen öffnen" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));

    const web = dialog.getByRole("region", { name: "Websuche" });
    const academic = dialog.getByRole("region", { name: "Akademische Suche" });
    await expect(dialog.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Websuche", "Akademische Suche"]);
    await expect(getComputedStyle(web).borderTopWidth).toBe("0px");
    await expect(getComputedStyle(academic).borderTopWidth).toBe("1px");

    await userEvent.type(dialog.getByRole("searchbox"), "Google");
    await waitFor(() => expect(dialog.getByText("Google-API-Schlüssel")).toBeVisible());
    await expect(dialog.getByRole("heading", { name: "Websuche" })).toBeVisible();
    await waitFor(() => expect(dialog.queryByText("Akademische Suche aktivieren")).not.toBeVisible());
  },
};

/**
 * **Hint and counter** — `hint` says what the section is for, `aside` holds
 * a counter (or one action) at the end of the title row, and `grow` lets the
 * section take the height left, for a growing editor.
 *
 * `play` oracles: the counter ends where the title row ends, on its line
 * [the boxes]; the hint is muted text under the title [the DOM order].
 */
export const HintAndCounter: Story = {
  render: () => (
    <div className="flex h-96 max-w-xl flex-col">
      <PanelSection title="Begrüßung" aside="0 / 500" hint="Der erste Satz, den das Thema in einem neuen Chat zeigt." grow>
        <Textarea aria-label="Begrüßung" className="flex-1" placeholder="z. B. Hallo! Frag mich zur Prüfungsordnung." />
      </PanelSection>
    </div>
  ),
  play: async ({ canvas }) => {
    const title = canvas.getByRole("heading", { level: 3, name: "Begrüßung" });
    const counter = canvas.getByText("0 / 500");
    const row = title.parentElement!.getBoundingClientRect();
    await expect(counter.getBoundingClientRect().right).toBeCloseTo(row.right, 0);
    await expect(Math.abs(counter.getBoundingClientRect().top + counter.getBoundingClientRect().height / 2 - (row.top + row.height / 2))).toBeLessThan(1);
    const hint = canvas.getByText(/Der erste Satz/);
    await expect(title.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  },
};
