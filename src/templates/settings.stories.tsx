import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { LayoutGrid, Menu } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { Logo } from "../components/logo";
import { AppShellFixture } from "../test/fixtures/app-shell";
import { ADMIN_SETTINGS_TITLE, AdminSettingsDialog } from "../test/fixtures/admin-settings";
import { OWN_IFRAME_IN_DOCS, page } from "../test/fixtures/app-shell-stories";
import { MeinWissen } from "../test/fixtures/mein-wissen";
import { TOPIC_NAME, TopicConversation } from "../test/fixtures/topic-chat";
import { TOPIC_SETTINGS_TITLE } from "../test/fixtures/topic-settings";

/* ---------------------------------------------------------------------------
 * The app's settings windows, one story each: the user's settings (from the
 * user menu), a topic's settings (from the topic view's gear) and the admin
 * console. All three are a `SettingsDialog` — sections in a column, grouped
 * where there are many, each built from `PanelSection` and `SettingsRow`.
 * Content modelled on JustRAG. Tables and forms of the app live here, not on
 * pages of the shell.
 *
 * Each story opens its window; on the docs page every story renders in its
 * own iframe, so the open windows do not cover each other.
 * ------------------------------------------------------------------------- */

const meta = {
  title: "Templates/Settings",
  component: AppShellLayout,
  parameters: { layout: "fullscreen", controls: { disable: true }, ...OWN_IFRAME_IN_DOCS },
  // Required props only; the stories render the fixture, which owns the slots.
  args: {
    logo: <Logo product="RAG" />,
    nav: null,
    leftOpen: true,
    onLeftOpenChange: () => {},
    mobileTabs: [
      { id: "nav", icon: <Menu aria-hidden="true" />, label: "Navigation", pane: "left" },
      { id: "page", icon: <LayoutGrid aria-hidden="true" />, label: "Inhalt", pane: "main" },
    ],
    activeMobileTab: "page",
    onMobileTabChange: () => {},
    mobileTabBarLabel: "Bereich wechseln",
  },
} satisfies Meta<typeof AppShellLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * **Colour scheme, contrast, accent and Style live behind the user menu**, not
 * in the bar: „Einstellungen" opens the settings window on its „Darstellung"
 * section (`SettingsDialog` + `AppearanceSettings`). The same overview as
 * `Overview`; this story walks the route.
 *
 * `play` (Chromium), oracles in brackets: „Einstellungen" in the user menu
 * opens the settings window on „Darstellung", with the colour-scheme field,
 * and it closes again [ARIA roles and names: `menuitem`, `dialog`, `heading`
 * level 2, `combobox`].
 */
export const UserSettings: Story = {
  render: () => (
    <AppShellFixture context="overview" bar={false}>
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const body = page(canvasElement);
    // Narrower than `md` (a docs iframe in a small window) the user menu is in
    // the navigation drawer, which is closed and portalled: open it first.
    const drawerToggle = canvasElement.querySelector<HTMLElement>("[data-slot='app-shell-drawer-toggle']");
    if (drawerToggle) await userEvent.click(drawerToggle);
    await userEvent.click(await body.findByRole("button", { name: /Jamie Lee/ }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Einstellungen" }));
    const dialog = await body.findByRole("dialog", { name: "Einstellungen" });
    await expect(
      within(dialog).getByRole("heading", { level: 2, name: "Darstellung" }),
    ).toBeVisible();
    await expect(within(dialog).getByRole("combobox", { name: "Farbschema" })).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "Schließen" }));
    // By name: narrow, the open navigation drawer is a dialog too.
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Einstellungen" })).toBeNull());
  },
};

/**
 * **A topic's settings** — the gear in the topic view's bar opens
 * „Thema-Einstellungen":
 * a `SettingsDialog` (`size="xl"`, maximizable) with Startseite, Verhalten,
 * Berechtigungen, Mitglieder and Versionsverlauf (`topic-settings` fixture).
 * This is where the app's tables and forms are — in settings windows, not on
 * pages of the shell: the rights per role are a `Table` (Besitzer and Admin
 * one muted band, their rights fixed), the members a list, the footer the
 * draft state with „Abbrechen / Speichern".
 *
 * `play` (Chromium) walks the window as a user does and ends on the rights
 * table; oracles in brackets:
 * 1. the gear announces a dialog and opens „Thema-Einstellungen" on
 *    „Startseite", with the footer's „Speichern" [ARIA `aria-haspopup`,
 *    `dialog`, `heading` level 2, `button`];
 * 2. „Berechtigungen" shows the rights as a table with the four roles as
 *    column headers; a Bearbeiter right is a checkbox that can be changed, an
 *    Admin right one that cannot [ARIA `table`, `columnheader`, `checkbox`,
 *    `aria-disabled` / state after a click];
 * 3. „Personen zuweisen" leads to „Mitglieder", which lists the three members
 *    [ARIA `heading`, `list` / `listitem`];
 * 4. „Versionsverlauf" has no footer — nothing there is a draft
 *    [no „Speichern" button].
 */
export const TopicSettings: Story = {
  render: () => (
    <AppShellFixture context="topic" topic={TOPIC_NAME}>
      <TopicConversation />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    const gear = canvas.getByRole("button", { name: "Einstellungen des Themas" });
    await expect(gear).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.click(gear);

    const dialog = await body.findByRole("dialog", { name: TOPIC_SETTINGS_TITLE });
    const d = within(dialog);
    await expect(d.getByRole("heading", { level: 2, name: "Startseite" })).toBeVisible();
    await expect(d.getByRole("button", { name: "Speichern" })).toBeInTheDocument();

    await userEvent.click(d.getByRole("button", { name: "Verhalten" }));
    await expect(await d.findByRole("heading", { level: 2, name: "Verhalten" })).toBeVisible();
    await expect(d.getByRole("radiogroup", { name: "Rolle" })).toBeVisible();

    await userEvent.click(d.getByRole("button", { name: "Berechtigungen" }));
    const table = await d.findByRole("table", { name: "Rechte je Rolle" });
    const t = within(table);
    for (const role of ["Besitzer", "Admin", "Bearbeiter", "Leser"]) {
      await expect(t.getByRole("columnheader", { name: role })).toBeInTheDocument();
    }
    const editable = t.getByRole("checkbox", { name: "Leser: Sehen" });
    await expect(editable).not.toBeChecked();
    await userEvent.click(editable);
    await expect(editable).toBeChecked();
    await userEvent.click(editable);
    await expect(t.getByRole("checkbox", { name: "Admin: Sehen (fest)" })).toBeDisabled();

    await userEvent.click(d.getByRole("button", { name: "Personen zuweisen" }));
    await expect(await d.findByRole("heading", { level: 2, name: "Mitglieder" })).toBeVisible();
    await expect(
      within(d.getByRole("list", { name: "Mitglieder" })).getAllByRole("listitem"),
    ).toHaveLength(3);

    await userEvent.click(d.getByRole("button", { name: "Versionsverlauf" }));
    await expect(await d.findByRole("heading", { level: 2, name: "Versionsverlauf" })).toBeVisible();
    await expect(d.queryByRole("button", { name: "Speichern" })).toBeNull();

    await userEvent.click(d.getByRole("button", { name: "Berechtigungen" }));
    await expect(await d.findByRole("table", { name: "Rechte je Rolle" })).toBeVisible();
  },
};

/**
 * **The admin console** — „Admin-Einstellungen" (JustRAG `AdminUI.tsx`): a
 * large `SettingsDialog` whose thirteen sections stand in four groups —
 * Konfiguration, Themen, Nutzer, Monitoring. „Suchanbieter" shows a section's
 * content as JustRAG builds it: two `PanelSection`s of `SettingsRow`s.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the window is a dialog named „Admin-Einstellungen" [ARIA];
 * 2. the column has the four groups, in order [ARIA `group` names];
 * 3. „Suchanbieter" shows „Web-Suche" and „Akademische Recherche" as named
 *    regions [ARIA `region`];
 * 4. a search for „Google" keeps that row and its section's title, and hides
 *    the section without a match [visibility; ARIA].
 */
export const AdminSettings: Story = {
  render: () => (
    <div className="p-6">
      <AdminSettingsDialog />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: `${ADMIN_SETTINGS_TITLE} öffnen` }));
    const dialog = within(await page(canvasElement).findByRole("dialog", { name: ADMIN_SETTINGS_TITLE }));
    await expect(dialog.getAllByRole("group")).toHaveLength(4);
    for (const name of ["Konfiguration", "Themen", "Nutzer", "Monitoring"]) {
      await expect(dialog.getByRole("group", { name })).toBeVisible();
    }

    await userEvent.click(dialog.getByRole("button", { name: "Suchanbieter" }));
    await expect(await dialog.findByRole("region", { name: "Web-Suche" })).toBeVisible();
    await expect(dialog.getByRole("region", { name: "Akademische Recherche" })).toBeVisible();

    await userEvent.type(dialog.getByRole("searchbox"), "Google");
    await waitFor(() => expect(dialog.getByText("Google Search API-Schlüssel")).toBeVisible());
    await expect(dialog.getByRole("heading", { name: "Web-Suche" })).toBeVisible();
    // …and the search filters: the section without a match is gone.
    await waitFor(() => expect(dialog.queryByRole("region", { name: "Akademische Recherche" })).toBeNull());
  },
};
