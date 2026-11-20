import type { Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { composeStories } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ChevronLeft, ChevronRight, LayoutGrid, Menu, SlidersHorizontal } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../components/alert";
import { AppShellSidePanel } from "../components/app-shell";
import { Button } from "../components/button";
import { ChatStage } from "../components/chat-stage";
import { Logo } from "../components/logo";
import { SIDE_PANEL_RAIL_WIDTH } from "../components/side-panel-variants";
import {
  AppShellFixture,
  NO_HISTORY,
  ShellSearch,
  SOURCES_LOCKED_LABEL,
  SOURCES_LOCKED_REASON,
  WORKSPACE_SECTION,
  WORKSPACE_TITLE,
} from "../test/fixtures/app-shell";
import * as chatStageStories from "../components/chat-stage.stories";
import * as dashboardStories from "./dashboard-layout.stories";
import * as formStories from "./form-layout.stories";
import * as tableStories from "./table-layout.stories";
import { MeinWissen } from "../test/fixtures/mein-wissen";
import {
  CHAT_FOOTER,
  FIRST_SOURCE_TITLE,
  TOPIC_NAME,
  TopicConversation,
  TopicNew,
  TopicStart,
} from "../test/fixtures/topic-chat";

/* ---------------------------------------------------------------------------
 * One shell, adapted per context. Every story below renders the
 * shared `AppShellFixture` (`src/test/fixtures/app-shell.tsx`) in one of the
 * two contexts of the reference consumer — `overview` (JLURAG `AppChrome.tsx`)
 * or `workspace` (JLURAG `KbWorkspaceLayout.tsx`). The overview's page is
 * JLURAG's „Mein Wissen" (`GridLayout`, the `mein-wissen` fixture), which renders
 * its title itself — the reason `pageLabel` is optional: with a label, „Mein
 * Wissen" would stand twice. The mechanism stories fill the
 * central `search`, the bar's mechanism other apps use; the page stories do
 * not, as JLURAG does not: its overview has no bar, and its workspace bar no
 * search („Suchen" is in the history column). The first five stories are one per PAGE CONTEXT; the rest
 * are the mechanism regressions (centring, empty bar, short bar, inset,
 * collapse, rail positions, resize, handle), on the same fixture instead of a
 * hand-built shell of their own.
 *
 * No story mounts a theme toggle: colour scheme, contrast, accent and Style
 * live behind the user menu's „Einstellungen" (`SettingsDialog` +
 * `AppearanceSettings`), which `SettingsFromUserMenu` walks through.
 * ------------------------------------------------------------------------- */

// Portable Stories: page content is the content templates' own stories —
// templates compose into each other, nothing is mocked again.
const { Standard: DashboardPage } = composeStories(dashboardStories, {});
const { Admin: TablePageContent } = composeStories(tableStories, {});
const { Settings: FormPageContent } = composeStories(formStories, {});

/**
 * The chat column of the workspace: `ChatStage` with the args of its own
 * `Conversation` story. Spread rather than `composeStories`, on purpose — that
 * story's meta decorator pins the stage to a 560px box for its own canvas,
 * and in the shell the stage has to fill `<main>` instead.
 */
function ChatPage() {
  return <ChatStage {...chatStageStories.default.args} {...chatStageStories.Conversation.args} />;
}

/** The workspace search's accessible name (the field is scoped to the topic). */
const WORKSPACE_SEARCH = "Im Thema suchen";

const meta = {
  title: "Templates/AppShellLayout",
  component: AppShellLayout,
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    // Every story renders the fixture, whose context owns the slots and the
    // column state — a control here would edit nothing on the canvas. The
    // MDX shows the props as a table (`ArgTypes`) instead.
    controls: { disable: true },
  },
  // Required props only, so the typed stories need none of their own. The
  // stories do not read them (see above); these are the overview context's
  // values, for the record.
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
 * Die Chrome-Zeile selbst: das `banner`-Landmark der Shell. Über die Rolle
 * gesucht und nicht über eine Klasse — `h-14` ist genau die Behauptung, die
 * hier geprüft wird, und ein Selektor `.h-14` wäre auch dann grün, wenn das
 * Utility zu nichts kompilierte.
 */
const bar = (canvasElement: HTMLElement) =>
  canvasElement.querySelector("header") as HTMLElement;

/**
 * **56px, in jeder Kombination** (nur Label / nur Suche / nur Aktionen /
 * alles / nichts). Die Zahl ist kein aus diesem Code abgelesenes Maß, sondern
 * der veröffentlichte Geometrie-Vertrag dieser Zeile: JustRAG positioniert
 * seine Toasts mit `top: 68px` = 56 + 12 darunter und misst dieselbe 56 in
 * einem eigenen Chromium-Test (`AppShellGeometry` in HomeView.stories.tsx).
 */
async function expectBarHeight(canvasElement: HTMLElement) {
  await expect(getComputedStyle(bar(canvasElement)).height).toBe("56px");
}

/**
 * The boxes of the workspace bar's four controls — the breadcrumb's section
 * link, the topic title, the search field, the gear — plus the two boxes that
 * can clip them: the bar's row and the label's `<div>` (`truncate` =
 * `overflow: hidden`, so whatever sticks out of it is cut off, not shown).
 */
function measureWorkspaceBar(canvasElement: HTMLElement) {
  const header = bar(canvasElement);
  const q = within(header);
  const titleEl = q.getByText(WORKSPACE_TITLE);
  return {
    row: header.getBoundingClientRect(),
    label: (titleEl.closest("[data-slot='app-shell-page-label']") as HTMLElement).getBoundingClientRect(),
    section: q.getByRole("link", { name: WORKSPACE_SECTION }).getBoundingClientRect(),
    title: titleEl.getBoundingClientRect(),
    field: q.getByRole("searchbox", { name: WORKSPACE_SEARCH }).getBoundingClientRect(),
    gear: q.getByRole("button", { name: "Einstellungen des Themas" }).getBoundingClientRect(),
  };
}
type WorkspaceBarBoxes = ReturnType<typeof measureWorkspaceBar>;

/** Sub-pixel slack for "touches but does not overlap". */
const EDGE_SLACK = 0.5;

/**
 * Nothing overlaps and nothing is clipped. Oracle: the layout engine's boxes
 * against each other — the four controls read left to right with no box
 * reaching into the next, the section link and the title lie inside the
 * label's clip box, and the gear inside the bar. No number from the
 * component's code enters.
 */
async function expectNoOverlap(g: WorkspaceBarBoxes) {
  const sequence = [g.section, g.title, g.field, g.gear];
  for (let i = 0; i + 1 < sequence.length; i++) {
    await expect(sequence[i].right).toBeLessThanOrEqual(sequence[i + 1].left + EDGE_SLACK);
  }
  await expect(g.section.left).toBeGreaterThanOrEqual(g.label.left - EDGE_SLACK);
  await expect(g.section.right).toBeLessThanOrEqual(g.label.right + EDGE_SLACK);
  await expect(g.title.right).toBeLessThanOrEqual(g.label.right + EDGE_SLACK);
  await expect(g.gear.right).toBeLessThanOrEqual(g.row.right + EDGE_SLACK);
}

/** The field's centre is the bar's centre, within 1px. Oracle: the bar's own box. */
async function expectCentred(g: WorkspaceBarBoxes) {
  const fieldCentre = (g.field.left + g.field.right) / 2;
  const barCentre = (g.row.left + g.row.right) / 2;
  await expect(Math.abs(fieldCentre - barCentre)).toBeLessThanOrEqual(1);
}

/** Portalled layers (menu, dialog) render into `<body>`, outside the canvas. */
const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/* ======================================================================== */
/* One story per page context                                               */
/* ======================================================================== */

/**
 * **The overview context** — JLURAG's „Mein Wissen" as `development` renders
 * it (`AppChrome.tsx`, screenshots of 20.11.2026): no chrome bar
 * (`bar={false}`); the brand, the NavItem rows — „Suchen" (the search palette
 * in the app), „Mein Wissen", „Geteiltes Wissen", „Entdecken" — in a
 * `SidebarPanel`, the user menu pinned to the column's foot. The page is
 * `GridLayout` with the topic cards, and it renders the page's `<h1>` itself.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. no chrome bar: the page starts at the frame's top [the DOM; the boxes];
 * 2. the column stands left of `<main>` [the layout engine's boxes];
 * 3. the navigation's rows in JLURAG's order, „Mein Wissen" current
 *    [ARIA `navigation`, `button` names, `aria-current`];
 * 4. the page is the region „Mein Wissen" with the only `<h1>`, inside
 *    `<main>` [ARIA `region`, `heading`].
 *
 * Nothing here opens or moves: this is the template's showcase, and a `play`
 * function runs on the visible page each time the story opens. The settings
 * route through the user menu is `SettingsFromUserMenu`.
 */
export const Overview: Story = {
  render: () => (
    <AppShellFixture context="overview" search={null} bar={false}>
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(
      canvasElement.querySelector("[data-slot='app-shell-content'] > header"),
    ).toBeNull();
    const main = canvas.getByRole("main");
    const column = await canvas.findByRole("complementary", { name: "Hauptnavigation" });
    await expect(main.getBoundingClientRect().top).toBeCloseTo(column.getBoundingClientRect().top, 0);
    await expect(column.getBoundingClientRect().right).toBeLessThanOrEqual(
      main.getBoundingClientRect().left + 1,
    );

    const nav = within(canvas.getByRole("navigation", { name: "Hauptnavigation" }));
    await expect(nav.getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual([
      "Suchen",
      "Mein Wissen",
      "Geteiltes Wissen",
      "Entdecken",
    ]);
    await expect(nav.getByRole("button", { name: "Mein Wissen" })).toHaveAttribute("aria-current");

    const region = within(main).getByRole("region", { name: "Mein Wissen" });
    await expect(within(region).getByRole("heading", { level: 1, name: "Mein Wissen" })).toBeVisible();
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  },
};

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
export const SettingsFromUserMenu: Story = {
  render: () => (
    <AppShellFixture context="overview" search={null} bar={false}>
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Jamie Lee/ }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Einstellungen" }));
    const dialog = await body.findByRole("dialog", { name: "Einstellungen" });
    await expect(
      within(dialog).getByRole("heading", { level: 2, name: "Darstellung" }),
    ).toBeVisible();
    await expect(within(dialog).getByRole("combobox", { name: "Farbschema" })).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "Schließen" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/**
 * **The workspace context** — a topic in JLURAG (`KbWorkspaceLayout.tsx`,
 * `ChatView.tsx`; `development`, screenshots of 20.11.2026):
 * - the bar: the breadcrumb „Mein Wissen / ‹topic›" as `pageLabel`, a ghost
 *   gear in `headerActions` — **no search field**: the topic's search is
 *   „Suchen" in the history column, which opens a palette in the app;
 * - the history as the left column: „Neuer Chat" and „Suchen" in the
 *   panel's head, then „Verlauf", the chats grouped by day;
 * - the sources as `rightPanel` — a floating card since 0.81.0 — titled
 *   „Quellen hinzufügen" in its header row beside its close button
 *   (`header`, `closeLabel`), the four ways to add a source, the sources;
 * - a chat as the page: `ChatStage` with two turns (`MessageScroller`,
 *   `Message`, `ChainOfThought`, `Sources`) over the composer and the
 *   answer disclaimer (`topic-chat` fixture).
 *
 * Only the history column is resizable; the card has no handle. The bar's
 * search, which other apps put there, is pinned by the mechanism stories
 * below (`NarrowBarKeepsTheLabel` …).
 *
 * `play` (Chromium, the runner's 1280px window, the history column and the
 * card at their 320px default), oracles in brackets:
 * 1. the bar is 56px [the published contract, as above];
 * 2. history | main, left to right, the sources card inside main's box
 *    [the layout boxes];
 * 3. the history column has its named separator, the card none
 *    [ARIA `separator` + name];
 * 4. the bar holds no search field; section link, topic title and gear read
 *    left to right without overlapping, the gear clear of the card's toggle
 *    [ARIA `searchbox`; the boxes];
 * 5. the label is a `<div>`, not a `<p>`: a node label may hold the
 *    breadcrumb's `nav`, which a `<p>` may not [the DOM];
 * 6. the history's head is „Neuer Chat", then „Suchen" (a dialog opener),
 *    and the chats are grouped under the days „Heute" and „Gestern"
 *    [ARIA `button` names in DOM order, `aria-haspopup`, `heading` level 3];
 * 7. the card is titled „Quellen hinzufügen", closes with its own button and
 *    offers the four kinds of source [ARIA `heading`, `button` names];
 * 8. the page is the chat: the composer, the answer with its one cited
 *    source, the disclaimer [ARIA `textbox`, `button` names; text].
 */
export const ChatWorkspace: Story = {
  render: () => (
    <AppShellFixture context="workspace" search={null} topic={TOPIC_NAME}>
      <TopicConversation />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);

    const historyColumn = await canvas.findByRole("complementary", { name: "Verlauf" });
    const sourcesCard = await canvas.findByRole("complementary", { name: "Quellen" });
    const history = historyColumn.getBoundingClientRect();
    const sources = sourcesCard.getBoundingClientRect();
    const main = canvasElement.querySelector("main")!.getBoundingClientRect();
    await expect(history.right).toBeLessThanOrEqual(main.left + 1);
    // The sources float over the page as a card: inside the main area's
    // box, at its end edge, not beside it.
    await expect(sources.left).toBeGreaterThan(main.left);
    await expect(sources.right).toBeLessThanOrEqual(main.right);
    await expect(sources.top).toBeGreaterThanOrEqual(main.top);

    await expect(
      await canvas.findByRole("separator", { name: "Breite des Verlaufs ändern" }),
    ).toBeInTheDocument();
    await expect(canvas.queryByRole("separator", { name: "Breite der Quellen ändern" })).toBeNull();

    const header = bar(canvasElement);
    const q = within(header);
    await expect(q.queryByRole("searchbox")).toBeNull();
    const section = q.getByRole("link", { name: WORKSPACE_SECTION }).getBoundingClientRect();
    const title = q.getByText(TOPIC_NAME).getBoundingClientRect();
    const gear = q.getByRole("button", { name: "Einstellungen des Themas" }).getBoundingClientRect();
    await expect(section.right).toBeLessThanOrEqual(title.left + EDGE_SLACK);
    await expect(title.right).toBeLessThanOrEqual(gear.left + EDGE_SLACK);

    const label = header.querySelector<HTMLElement>("[data-slot='app-shell-page-label']")!;
    await expect(label.tagName).toBe("DIV");
    await expect(
      within(label).getByRole("navigation", { name: "Navigationspfad" }),
    ).toBeVisible();

    const toggle = q.getByRole("button", { name: "Quellen einklappen" });
    await expect(gear.right).toBeLessThanOrEqual(toggle.getBoundingClientRect().left + EDGE_SLACK);

    const inHistory = within(historyColumn);
    const newChat = inHistory.getByRole("button", { name: "Neuer Chat" });
    const search = inHistory.getByRole("button", { name: "Suchen" });
    await expect(search).toHaveAttribute("aria-haspopup", "dialog");
    await expect(
      newChat.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(
      inHistory.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual(["Heute", "Gestern"]);

    const card = within(sourcesCard);
    await expect(card.getByRole("heading", { name: "Quellen hinzufügen" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Quellen schließen" })).toBeVisible();
    for (const kind of ["Crawl", "RSS", "Datei hochladen", "Text einfügen"]) {
      await expect(card.getByRole("button", { name: kind })).toBeVisible();
    }

    const page = within(canvasElement.querySelector("main")!);
    await expect(page.getByRole("textbox", { name: "Nachricht" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Quellen · 1/ })).toBeInTheDocument();
    await expect(page.getByText(CHAT_FOOTER)).toBeVisible();
  },
};

/**
 * An empty `ChatStage` centres its content and composer together between its
 * top and the pinned disclaimer: the gap above the `<h1>` equals the gap
 * between the composer's block and the disclaimer, within 1px. Oracle: the
 * layout engine's boxes, nothing from the component's code.
 */
async function expectCentredStart(main: HTMLElement) {
  const stage = main.querySelector<HTMLElement>("[data-slot='chat-stage']")!;
  await expect(stage).toHaveAttribute("data-empty");
  const top = stage.getBoundingClientRect().top;
  const heading = main.querySelector("h1")!.getBoundingClientRect();
  const composer = stage.querySelector("[data-slot='chat-stage-composer']")!.getBoundingClientRect();
  const footer = stage.querySelector("[data-slot='chat-stage-footer']")!.getBoundingClientRect();
  const above = heading.top - top;
  await expect(above).toBeGreaterThan(0);
  await expect(Math.abs(above - (footer.top - composer.bottom))).toBeLessThanOrEqual(1);
}

/**
 * **A new chat in a topic** — the topic's start page as JLURAG renders it
 * once it has sources: the topic's name, the model, „1 Dokument · Stand …",
 * the description, then the composer and the suggested questions, centred
 * in the column (`ChatStage empty`). JLURAG's own start-page parts (title
 * card, glow) are left out; the fixture builds the page from DS parts.
 *
 * `play` oracles: the topic's name is the page's only `<h1>`, above the
 * composer, and the suggestions follow [ARIA `heading`, `textbox`; the
 * boxes; text]; the stage is in its empty state and the block — name to
 * suggestions — sits in the middle: the gap above the name equals the gap
 * between the composer's block and the disclaimer, within 1px
 * (`expectCentredStart`) [`data-empty`; the boxes].
 */
export const ChatWorkspaceStart: Story = {
  render: () => (
    <AppShellFixture context="workspace" search={null} topic={TOPIC_NAME}>
      <TopicStart />
    </AppShellFixture>
  ),
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector("main")!;
    const page = within(main);
    const headings = page.getAllByRole("heading", { level: 1 });
    await expect(headings.map((h) => h.textContent)).toEqual([TOPIC_NAME]);
    const name = headings[0].getBoundingClientRect();
    const field = page.getByRole("textbox", { name: "Nachricht" }).getBoundingClientRect();
    await expect(name.bottom).toBeLessThanOrEqual(field.top);
    await expect(page.getByText("Vorschläge")).toBeInTheDocument();

    await expectCentredStart(main);
  },
};

/**
 * **A new topic, no sources yet** — JLURAG after „Neues Thema": „Füge deine
 * erste Quelle hinzu" in the middle over the composer, „Noch kein Verlauf
 * vorhanden." in the history, and the sources card's list is a
 * `FileDropzone` (`emptyTopic`). The card stays open: adding the first
 * source is the one thing to do.
 *
 * `play` oracles [ARIA `heading`, `button`; text; the boxes]: the call is the
 * page's `<h1>`, centred with the composer as in `ChatWorkspaceStart`; the
 * history has no chat and says so; the card offers the dropzone (a button
 * that opens the file picker) and lists no source.
 */
export const ChatWorkspaceEmpty: Story = {
  render: () => (
    <AppShellFixture context="workspace" search={null} topic={TOPIC_NAME} emptyTopic>
      <TopicNew />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    const main = canvasElement.querySelector("main")!;
    const page = within(main);
    await expect(page.getByRole("heading", { level: 1, name: FIRST_SOURCE_TITLE })).toBeVisible();
    await expectCentredStart(main);

    const history = within(await canvas.findByRole("complementary", { name: "Verlauf" }));
    await expect(history.getByText(NO_HISTORY)).toBeVisible();
    await expect(history.queryByRole("button", { name: "Chat-Aktionen" })).toBeNull();

    const card = within(await canvas.findByRole("complementary", { name: "Quellen" }));
    // „Datei hochladen" twice: the button among the kinds, and the dropzone
    // itself, which opens the same file picker.
    await expect(card.getAllByRole("button", { name: "Datei hochladen" })).toHaveLength(2);
    await expect(card.getByText("Dateien hierher ziehen")).toBeVisible();
    await expect(card.queryByRole("button", { name: "Quellen-Aktionen" })).toBeNull();
  },
};

/**
 * **A table page in the overview shell** — `TableLayout` (its `Admin` story)
 * as `children`. The shell brings the chrome and the one `<main>`; the
 * content template brings the page's heading.
 *
 * `play` oracle: the ARIA tree — exactly one `main`, the table inside it, and
 * the content template's `<h1>` as the page's only level-1 heading (the
 * shell contributes none; `pageLabel` would be a `<p>`).
 */
export const TablePage: Story = {
  render: () => (
    <AppShellFixture context="overview" search={<ShellSearch />}>
      <TablePageContent />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const mains = canvas.getAllByRole("main");
    await expect(mains).toHaveLength(1);
    await expect(within(mains[0]).getByRole("table")).toBeVisible();
    await expect(
      within(mains[0]).getByRole("heading", { level: 1, name: "Elemente" }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  },
};

/**
 * **A form page in the overview shell** — `FormLayout` (its `Settings` story)
 * as `children`. Same composition rule and the same oracle as `TablePage`:
 * one `main`, the form's submit button inside it, one `<h1>` — the form's.
 */
export const FormPage: Story = {
  render: () => (
    <AppShellFixture context="overview" search={<ShellSearch />}>
      <FormPageContent />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const mains = canvas.getAllByRole("main");
    await expect(mains).toHaveLength(1);
    await expect(within(mains[0]).getByRole("button", { name: "Speichern" })).toBeVisible();
    await expect(
      within(mains[0]).getByRole("heading", { level: 1, name: "Element-Einstellungen" }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  },
};

/**
 * Die Anordnung unter `lg`, hier im Workspace-Kontext mit seinen drei
 * Reitern (Verlauf · Chat · Quellen): Top-Bar mit der Marke und den
 * `headerActions` (das Zahnrad bleibt erreichbar), **ein** Bereich,
 * `BottomTabBar`. Kein Burger-Button, kein Drawer, kein Dialog. `search`
 * ist übergeben wie überall — das Template rendert es unter `lg` bewusst
 * nicht (ein auf `max-w-md` gedeckeltes, zentriertes Feld hat in 390px keine
 * Mitte).
 *
 * **Ohne `play`-Assertions, mit Absicht** — die Anordnung hängt am echten
 * Viewport (`matchMedia`), und der Storybook-Vitest-Lauf rendert Stories in
 * einem 1280px-Fenster, nicht im hier eingestellten Story-Viewport. Geprüft
 * ist sie in `app-shell-layout.test.tsx` (jsdom, gestubbter Viewport).
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "phone" } },
  render: () => (
    <AppShellFixture context="workspace" search={<ShellSearch label={WORKSPACE_SEARCH} />}>
      <ChatPage />
    </AppShellFixture>
  ),
};

/* ======================================================================== */
/* Mechanism regressions, on the same fixture                               */
/* ======================================================================== */

/**
 * A second, narrower control for the right-hand region of an overview bar —
 * the overview context has none of its own (JLURAG's `AppChrome` passes no
 * `headerActions`). An icon button, so the two side regions hold content of
 * clearly different widths.
 */
const viewOptions = (
  <Button variant="ghost" size="icon" aria-label="Ansicht anpassen">
    <SlidersHorizontal size={20} aria-hidden="true" />
  </Button>
);

/**
 * **`search` is the centre of the bar**: the centre of the *bar*, not of
 * the space the label leaves, so the field does not move when a label
 * appears or changes length.
 *
 * The `play` function measures it in Chromium: field centre = bar centre,
 * although the label on the left and the icon button on the right differ in
 * width. The check requires that difference, so the story cannot pass on two
 * equal sides. The centring rests on the two equal-width side regions, not
 * on the bar's inset (`BarInsetIsTheColumnGutter`). The release measurement
 * is in the Changelog, 0.30.0.
 */
export const WithCenteredSearch: Story = {
  render: () => (
    <AppShellFixture
      context="overview"
      pageLabel="Dashboard"
      search={<ShellSearch />}
      headerActions={viewOptions}
    >
      <DashboardPage />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);

    // Orakel: die Symmetrie der Zeile, gerechnet aus den Boxen der
    // Layout-Engine. In jsdom wäre dieselbe Prüfung wertlos (kein Stylesheet,
    // alle Boxen 0×0), deshalb steht sie hier.
    // A string label is a `<p>` — words, not a node (`ChatWorkspace` pins the
    // `<div>` a node gets).
    const labelEl = await canvas.findByText("Dashboard");
    await expect(labelEl.tagName).toBe("P");
    await expect(labelEl).toHaveAttribute("data-slot", "app-shell-page-label");

    const row = bar(canvasElement).getBoundingClientRect();
    const label = labelEl.getBoundingClientRect();
    const action = (
      await canvas.findByRole("button", { name: "Ansicht anpassen" })
    ).getBoundingClientRect();
    const field = (
      await canvas.findByRole("searchbox", { name: "Suchen" })
    ).getBoundingClientRect();

    await expect((field.left + field.right) / 2).toBeCloseTo((row.left + row.right) / 2, 0);
    // …und das ist nicht trivial: links und rechts vom Feld steht
    // unterschiedlich viel. Ohne die beiden gleich breiten Randregionen wäre
    // die Mitte um die halbe Differenz verschoben.
    await expect(Math.abs(label.width - action.width)).toBeGreaterThan(1);
    // Das Feld füllt die Zeile nicht aus (dann wäre die Mitte trivial gleich):
    // `max-w-md` deckelt es, links und rechts bleibt Luft.
    await expect(field.left).toBeGreaterThan(label.right);
    await expect(field.right).toBeLessThan(action.left);
  },
};

/**
 * **The search without a label**: an overview with a bar and no `pageLabel`
 * — the content template renders the page's title — keeps the field on the
 * bar's centre, and the bar renders no label element at all.
 *
 * `play` (Chromium), oracles in brackets: the field's centre is the bar's
 * centre, and the field lies inside the bar [the bar's own box]; there is no
 * label element [the DOM].
 */
export const SearchWithoutLabel: Story = {
  render: () => (
    <AppShellFixture context="overview" search={<ShellSearch />}>
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const row = bar(canvasElement).getBoundingClientRect();
    const field = (await canvas.findByRole("searchbox", { name: "Suchen" })).getBoundingClientRect();
    await expect((field.left + field.right) / 2).toBeCloseTo((row.left + row.right) / 2, 0);
    await expect(field.left).toBeGreaterThan(row.left);
    await expect(field.right).toBeLessThan(row.right);
    await expect(bar(canvasElement).querySelector("[data-slot='app-shell-page-label']")).toBeNull();
  },
};

/**
 * Weder Label noch Suche noch Aktionen — die leere Zeile. Sie bleibt trotzdem
 * **56px hoch**: Consumer legen Overlays unter dieser Kante ab (JustRAGs
 * `Toast.css`: `top: 68px` = 56 + 12), und eine Zeile, die beim Weglassen der
 * letzten Prop zusammenfiele, wäre für eine unveränderte Aufrufstelle eine
 * brechende Geometrie-Änderung.
 *
 * **The one story that opts out of the search convention**, and it says so:
 * `null` as its search. `search` stays optional on the component, and what an app
 * gets when it omits every slot is exactly the contract this story pins.
 */
export const WithoutPageLabelOrActions: Story = {
  render: () => (
    <AppShellFixture context="overview" search={null}>
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvasElement }) => {
    await expectBarHeight(canvasElement);
    // Leer heißt leer: die Zeile trägt keinen Text und keinen Absatz.
    await expect(bar(canvasElement).textContent).toBe("");
    await expect(bar(canvasElement).querySelector("[data-slot='app-shell-page-label']")).toBeNull();
  },
};

/**
 * **`bar={false}`: a view with no chrome bar** (0.80.0) — the overview as
 * JLURAG's `AppChrome.tsx` renders it on `development`: navigation and search
 * live in the left column, and the page brings its own heading. Unlike the
 * empty bar above, nothing is reserved: the page starts at the top of the
 * frame.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the shell renders no bar and no empty title-bar row [the DOM];
 * 2. `<main>` starts at the frame's top edge, level with the column
 *    [the layout boxes];
 * 3. the column stands left of `<main>`, and its own header row with the
 *    collapse toggle is still there [the boxes; ARIA `button` + name].
 */
export const WithoutChromeBar: Story = {
  render: () => (
    <AppShellFixture context="overview" search={null} bar={false}>
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    // The shell's bar is the content region's own `header`; the page below
    // brings a `header` of its own (`PageHeader`), which is not the shell's.
    await expect(
      canvasElement.querySelector("[data-slot='app-shell-content'] > header"),
    ).toBeNull();
    await expect(canvasElement.querySelector("[data-slot='app-shell-titlebar']")).toBeNull();

    const frame = canvasElement.querySelector("[data-slot='app-shell-row']")!.parentElement!;
    const main = canvas.getByRole("main").getBoundingClientRect();
    const column = canvas
      .getByRole("complementary", { name: "Hauptnavigation" })
      .getBoundingClientRect();
    await expect(main.top).toBeCloseTo(frame.getBoundingClientRect().top, 0);
    await expect(main.top).toBeCloseTo(column.top, 0);
    await expect(column.right).toBeLessThanOrEqual(main.left + 1);
    await expect(canvas.getByRole("button", { name: "Navigation einklappen" })).toBeVisible();
  },
};

/* ------------------------------------------------------------------------ */
/* Short bar: the search gives way before the side regions                 */
/* ------------------------------------------------------------------------ */

/**
 * The history column at the measured 320px (also the workspace default). The
 * sources card gets the same width, but it floats and takes none from the bar.
 */
const COLUMN_WIDTH = 320;

/**
 * **The narrow bar keeps its label.** The reproduction of
 * JustRAG's measured case (KI-838, `KbWorkspaceLayout ›
 * WorkspaceBarWithScopedSearch`, Chromium, the history column open at
 * 320px): a **560px** bar holding the breadcrumb „Mein Wissen / ‹topic›", a
 * search field and a gear — the workspace context's own bar. The shell is
 * fixed at 880px (= 560 + 320; the sources card takes no width) and the width
 * is pinned, so the bar is 560 whatever the Storybook viewport — only the
 * bar's own width enters its flex computation. (The history column carries a
 * resize handle; a handle has no layout width, see `HandleHasNoLayoutWidth`.)
 * The failure this pins is in the Changelog, 0.44.1.
 *
 * The search shrinks first, down to its floor of 8rem, while each side region
 * keeps its own floor of 11rem. Asserted in Chromium, the rem read back from
 * the CSSOM:
 *
 * 1. the label's region keeps **at least 11rem**, the section link is shown
 *    whole, and the title is what gives way — clipped, not wrapped;
 * 2. nothing overlaps and nothing is clipped (`expectNoOverlap`);
 * 3. the field's centre is the bar's centre **within 1px**;
 * 4. the bar is 56px.
 *
 * Preconditions are asserted too, so the story cannot pass by measuring a
 * different case: the bar IS 560px and the search IS at its floor. (Until the
 * breadcrumb, the label was a 36px back button + title, and the card's
 * acceptance number was a 120px title; the section link is wider, so the
 * floor of the region is the oracle now.)
 */
export const NarrowBarKeepsTheLabel: Story = {
  render: () => (
    <AppShellFixture
      context="workspace"
      search={<ShellSearch label={WORKSPACE_SEARCH} />}
      leftWidth={COLUMN_WIDTH}
      rightWidth={COLUMN_WIDTH}
      style={{ width: 560 + COLUMN_WIDTH }}
    >
      <ChatPage />
    </AppShellFixture>
  ),
  play: async ({ canvasElement }) => {
    await expectBarHeight(canvasElement);
    const g = measureWorkspaceBar(canvasElement);
    await expect(g.row.width).toBe(560);
    // The search is at its floor here — the case this story is about.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(g.field.width).toBe(8 * rem);

    // The label's region holds its floor of 11rem, and the section link is
    // shown whole: the title is what gives way.
    await expect(g.label.width).toBeGreaterThanOrEqual(11 * rem);
    await expect(g.section.right).toBeLessThan(g.title.left);
    await expect(g.title.width).toBeGreaterThan(0);
    // …and `truncate` still does its job: the title is clipped, not wrapped
    // and not pushing anything aside.
    const titleEl = within(bar(canvasElement)).getByText(WORKSPACE_TITLE);
    await expect(titleEl.scrollWidth).toBeGreaterThan(titleEl.clientWidth);
    await expectNoOverlap(g);
    await expectCentred(g);
  },
};

/**
 * **The wide bar keeps the search at its maximum**: with room to spare it is
 * still capped at **28rem** and centred on the bar, and the side regions share
 * the rest equally. The shell is fixed at 1280px with the left column at
 * 256px and the sources card out of the desktop arrangement
 * (`showRight={false}`), so the bar is 1024px.
 *
 * Oracle for the width: 28 × the root font size read back from the CSSOM —
 * the documented `max-w-md` contract of `search`, not a class name or a
 * number read out of the component.
 */
export const WideBarKeepsTheSearchAtItsMaximum: Story = {
  render: () => (
    <AppShellFixture
      context="workspace"
      search={<ShellSearch label={WORKSPACE_SEARCH} />}
      leftWidth={256}
      showRight={false}
      style={{ width: 1280 }}
    >
      <ChatPage />
    </AppShellFixture>
  ),
  play: async ({ canvasElement }) => {
    await expectBarHeight(canvasElement);
    const g = measureWorkspaceBar(canvasElement);
    await expect(g.row.width).toBe(1024);

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(g.field.width).toBe(28 * rem);
    await expectCentred(g);
    await expectNoOverlap(g);
    // Room to spare really is spare: the field does not touch its neighbours.
    await expect(g.field.left).toBeGreaterThan(g.title.right);
    await expect(g.field.right).toBeLessThan(g.gear.left);
  },
};

/**
 * **The order in which the bar gives way**, measured in one shell
 * narrowed step by step — the history column at 320px (the sources card
 * takes no width), the bar at 1024, 900, 800, 560, 480 and 300px:
 *
 * - **At every step** the field is centred on the bar within 1px and the bar
 *   is 56px; down to 480px nothing overlaps, and at 300px, where a side
 *   region is narrower than the breadcrumb's section link, the label's clip
 *   box still keeps clear of the search. That is the centring rule: the two side
 *   regions are identical flex items in every state, so the search sits on
 *   the bar's exact centre down to the width where the side regions reach
 *   0 — a bar of 208px (search floor 128 + 2 × 16px gap + 2 × 24px inset),
 *   which two open columns on an `lg` window do not reach. That last range is
 *   not asserted.
 * - **1024 → 900: spare room goes first.** The field stays at its cap, and
 *   the title loses half of the 124px, 62px — the other half comes off the
 *   gear's side.
 * - **800 → 560: then the search.** The bar loses 240px, the field loses
 *   exactly those 240px, and the title does not lose a pixel.
 * - **560 → 480: only then the sides.** The field holds its floor, and the
 *   title loses half of the 80px the bar lost: 40px.
 *
 * The oracles are relational — widths at one step against widths at another,
 * all from Chromium's layout — so they pin the ORDER rather than restating
 * the component's constants. The bar width is set on the shell's own box
 * between measurements; React does not re-render, the layout engine re-flows.
 */
export const BarGivesWayInOrder: Story = {
  render: () => (
    <AppShellFixture
      context="workspace"
      id="shrink-order-shell"
      search={<ShellSearch label={WORKSPACE_SEARCH} />}
      leftWidth={COLUMN_WIDTH}
      rightWidth={COLUMN_WIDTH}
    >
      <ChatPage />
    </AppShellFixture>
  ),
  play: async ({ canvasElement }) => {
    const shell = document.getElementById("shrink-order-shell") as HTMLElement;
    const at = async (barWidth: number) => {
      shell.style.width = `${barWidth + COLUMN_WIDTH}px`;
      const g = measureWorkspaceBar(canvasElement);
      await expect(g.row.width).toBe(barWidth);
      await expectBarHeight(canvasElement);
      await expectCentred(g);
      return g;
    };

    const w1024 = await at(1024);
    const w900 = await at(900);
    const w800 = await at(800);
    const w560 = await at(560);
    const w480 = await at(480);
    for (const g of [w1024, w900, w800, w560, w480]) await expectNoOverlap(g);
    // At 300px a side region is narrower than the section link, which never
    // truncates (as in JLURAG): the label's clip box cuts the breadcrumb off.
    // What must still hold is that the clip box keeps clear of the search.
    const w300 = await at(300);
    await expect(w300.label.right).toBeLessThanOrEqual(w300.field.left + EDGE_SLACK);
    await expect(w300.gear.right).toBeLessThanOrEqual(w300.row.right + EDGE_SLACK);

    // 1024 → 900: the field is at its cap, the side regions give the 124px.
    await expect(w900.field.width).toBeCloseTo(w1024.field.width, 1);
    await expect(w1024.title.width - w900.title.width).toBeCloseTo(62, 1);
    // 800 → 560: the search absorbs the whole 240px, the title none of it.
    await expect(w800.field.width - w560.field.width).toBeCloseTo(240, 1);
    await expect(w560.title.width).toBeCloseTo(w800.title.width, 1);
    // 560 → 480: the search holds, the two sides split the 80px.
    await expect(w480.field.width).toBeCloseTo(w560.field.width, 1);
    await expect(w560.title.width - w480.title.width).toBeCloseTo(40, 1);
  },
};

/**
 * **The bar takes the column gutter**, not the page measure of a
 * `Container`: the bar is not a page-content column but chrome between two
 * `SidePanel`s. (The measurement that led here: Changelog, 0.37.0.)
 *
 * **It is the bar's own measure.** A `SidePanel`'s `h-14` header row is
 * `px-4` (16px), because its toggle sits on the first control of the
 * **column body**, not on this bar. The two insets differ on purpose, so
 * neither can be the other's oracle.
 *
 * **The oracle is the token, not a number in the code.** The `play` function
 * reads `--spacing-gutter` back from the CSSOM and measures the rendered
 * inset (`pageLabel.left − aside.right`) against it; a literal „24" would
 * stay green even if the utility compiled to nothing or the token moved. It
 * also pins that the column's header row does **not** share that measure:
 * 16px, the body's measure.
 */
export const BarInsetIsTheColumnGutter: Story = {
  render: () => (
    <AppShellFixture context="overview" pageLabel="Dashboard" search={<ShellSearch />}>
      <DashboardPage />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    const column = (
      await canvas.findByRole("complementary", { name: "Hauptnavigation" })
    ).getBoundingClientRect();

    // Die Kopfzeile der Spalte über ihren Schalter gefunden — nicht über eine
    // Klasse: der Schalter ist das einzige Element, das `SidePanel` dort
    // garantiert rendert, und sein Elternknoten IST die Zeile.
    const toggle = await canvas.findByRole("button", { name: "Navigation einklappen" });
    const headerRow = toggle.parentElement as HTMLElement;
    const columnFirst = headerRow.firstElementChild as HTMLElement;
    // Links liest die Zeile [Marke … Schalter]; das Erstkind ist also die
    // Marke und nicht der Schalter. Ohne diese Prüfung würde die Messung
    // stillschweigend den Schalter vermessen.
    await expect(columnFirst).not.toBe(toggle);

    const label = (await canvas.findByText("Dashboard")).getBoundingClientRect();
    const columnInset = columnFirst.getBoundingClientRect().left - column.left;
    const barInset = label.left - column.right;

    // Oracle: the declared token, read back from the CSSOM — not the column's
    // header row (which deliberately has a different measure) and not the
    // number 24 in the test.
    const gutter = getComputedStyle(document.documentElement)
      .getPropertyValue("--spacing-gutter")
      .trim();
    await expect(gutter).toMatch(/^\d+(\.\d+)?px$/);
    await expect(barInset).toBeCloseTo(parseFloat(gutter), 0);

    // Und die Kopfzeile der Spalte ist ausdrücklich NICHT auf demselben Maß:
    // sie folgt der Polsterung des Rumpfs (`p-4`), damit ihr Umschalter auf
    // dem ersten Bedienelement des Rumpfs steht. Gegen die gerenderte
    // Polsterung der Zeile geprüft, nicht gegen eine Zahl.
    await expect(columnInset).toBeCloseTo(
      parseFloat(getComputedStyle(headerRow).paddingLeft),
      0,
    );
    await expect(columnInset).not.toBeCloseTo(parseFloat(gutter), 0);

    // Und die Zeile ist so breit wie die Hauptspalte: kein `max-w-*`-Deckel,
    // kein `mx-auto`. (Bei 1280px bände der alte 1440px-Deckel noch nicht —
    // diese Zusicherung gilt dem breiten Fenster, in dem er es täte.)
    const barRow = (canvasElement.querySelector("header") as HTMLElement)
      .firstElementChild as HTMLElement;
    const main = canvasElement.querySelector("main") as HTMLElement;
    await expect(barRow.getBoundingClientRect().width).toBeCloseTo(
      main.getBoundingClientRect().width,
      0,
    );
  },
};

/**
 * Both states of the left column in one story, because the toggle is the
 * only way back: a click shows the 60px **rail**, a second click the full
 * column.
 */
export const WithCollapsibleColumns: Story = {
  render: () => (
    <AppShellFixture context="overview" search={<ShellSearch />}>
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Orakel für die ausgeklappte Breite: der in `src/tokens.css` deklarierte
    // Token, aus dem CSSOM zurückgelesen — kein literales „256px", das auch
    // dann grün wäre, wenn das Utility zu nichts kompilierte. Für die Schiene:
    // die exportierte Designkonstante.
    const tokenWidth = (name: string) => {
      const root = getComputedStyle(document.documentElement);
      const raw = root.getPropertyValue(name).trim();
      const match = /^([\d.]+)rem$/.exec(raw);
      if (!match) throw new Error(`Token ${name} fehlt oder ist kein rem-Maß: "${raw}"`);
      return parseFloat(match[1]) * parseFloat(root.fontSize);
    };
    const column = () =>
      canvasElement.querySelector("aside") as HTMLElement;

    await expect(column().getBoundingClientRect().width).toBe(
      tokenWidth("--width-sidebar"),
    );
    // Ausgeklappt trägt die Kopfzeile der Spalte die Marke („JLU RAG").
    await expect(canvas.getByText("RAG")).toBeVisible();

    await userEvent.click(await canvas.findByRole("button", { name: "Navigation einklappen" }));
    await expect(column().getBoundingClientRect().width).toBe(SIDE_PANEL_RAIL_WIDTH);
    /* Collapsed is the rail, and the navigation MOVES into it instead of
       disappearing with the body: "minimise" means icons, not "no
       navigation". The brand stays cleared; `header` does not move along.

       Exactly ONE landmark, not two: the node is moved, not rendered a
       second time. Two copies would duplicate every `id` and every
       `aria-current` in a `NavItem`. */
    await expect(canvas.getAllByRole("navigation", { name: "Hauptnavigation" })).toHaveLength(1);
    // Die Marke („JLU RAG") ist mit der Kopfzeile aus der Spalte verschwunden
    // — und die breite Zeile trägt keine eigene.
    await expect(canvas.queryByText("RAG")).toBeNull();

    /* Und die Zeilen passen wirklich in 60px — das ist die Messung, die nur der
       Browser-Runner machen kann (jsdom hat kein Layout). Orakel: die
       exportierte Designkonstante, nicht eine literale 60. */
    const row = await canvas.findByRole("button", { name: "Geteiltes Wissen" });
    await expect(row.getBoundingClientRect().width).toBeLessThanOrEqual(
      SIDE_PANEL_RAIL_WIDTH,
    );

    await userEvent.click(await canvas.findByRole("button", { name: "Navigation ausklappen" }));
    await expect(column().getBoundingClientRect().width).toBe(
      tokenWidth("--width-sidebar"),
    );
  },
};

/**
 * **The rail is the vertical mirror of the expanded column**: every control
 * keeps its height on the page across a collapse. The rail mirrors the
 * `h-14` chrome row and the column body's padding instead of a vertical
 * rhythm of its own. Measured in Chromium, relative to the column's top, so
 * neither the scroll position nor the window size enters.
 *
 * The oracle is the EXPANDED state, not a number read from the code: the
 * expanded column is the one the collapsed one has to line up with, and both
 * measurements come from the same browser layout.
 *
 * **The expanded nav is the overview context's `SidebarPanel` frame** — the
 * composition JLURAG's `SidebarNav.tsx` renders: a `SidebarPanel` with no
 * title, `head` or `nav` around the rows, bare rows in the rail. The story
 * asserts that frame before it measures, so it cannot silently fall back to
 * bare rows. A head-less panel renders no head, and its list carries the
 * 8px top inset (`pt-2`) the rail's `py-2` mirrors. (The failures
 * this pins: Changelog, 0.35.0 and KI-852.)
 */
export const CollapsedRailKeepsVerticalPositions: Story = {
  render: () => (
    <AppShellFixture context="overview" search={<ShellSearch />}>
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const column = () => canvasElement.querySelector("aside") as HTMLElement;
    // Alles relativ zur Spaltenoberkante: absolute Viewport-Koordinaten wären
    // von der Fenstergröße des Runners abhängig, die Differenz nicht.
    const offsetTop = (el: Element) =>
      el.getBoundingClientRect().top - column().getBoundingClientRect().top;
    const centreY = (el: Element) => {
      const box = el.getBoundingClientRect();
      return box.top + box.height / 2 - column().getBoundingClientRect().top;
    };

    // Der gepinnte Fuß wird von unten gemessen — er hängt an der Unterkante der
    // Spalte, nicht an deren Oberkante.
    const offsetBottom = (el: Element) =>
      column().getBoundingClientRect().bottom - el.getBoundingClientRect().bottom;

    const toggleOpen = await canvas.findByRole("button", { name: "Navigation einklappen" });
    const openToggleCentre = centreY(toggleOpen);
    const openRow = await canvas.findByRole("button", { name: "Mein Wissen" });
    // The composition under test: the rows sit in a `SidebarPanel` frame.
    await expect(openRow.closest('[data-slot="sidebar-panel"]')).not.toBeNull();
    const openNavTop = offsetTop(openRow);
    const openFootBottom = offsetBottom(
      await canvas.findByRole("button", { name: /Jamie Lee/ }),
    );

    await userEvent.click(toggleOpen);

    const toggleRail = await canvas.findByRole("button", { name: "Navigation ausklappen" });
    await expect(centreY(toggleRail)).toBe(openToggleCentre);
    // Dieselbe Zeile, jetzt in ihrer Icon-Form: `NavItem` behält seinen Namen
    // über `aria-label`, deshalb findet sie derselbe Selektor.
    await expect(
      offsetTop(await canvas.findByRole("button", { name: "Mein Wissen" })),
    ).toBe(openNavTop);
    /* And the foot: the same node, the same distance to the bottom edge. The
       rail adds no bottom padding of its own on top of the consumer node's.
       The button's height changes (`sm` → `icon`); its bottom edge must
       not. */
    await expect(offsetBottom(await canvas.findByRole("button", { name: /Jamie Lee/ }))).toBe(
      openFootBottom,
    );
  },
};

/**
 * **The left column is draggable**, shown in the workspace context (the
 * sources float as a card and have no separator). The shell composes `SidePanel` + `ResizeHandle` for it; there is no
 * second mechanism and no storage in the package. The widths are **the
 * app's state**: `onWidthChange` reports every clamped value, and the app
 * passes it back through `leftWidth` or `rightPanel.width`.
 *
 * The `play` function measures in Chromium what jsdom cannot: it focuses the
 * left separator, presses `→` three times and checks that the column's
 * **measured** box grew by 3 × `step` (30px) and equals the separator's
 * `aria-valuenow` exactly.
 *
 * Oracle: the browser's layout against the story's state, not a number read
 * from the component code. Start widths are measured, not asserted.
 *
 * **`usePersistedWidth` holds the widths**: the hook that keeps a dragged
 * width per device, with the **whole** key from the consumer. The fixture
 * passes an in-memory `Storage` per mount, so the test run leaves nothing in
 * the real `localStorage`; an app omits `storage`.
 */
export const WithResizableColumns: Story = {
  render: () => (
    <AppShellFixture context="workspace" search={<ShellSearch label={WORKSPACE_SEARCH} />}>
      <ChatPage />
    </AppShellFixture>
  ),
  play: async ({ canvas, userEvent }) => {
    const step = 10;

    // Linke Spalte: `→` verbreitert sie.
    const leftColumn = await canvas.findByRole("complementary", { name: "Verlauf" });
    const leftHandle = await canvas.findByRole("separator", {
      name: "Breite des Verlaufs ändern",
    });
    const leftBefore = leftColumn.getBoundingClientRect().width;
    leftHandle.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    const leftAfter = leftColumn.getBoundingClientRect().width;
    await expect(leftAfter).toBe(leftBefore + 3 * step);
    // Gemessene Box und gemeldeter Wert sind EINE Zahl, nicht zwei.
    await expect(leftHandle.getAttribute("aria-valuenow")).toBe(String(leftAfter));

    // The sources card floats: it has no separator.
    await expect(canvas.queryByRole("separator", { name: "Breite der Quellen ändern" })).toBeNull();

    // The separator lies on the content-facing edge: to the right of the column.
    await expect(leftHandle.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      leftColumn.getBoundingClientRect().right - 1,
    );
  },
};

/**
 * **The separator takes no layout width.** Its host is `w-0`, and the grab
 * zone is an `::after` overlay 8px wide that sits **over** the edge line
 * (4px into each neighbour), so no tinted strip shows between two
 * `bg-surface-container-lowest` surfaces. (The report that led here:
 * Changelog, 0.38.0.)
 *
 * This `play` function checks in Chromium exactly what jsdom cannot.
 * **The oracle is the browser's layout and hit-testing**: every expected
 * number is the measured edge of a *neighbour*, never a literal:
 *
 * 1. the separator's box is 0px wide,
 * 2. the left column's right edge **is** the main column's left edge, with
 *    nothing between them,
 * 3. `elementFromPoint` returns the separator ±3px from that line (so from
 *    both sides) but not ±5px: the 8px grab zone is real and centred,
 * 4. a pointer drag that starts at a point *found* that way still changes
 *    the width and `aria-valuenow` by the same amount.
 *
 * The dragging state colours the overlay (`after:bg-primary`); at rest it is
 * transparent. The **hover** tone (`hover:after:bg-outline-variant`) is *not*
 * checked here: CSS `:hover` follows the browser's real pointer and is not
 * triggered by pointer events dispatched from JavaScript.
 */
export const HandleHasNoLayoutWidth: Story = {
  render: () => (
    <AppShellFixture context="workspace" search={<ShellSearch label={WORKSPACE_SEARCH} />}>
      <ChatPage />
    </AppShellFixture>
  ),
  play: async ({ canvas, userEvent }) => {
    const column = await canvas.findByRole("complementary", { name: "Verlauf" });
    const handle = await canvas.findByRole("separator", {
      name: "Breite des Verlaufs ändern",
    });
    const main = await canvas.findByRole("main");

    // Definierter Startwert, egal was vorher gezogen wurde: `Home` ist das
    // angekündigte Minimum.
    handle.focus();
    await userEvent.keyboard("{Home}");

    // (1) Keine Layout-Breite.
    await expect(handle.getBoundingClientRect().width).toBe(0);

    // (2) Deshalb berühren sich die Nachbarn. Die erwartete Zahl ist die Kante
    //     der Spalte, nicht eine aus dem Code abgelesene Breite.
    const columnBox = column.getBoundingClientRect();
    await expect(main.getBoundingClientRect().left).toBe(columnBox.right);

    // (3) Die Greiffläche liegt über dieser Linie — von beiden Seiten
    //     erreichbar, aber nicht breiter als 8px.
    const borderX = columnBox.right;
    const midY = columnBox.top + columnBox.height / 2;
    await expect(document.elementFromPoint(borderX - 3, midY)).toBe(handle);
    await expect(document.elementFromPoint(borderX + 3, midY)).toBe(handle);
    await expect(document.elementFromPoint(borderX - 5, midY)).not.toBe(handle);
    await expect(document.elementFromPoint(borderX + 5, midY)).not.toBe(handle);

    // Im Ruhezustand ist das Overlay durchsichtig.
    const restFill = getComputedStyle(handle, "::after").backgroundColor;
    await expect(restFill).toBe("rgba(0, 0, 0, 0)");

    // (4) Und ein Zug, der an einem per Hit-Test *gefundenen* Punkt beginnt,
    //     zieht weiterhin — der Griff, den der Nutzer trifft, ist der Griff,
    //     der die Schleife fährt.
    const grab = document.elementFromPoint(borderX + 3, midY) as HTMLElement;
    const widthBefore = column.getBoundingClientRect().width;
    const valueBefore = Number(handle.getAttribute("aria-valuenow"));
    grab.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: borderX + 3,
        clientY: midY,
      }),
    );
    // Gefüllt, sobald der Zug läuft (`after:transition-colors` blendet über,
    // deshalb gepollt statt einmal gelesen).
    await waitFor(async () => {
      await expect(getComputedStyle(handle, "::after").backgroundColor).not.toBe(
        restFill,
      );
    });
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: borderX + 43,
        clientY: midY,
      }),
    );
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

    // 40px nach rechts, linke Spalte → 40px breiter. Handarithmetik auf der
    // *gemessenen* Startbreite. Gepollt, weil der Zustandswechsel hier aus
    // einem **nativen** `window`-Listener kommt (der Griff fährt die Schleife
    // selbst) — React stapelt das und rendert erst danach.
    await waitFor(async () => {
      await expect(Number(handle.getAttribute("aria-valuenow"))).toBe(valueBefore + 40);
    });
    await expect(column.getBoundingClientRect().width).toBe(widthBefore + 40);
    // Und die Kanten liegen nach dem Zug wieder aufeinander.
    await expect(main.getBoundingClientRect().left).toBe(
      column.getBoundingClientRect().right,
    );
  },
};

/**
 * **A locked sources card** (`rightPanel.locked`, 0.81.0) — JLURAG's
 * `KbWorkspaceLayout.tsx` for a user whose role may not see the sources: the
 * toggle keeps its place in the bar so it does not jump between users, but
 * there is no card behind it.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the toggle is in the bar, at the same end edge as an unlocked one
 *    [the boxes];
 * 2. it is `aria-disabled`, not `aria-expanded`, and described by the reason
 *    [ARIA attributes, accessible description];
 * 3. its icon is dimmed [the computed opacity];
 * 4. no card is rendered, and a click opens none [ARIA `complementary`];
 * 5. it stays focusable, and focus shows the tooltip with the reason
 *    [focus, ARIA `tooltip`].
 */
export const WithLockedSources: Story = {
  render: () => (
    <AppShellFixture
      context="workspace"
      search={<ShellSearch label={WORKSPACE_SEARCH} />}
      sourcesLocked
    >
      <ChatPage />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expectBarHeight(canvasElement);
    const header = bar(canvasElement);
    const toggle = within(header).getByRole("button", { name: SOURCES_LOCKED_LABEL });
    await expect(toggle.getBoundingClientRect().right).toBeCloseTo(
      header.getBoundingClientRect().right - 8,
      0,
    );

    await expect(toggle).toHaveAttribute("aria-disabled", "true");
    await expect(toggle).not.toHaveAttribute("aria-expanded");
    await expect(toggle).toHaveAccessibleDescription(SOURCES_LOCKED_REASON);
    await expect(Number(getComputedStyle(toggle.querySelector("svg")!).opacity)).toBeLessThan(1);

    await expect(canvas.queryByRole("complementary", { name: "Quellen" })).toBeNull();
    await userEvent.click(toggle);
    await expect(canvas.queryByRole("complementary", { name: "Quellen" })).toBeNull();

    // Keyboard focus from the control before it (the gear) reaches the toggle.
    within(header).getByRole("button", { name: "Einstellungen des Themas" }).focus();
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    const tip = await page(canvasElement).findByRole("tooltip");
    await expect(tip).toHaveTextContent(SOURCES_LOCKED_REASON);
  },
};

/**
 * **`notice`: the system banner, at the top of the frame, full width.** A
 * warning `Alert` with `layout="banner"`, a close button and an inline action.
 *
 * `play` (Chromium, 1280px), oracles in brackets:
 * 1. the banner is reachable as a named `region` [ARIA landmark + name];
 * 2. it starts at the frame's top edge and spans the frame's full width,
 *    over the nav column too [the layout boxes];
 * 3. the nav column and the bar start where it ends — it pushes, it does not
 *    cover [the boxes];
 * 4. one line is slim, at most 40px [the design brief];
 * 5. the bar is still 56px [the published contract].
 */
export const WithSystemNotice: Story = {
  render: () => (
    <AppShellFixture
      context="overview"
      search={<ShellSearch />}
      notice={
        <Alert tone="error" layout="banner" live="assertive">
          <AlertTitle>Dienst nicht verfügbar</AlertTitle>
          <AlertDescription>Wir arbeiten an der Behebung.</AlertDescription>
          <AlertAction>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 font-semibold text-current underline"
              asChild
            >
              <a href="#status">Status ansehen</a>
            </Button>
          </AlertAction>
        </Alert>
      }
    >
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const region = await canvas.findByRole("region", { name: "Systemmeldung" });
    const notice = region.getBoundingClientRect();
    // The frame is the region's parent: the region is its first row.
    const frame = region.parentElement!.getBoundingClientRect();
    const header = bar(canvasElement).getBoundingClientRect();
    const column = canvas
      .getByRole("complementary", { name: "Hauptnavigation" })
      .getBoundingClientRect();

    await expect(notice.top).toBeCloseTo(frame.top, 0);
    await expect(notice.left).toBeCloseTo(frame.left, 0);
    await expect(notice.width).toBeCloseTo(frame.width, 0);
    await expect(column.top).toBeCloseTo(notice.bottom, 0);
    await expect(header.top).toBeCloseTo(notice.bottom, 0);
    await expect(notice.height).toBeLessThanOrEqual(40);
    // The message (icon + text) is centred in the band.
    const text = within(region)
      .getByText("Dienst nicht verfügbar")
      .parentElement!.getBoundingClientRect();
    const icon = region.querySelector("svg")!.getBoundingClientRect();
    await expect((icon.left + text.right) / 2).toBeCloseTo(
      notice.left + notice.width / 2,
      -1,
    );
  },
};

/**
 * Reduced operation: a small `Alert layout="pill"` in the `status` slot,
 * floating at the top centre of the main area — over the page, which neither
 * moves nor reflows.
 */
export const WithSystemStatus: Story = {
  render: () => (
    <AppShellFixture
      context="overview"
      search={<ShellSearch />}
      status={
        <Alert tone="warning" layout="pill" live="polite" onDismiss={() => {}}>
          <AlertTitle>Hohe Auslastung</AlertTitle>
          <AlertDescription>Antworten können länger dauern.</AlertDescription>
        </Alert>
      }
    >
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const pill = await canvas.findByRole("status");
    const box = pill.getBoundingClientRect();
    const main = canvas.getByRole("main").getBoundingClientRect();
    const header = bar(canvasElement).getBoundingClientRect();

    // Top centre of the main area, just under the bar.
    await expect(box.top).toBeCloseTo(main.top + 12, 0);
    await expect(header.bottom).toBeCloseTo(main.top, 0);
    await expect(box.left + box.width / 2).toBeCloseTo(main.left + main.width / 2, -1);
    // As wide as its text, not the column.
    await expect(box.width).toBeLessThan(main.width / 2);
    await expect(within(pill).getByRole("button", { name: "Schließen" })).toBeVisible();
  },
};

/**
 * The same slot at `statusPosition="bottom-end"`: an `Alert layout="toast"`
 * card in the main area's bottom-right corner, up to 24rem wide — over the
 * page, which neither moves nor reflows, and clear of the side column.
 */
export const WithSystemStatusBottomEnd: Story = {
  render: () => (
    <AppShellFixture
      context="overview"
      search={<ShellSearch />}
      statusPosition="bottom-end"
      status={
        <Alert tone="warning" layout="toast" live="polite" onDismiss={() => {}}>
          <AlertTitle>Wartung angekündigt</AlertTitle>
          <AlertDescription>
            Am Freitag zwischen 18 und 20 Uhr ist der Dienst nicht erreichbar.
          </AlertDescription>
        </Alert>
      }
    >
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const card = await canvas.findByRole("status");
    const box = card.getBoundingClientRect();
    const main = canvas.getByRole("main").getBoundingClientRect();

    // Bottom-right of the main area, 16px in from both edges.
    await expect(box.bottom).toBeCloseTo(main.bottom - 16, 0);
    await expect(box.right).toBeCloseTo(main.right - 16, 0);
    await expect(box.left).toBeGreaterThanOrEqual(main.left);
    // 24rem at most.
    await expect(box.width).toBeLessThanOrEqual(384);
    await expect(within(card).getByRole("button", { name: "Schließen" })).toBeVisible();
  },
};

/**
 * `statusPosition="top-end"`: the same card in the main area's top-right
 * corner, for a message that asks for an action — here a new version that
 * waits for a reload, with no close button.
 */
export const WithSystemStatusTopEnd: Story = {
  render: () => (
    <AppShellFixture
      context="overview"
      search={<ShellSearch />}
      statusPosition="top-end"
      status={
        <Alert tone="info" layout="toast" live="polite">
          <AlertTitle>Neue Version verfügbar</AlertTitle>
          <AlertDescription>Lade die Seite neu, um sie zu verwenden.</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm">
              Neu laden
            </Button>
          </AlertAction>
        </Alert>
      }
    >
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const card = await canvas.findByRole("status");
    const box = card.getBoundingClientRect();
    const main = canvas.getByRole("main").getBoundingClientRect();

    // Top-right of the main area, 16px in from both edges.
    await expect(box.top).toBeCloseTo(main.top + 16, 0);
    await expect(box.right).toBeCloseTo(main.right - 16, 0);
    await expect(box.left).toBeGreaterThanOrEqual(main.left);
    // 24rem at most.
    await expect(box.width).toBeLessThanOrEqual(384);
    await expect(within(card).getByRole("button", { name: "Neu laden" })).toBeVisible();
    await expect(within(card).queryByRole("button", { name: "Schließen" })).toBeNull();
  },
};

/**
 * A corner card taller than the screen: it is capped below the bar and scrolls
 * in itself, so its title and close button can still be reached.
 */
export const WithSystemStatusBottomEndTall: Story = {
  render: () => (
    <AppShellFixture
      context="overview"
      search={<ShellSearch />}
      statusPosition="bottom-end"
      status={
        <Alert tone="info" layout="toast" live="polite" onDismiss={() => {}}>
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription>
            {Array.from({ length: 40 }, (_, i) => (
              <p key={i}>Zeile {i + 1} eines sehr langen Hinweises.</p>
            ))}
          </AlertDescription>
        </Alert>
      }
    >
      <MeinWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = await canvas.findByRole("status");
    const scroller = card.parentElement!;
    const main = canvas.getByRole("main").getBoundingClientRect();
    const header = bar(canvasElement).getBoundingClientRect();

    await expect(scroller).toHaveAttribute("data-slot", "app-shell-status-scroller");
    const box = scroller.getBoundingClientRect();
    // Inside the main area with its 16px insets: below the bar, above the edge.
    await expect(header.bottom).toBeLessThanOrEqual(main.top + 1);
    await expect(box.top).toBeCloseTo(main.top + 16, 0);
    await expect(box.bottom).toBeCloseTo(main.bottom - 16, 0);
    // Scrolls in itself, and takes the pointer (its scrollbar is usable).
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    await expect(getComputedStyle(scroller).pointerEvents).toBe("auto");
    await expect(within(card).getByRole("button", { name: "Schließen" })).toBeInTheDocument();
  },
};

/**
 * History buttons as an app would hang them into `titlebarControls`. The
 * native stories also pass the small logo (`nativeLogo`), as the reference
 * consumer does: the header row's minimum width is sized for it.
 */
const historyControls = (
  <>
    <Button variant="ghost" size="icon" aria-label="Zurück">
      <ChevronLeft size={20} aria-hidden="true" />
    </Button>
    <Button variant="ghost" size="icon" aria-label="Vor">
      <ChevronRight size={20} aria-hidden="true" />
    </Button>
  </>
);

/** The small logo every native story passes, with `historyControls`. */
const nativeLogo = <Logo product="RAG" size="sm" />;

/**
 * The native stories set `data-shell` / `data-titlebar` on `<html>` — the
 * document, not the story. On the Docs page every story shares one document,
 * so inline they would turn every other shell on the page native too (the
 * brand of `Overview` slid 100px to the right, behind the window controls).
 * In its own iframe each keeps its attributes to itself.
 */
const OWN_IFRAME_IN_DOCS = { docs: { story: { inline: false, iframeHeight: 640 } } };

/**
 * Stands in for the Electron host of „Native shell": sets the two `<html>`
 * attributes the preload would set, paints a backdrop where the OS material
 * would be, and draws three dots where macOS puts the window controls.
 */
function NativeShellHost({
  children,
  titlebar = "inset",
}: {
  children: ReactNode;
  /** `hidden`: full screen, where the window controls are gone. */
  titlebar?: "inset" | "hidden";
}) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.shell = "native";
    root.dataset.titlebar = titlebar;
    return () => {
      delete root.dataset.shell;
      delete root.dataset.titlebar;
    };
  }, [titlebar]);
  return (
    <div className="relative bg-linear-to-br from-primary-container via-tertiary-container to-secondary-container">
      {titlebar === "inset" && (
        <div
          aria-hidden="true"
          data-slot="window-controls"
          className="pointer-events-none absolute top-5.5 left-4.75 z-30 flex gap-2"
        >
          <span className="size-3 rounded-full bg-on-surface-variant/50" />
          <span className="size-3 rounded-full bg-on-surface-variant/50" />
          <span className="size-3 rounded-full bg-on-surface-variant/50" />
        </div>
      )}
      {children}
    </div>
  );
}

/** Alpha of a computed colour: 1 for `rgb(…)`, the last component otherwise. */
const alphaOf = (color: string): number => {
  const match = /(?:\/|,)\s*([\d.]+)\)$/.exec(color);
  return color.startsWith("rgb(") || !match ? 1 : Number(match[1]);
};

/**
 * A native shell (`<html data-shell="native" data-titlebar="inset">`): the
 * frame and the side column paint nothing, so the window's material shows,
 * the main column the opaque canvas. The column's header row starts after the
 * window controls and the top row drags the window. See „Native shell".
 */
export const NativeShell: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture
        context="overview"
        search={<ShellSearch />}
        titlebarControls={historyControls}
        logo={nativeLogo}
      >
        <MeinWissen />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expectBarHeight(canvasElement);
    const column = canvas.getByRole("complementary", { name: "Hauptnavigation" });
    const content = canvasElement.querySelector("[data-slot='app-shell-content']") as HTMLElement;
    const frame = content.parentElement!.parentElement!;

    // Frame and side column transparent, main column opaque.
    await expect(alphaOf(getComputedStyle(frame).backgroundColor)).toBe(0);
    await expect(alphaOf(getComputedStyle(column).backgroundColor)).toBe(0);
    await expect(alphaOf(getComputedStyle(content).backgroundColor)).toBe(1);
    await expect(alphaOf(getComputedStyle(document.body).backgroundColor)).toBe(0);

    // One title-bar row: window controls, the brand right beside them, the
    // toggle at the column's far edge.
    const headerRow = column.querySelector("[data-titlebar-inset='start']") as HTMLElement;
    await expect(getComputedStyle(headerRow).paddingLeft).toBe("100px");
    const controls = canvasElement
      .querySelector("[data-slot='window-controls']")!
      .getBoundingClientRect();
    const toggle = within(headerRow).getByRole("button", { name: "Navigation einklappen" });
    const toggleBox = toggle.getBoundingClientRect();
    const brand = headerRow.firstElementChild!.firstElementChild!.getBoundingClientRect();
    await expect(brand.left).toBeCloseTo(controls.left - 19 + 100, 0);
    await expect(toggleBox.left).toBeGreaterThanOrEqual(brand.right);
    await expect(column.getBoundingClientRect().right - toggleBox.right).toBeLessThanOrEqual(16);
    // The app's window controls stand in the column, between brand and toggle.
    const back = within(headerRow).getByRole("button", { name: "Zurück" }).getBoundingClientRect();
    const forward = within(headerRow).getByRole("button", { name: "Vor" }).getBoundingClientRect();
    await expect(back.left).toBeGreaterThanOrEqual(brand.right);
    await expect(forward.right).toBeLessThanOrEqual(toggleBox.left);
    // Right-aligned: directly before the toggle, not after the brand.
    await expect(toggleBox.left - forward.right).toBeLessThanOrEqual(12);
    // Nothing reaches under the window controls, and everything shares one centre line.
    const mid = (box: DOMRect) => (box.top + box.bottom) / 2;
    for (const box of [brand, back, forward, toggleBox]) {
      await expect(box.left).toBeGreaterThanOrEqual(controls.right);
      await expect(mid(box)).toBeCloseTo(mid(controls), 0);
    }
    // …on one line with the controls and the chrome bar.
    const rowBox = headerRow.getBoundingClientRect();
    await expect(rowBox.top).toBeCloseTo(frame.getBoundingClientRect().top, 0);
    await expect(bar(canvasElement).getBoundingClientRect().top).toBeCloseTo(rowBox.top, 0);
    await expect((controls.top + controls.bottom) / 2).toBeCloseTo((rowBox.top + rowBox.bottom) / 2, 0);

    // Labels in the column are not selectable; it is the navigation.
    await expect(getComputedStyle(column).userSelect).toBe("none");

    // The row drags the window, its button does not.
    const region = (el: Element) => getComputedStyle(el).getPropertyValue("-webkit-app-region");
    await expect(region(headerRow)).toBe("drag");
    await expect(region(bar(canvasElement))).toBe("drag");
    await expect(region(toggle)).toBe("no-drag");
  },
};

/**
 * Full screen (`data-titlebar="hidden"`): the window controls are gone, so
 * the brand stands at the column's left edge, on the line of the rows below
 * it, as on the web. The arrangement of the row stays.
 */
export const NativeShellFullScreen: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost titlebar="hidden">
      <AppShellFixture
        context="overview"
        search={<ShellSearch />}
        titlebarControls={historyControls}
        logo={nativeLogo}
      >
        <MeinWissen />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas }) => {
    const column = canvas.getByRole("complementary", { name: "Hauptnavigation" });
    const headerRow = column.querySelector("[data-titlebar-inset='start']") as HTMLElement;
    const brand = headerRow.firstElementChild!.firstElementChild!.getBoundingClientRect();
    // 8px row inset + the brand's own 10px: where it stands on the web.
    await expect(brand.left - column.getBoundingClientRect().left).toBeCloseTo(18, 0);
    // The row is otherwise the same: controls, then the toggle at the far edge.
    const toggle = within(headerRow).getByRole("button", { name: "Navigation einklappen" }).getBoundingClientRect();
    const back = within(headerRow).getByRole("button", { name: "Zurück" }).getBoundingClientRect();
    const forward = within(headerRow).getByRole("button", { name: "Vor" }).getBoundingClientRect();
    await expect(back.left).toBeGreaterThanOrEqual(brand.right);
    await expect(toggle.left).toBeGreaterThanOrEqual(forward.right);
    // The arrows stay right-aligned, beside the toggle, with the brand moved left.
    await expect(toggle.left - forward.right).toBeLessThanOrEqual(12);
  },
};

/**
 * A collapsed column does not reach into the title bar: the bar spans the
 * window's full width and carries the column's toggle where it stands while
 * expanded; the rail starts below.
 */
export const NativeShellCollapsed: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture
        context="overview"
        search={<ShellSearch />}
        leftOpen={false}
        titlebarControls={historyControls}
        logo={nativeLogo}
      >
        <MeinWissen />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement }) => {
    const header = bar(canvasElement);
    const toggle = await within(header).findByRole("button", { name: "Navigation ausklappen" });
    const expand = toggle.getBoundingClientRect();
    const controls = canvasElement
      .querySelector("[data-slot='window-controls']")!
      .getBoundingClientRect();
    const headerBox = header.getBoundingClientRect();
    const column = canvas.getByRole("complementary", { name: "Hauptnavigation" });
    const frameLeft = column.getBoundingClientRect().left;

    // The bar is the whole title row: from the window's edge, opaque, over the rail.
    await expect(headerBox.left).toBeCloseTo(frameLeft, 0);
    await expect(alphaOf(getComputedStyle(header).backgroundColor)).toBe(1);
    const corner = document.elementFromPoint(frameLeft + 4, headerBox.bottom - 4);
    await expect(header.contains(corner)).toBe(true);
    // The rail's own content starts below it.
    const firstIcon = column.querySelector("a, button") as HTMLElement;
    await expect(firstIcon.getBoundingClientRect().top).toBeGreaterThanOrEqual(headerBox.bottom);

    // The brand stays where it stands while expanded: right after the controls.
    const brand = header.querySelector("[data-slot='app-shell-brand']")!.getBoundingClientRect();
    await expect(brand.left).toBeCloseTo(controls.left - 19 + 100, 0);
    // The toggle follows it, on the bar's centre line.
    await expect(expand.left).toBeGreaterThanOrEqual(brand.right);
    await expect((expand.top + expand.bottom) / 2).toBeCloseTo((headerBox.top + headerBox.bottom) / 2, 0);
    // The rail that is left has the page's colour.
    const content = canvasElement.querySelector("[data-slot='app-shell-content']") as HTMLElement;
    await expect(getComputedStyle(column).backgroundColor).toBe(getComputedStyle(content).backgroundColor);
    // It takes the click, and does not drag the window.
    const hit = document.elementFromPoint(
      (expand.left + expand.right) / 2,
      (expand.top + expand.bottom) / 2,
    );
    await expect(hit?.closest("button")).toBe(toggle);
    await expect(getComputedStyle(toggle).getPropertyValue("-webkit-app-region")).toBe("no-drag");
    // Then the app's window controls, then the bar's own content.
    const forward = within(header).getByRole("button", { name: "Vor" }).getBoundingClientRect();
    await expect(within(header).getByRole("button", { name: "Zurück" }).getBoundingClientRect().left).toBeGreaterThanOrEqual(expand.right);
    const search = within(header).getByRole("searchbox");
    await expect(search.getBoundingClientRect().left).toBeGreaterThan(forward.right);
  },
};

/**
 * In a native shell with the window controls inset (`data-titlebar="inset"`)
 * the right column floats as it does on the web: a card over the main area,
 * below the bar, opened by the last control of the title row.
 */
export const NativeShellWorkspace: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture
        context="workspace"
        search={<ShellSearch label={WORKSPACE_SEARCH} />}
        titlebarControls={historyControls}
        logo={nativeLogo}
      >
        <ChatPage />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const header = bar(canvasElement);
    const headerBox = header.getBoundingClientRect();
    const main = canvas.getByRole("main").getBoundingClientRect();
    const pane = await canvas.findByRole("complementary", { name: "Quellen" });
    const box = pane.getBoundingClientRect();
    // Over the main area, which keeps its full width up to the window's edge.
    await expect(main.right).toBeCloseTo(headerBox.right, 0);
    await expect(box.top).toBeGreaterThanOrEqual(headerBox.bottom);
    await expect(box.right).toBeLessThan(main.right);
    await expect(box.left).toBeGreaterThan(main.left);
    await expect(box.bottom).toBeLessThan(main.bottom);
    // An opaque card, in front of the page.
    await expect(alphaOf(getComputedStyle(pane).backgroundColor)).toBe(1);
    const hit = document.elementFromPoint(box.left + 24, box.top + 24);
    await expect(pane.contains(hit)).toBe(true);
    // Its toggle is the title row's last control, and closes it.
    const toggle = within(header).getByRole("button", { name: "Quellen einklappen" });
    await expect(toggle.getBoundingClientRect().right).toBeCloseTo(headerBox.right - 8, 0);
    // The same control as the left column's toggle: one box, one icon size.
    const leftToggle = canvas.getByRole("button", { name: "Verlauf einklappen" });
    const iconOf = (button: HTMLElement) => button.querySelector("svg")!.getBoundingClientRect();
    await expect(iconOf(toggle).width).toBe(20);
    await expect(iconOf(toggle).width).toBe(iconOf(leftToggle).width);
    await expect(toggle.getBoundingClientRect().width).toBe(leftToggle.getBoundingClientRect().width);
    await userEvent.click(toggle);
    await waitFor(() => expect(pane).not.toBeVisible());
    await userEvent.click(within(header).getByRole("button", { name: "Quellen ausklappen" }));
    await waitFor(() => expect(pane).toBeVisible());
  },
};

/**
 * In a native shell the first row is the window's title bar, so a notice is
 * the frame's last row: full width at the bottom of the window.
 */
export const NativeShellWithNotice: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture
        context="overview"
        search={<ShellSearch />}
        titlebarControls={historyControls}
        logo={nativeLogo}
        notice={
          <Alert tone="info" layout="banner" live="polite">
            <AlertDescription>Dieses Angebot befindet sich im Testbetrieb.</AlertDescription>
          </Alert>
        }
      >
        <MeinWissen />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement }) => {
    const region = await canvas.findByRole("region", { name: "Systemmeldung" });
    const notice = region.getBoundingClientRect();
    const frame = region.parentElement!.getBoundingClientRect();
    const header = bar(canvasElement).getBoundingClientRect();
    const column = canvas.getByRole("complementary", { name: "Hauptnavigation" }).getBoundingClientRect();
    // Title bar on top, one row: column header and chrome bar start at the frame's edge.
    await expect(column.top).toBeCloseTo(frame.top, 0);
    await expect(header.top).toBeCloseTo(frame.top, 0);
    // Notice at the bottom, full width, under the columns and the page.
    await expect(notice.bottom).toBeCloseTo(frame.bottom, 0);
    await expect(notice.left).toBeCloseTo(frame.left, 0);
    await expect(notice.width).toBeCloseTo(frame.width, 0);
    await expect(column.bottom).toBeCloseTo(notice.top, 0);
    await expect(canvas.getByRole("main").getBoundingClientRect().bottom).toBeCloseTo(notice.top, 0);
  },
};

const SIDE_TABS = [
  { id: "po", title: "Prüfungsordnung, § 12", closeLabel: "Prüfungsordnung, § 12 schließen" },
  { id: "hb", title: "Modulhandbuch", closeLabel: "Modulhandbuch schließen" },
];

/** What a page declares beside itself: tabs it opened, state it keeps. */
const SidePanelDemo = ({ initiallyOpen = true }: { initiallyOpen?: boolean }) => {
  const [isOpen, setOpen] = useState(initiallyOpen);
  const [tabs, setTabs] = useState(SIDE_TABS);
  const [activeTabId, setActive] = useState<string | null>("po");
  const [width, setWidth] = useState(400);
  return (
    <AppShellSidePanel
      label="Seitenbereich"
      isOpen={isOpen}
      onOpenChange={setOpen}
      expandLabel="Seitenbereich einblenden"
      collapseLabel="Seitenbereich ausblenden"
      tabs={tabs}
      activeTabId={activeTabId}
      onTabChange={setActive}
      onTabClose={(id) => {
        const rest = tabs.filter((tab) => tab.id !== id);
        setTabs(rest);
        if (id === activeTabId) setActive(rest[0]?.id ?? null);
        if (rest.length === 0) setOpen(false);
      }}
      tabListLabel="Geöffnete Inhalte"
      width={width}
      resize={{ minWidth: 320, maxWidth: 720, onWidthChange: setWidth, label: "Breite des Seitenbereichs ändern" }}
      launchers={[
        { id: "po", label: "Prüfungsordnung, § 12" },
        { id: "hb", label: "Modulhandbuch" },
        { id: "browser", label: "Browser", disabled: true },
      ]}
      onLaunch={(id) => {
        const tab = SIDE_TABS.find((candidate) => candidate.id === id);
        if (!tab) return;
        if (!tabs.some((open) => open.id === id)) setTabs([...tabs, tab]);
        setActive(id);
      }}
      addLabel="Inhalt öffnen"
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm">
        {activeTabId === "po"
          ? "Die Masterarbeit ist binnen sechs Monaten nach der Ausgabe des Themas abzugeben."
          : "Modul 12: Abschlussmodul, 30 Leistungspunkte."}
      </div>
    </AppShellSidePanel>
  );
};

/** The panel and the floating card side by side: neither covers the other. */
const expectPanelBesideCard = async (canvas: ReturnType<typeof within>, canvasElement: HTMLElement) => {
  const column = await canvas.findByRole("complementary", { name: "Seitenbereich" });
  const box = column.getBoundingClientRect();
  const content = canvasElement.querySelector("[data-slot='app-shell-content']") as HTMLElement;
  const frame = content.parentElement!.parentElement!.getBoundingClientRect();
  const main = canvas.getByRole("main").getBoundingClientRect();
  // Where the panel leaves the card no room beside the page, the card has
  // closed (rule 4); asked for again, it lies over the page.
  const reopen = within(bar(canvasElement)).queryByRole("button", { name: "Quellen ausklappen" });
  if (reopen) await userEvent.click(reopen);
  const card = (await canvas.findByRole("complementary", { name: "Quellen" })).getBoundingClientRect();
  // A column of the frame: full height, at the end edge, the main area before it.
  await expect(box.width).toBe(400);
  await expect(box.top).toBeCloseTo(frame.top, 0);
  await expect(box.bottom).toBeCloseTo(frame.bottom, 0);
  await expect(box.right).toBeCloseTo(frame.right, 0);
  await expect(main.right).toBeCloseTo(box.left, 0);
  // The card floats over the main area and stops before the panel; so does its toggle.
  await expect(card.width).toBeGreaterThan(0);
  await expect(card.right).toBeLessThan(box.left);
  const cardToggle = within(bar(canvasElement)).getByRole("button", { name: "Quellen einklappen" });
  await expect(cardToggle.getBoundingClientRect().right).toBeLessThan(box.left);
  // The strip is level with the bar; the panel's toggle is its last control,
  // in the frame's top end corner.
  const strip = column.querySelector("[data-slot='app-shell-side-panel-strip']") as HTMLElement;
  await expect(strip.getBoundingClientRect().height).toBe(56);
  await expect(strip.getBoundingClientRect().top).toBeCloseTo(bar(canvasElement).getBoundingClientRect().top, 0);
  const toggle = within(column).getByRole("button", { name: "Seitenbereich ausblenden" });
  await expect(frame.right - toggle.getBoundingClientRect().right).toBeCloseTo(8, 0);
  return { column, strip, frame };
};

/**
 * `AppShellSidePanel`: the page declares a tabbed panel beside itself — a
 * cited source next to the answer. It takes width from the main area; the
 * floating sources card stays over the main area, beside the panel. The
 * toggle hides the panel and keeps its tabs; closing the last tab hides it.
 */
export const ChatWorkspaceWithSidePanel: Story = {
  render: () => (
    <AppShellFixture context="workspace" search={<ShellSearch label={WORKSPACE_SEARCH} />}>
      <ChatPage />
      <SidePanelDemo />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement }) => {
    const { column, frame } = await expectPanelBesideCard(canvas, canvasElement);
    // Tabs switch the content.
    await userEvent.click(within(column).getByRole("tab", { name: "Modulhandbuch" }));
    await expect(within(column).getByRole("tabpanel", { name: "Modulhandbuch" })).toHaveTextContent("Modul 12");
    // Hidden, the toggle is the bar's last control, in the same corner, and
    // the bar keeps its last action clear of both toggles.
    await userEvent.click(within(column).getByRole("button", { name: "Seitenbereich ausblenden" }));
    const header = bar(canvasElement);
    const show = await within(header).findByRole("button", { name: "Seitenbereich einblenden" });
    await expect(canvas.queryByRole("complementary", { name: "Seitenbereich" })).toBeNull();
    await expect(frame.right - show.getBoundingClientRect().right).toBeCloseTo(8, 0);
    const cardToggle = within(header).getByRole("button", { name: "Quellen einklappen" }).getBoundingClientRect();
    await expect(cardToggle.right).toBeLessThanOrEqual(show.getBoundingClientRect().left);
    for (const button of within(header).getAllByRole("button")) {
      const box = button.getBoundingClientRect();
      if (box.right <= cardToggle.left) continue;
      await expect(box.left).toBeGreaterThanOrEqual(cardToggle.left);
    }
    // Shown again, the tabs are still there, the chosen one active.
    await userEvent.click(show);
    const again = await canvas.findByRole("complementary", { name: "Seitenbereich" });
    await expect(within(again).getByRole("tab", { name: "Modulhandbuch" })).toHaveAttribute("aria-selected", "true");
    // The + stands right after the last tab, not at the strip's far end.
    const add = within(again).getByRole("button", { name: "Inhalt öffnen" }).getBoundingClientRect();
    const lastTab = within(again).getByRole("button", { name: "Modulhandbuch schließen" }).getBoundingClientRect();
    await expect(add.left - lastTab.right).toBeLessThanOrEqual(12);
    // Closing the last tab hides the panel; shown again, it lists what it can open.
    await userEvent.click(within(again).getByRole("button", { name: "Modulhandbuch schließen" }));
    await userEvent.click(within(again).getByRole("button", { name: "Prüfungsordnung, § 12 schließen" }));
    await waitFor(() => expect(canvas.queryByRole("complementary", { name: "Seitenbereich" })).toBeNull());
    await userEvent.click(await within(bar(canvasElement)).findByRole("button", { name: "Seitenbereich einblenden" }));
    const emptyPanel = await canvas.findByRole("complementary", { name: "Seitenbereich" });
    await userEvent.click(within(emptyPanel).getByRole("button", { name: "Modulhandbuch" }));
    await expect(within(emptyPanel).getByRole("tab", { name: "Modulhandbuch" })).toHaveAttribute("aria-selected", "true");
  },
};

/** The same panel in a native shell: opaque, its strip part of the title bar. */
export const NativeShellWorkspaceWithSidePanel: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture context="workspace" search={<ShellSearch label={WORKSPACE_SEARCH} />} titlebarControls={historyControls} logo={<Logo product="RAG" size="sm" />}>
        <ChatPage />
        <SidePanelDemo />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement }) => {
    const { column, strip } = await expectPanelBesideCard(canvas, canvasElement);
    await expect(alphaOf(getComputedStyle(column).backgroundColor)).toBe(1);
    const region = (el: Element) => getComputedStyle(el).getPropertyValue("-webkit-app-region");
    await expect(region(strip)).toBe("drag");
    await expect(region(within(column).getByRole("tab", { name: "Modulhandbuch" }))).toBe("no-drag");
    await expect(region(within(column).getByRole("button", { name: "Seitenbereich ausblenden" }))).toBe("no-drag");
  },
};

/**
 * The frame's shrinking rules, in a 900px frame with the panel shown: the
 * left column shows as its rail by itself, the main area keeps 360px, the
 * panel its minimum — and the sources card lies over the page, which does
 * not move aside for it.
 */
export const SidePanelInNarrowFrame: Story = {
  render: () => (
    <div style={{ width: 900 }}>
      <AppShellFixture context="workspace" search={<ShellSearch label={WORKSPACE_SEARCH} />}>
        <ChatPage />
        <SidePanelDemo />
      </AppShellFixture>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const column = await canvas.findByRole("complementary", { name: "Seitenbereich" });
    // The history column gave way by itself.
    await canvas.findByRole("button", { name: "Verlauf ausklappen" });
    await expect(canvas.queryByRole("button", { name: "Verlauf einklappen" })).toBeNull();
    const main = canvas.getByRole("main").getBoundingClientRect();
    await expect(main.width).toBeGreaterThanOrEqual(360);
    await expect(column.getBoundingClientRect().width).toBeGreaterThanOrEqual(320);
    await expect(column.getBoundingClientRect().right).toBeLessThanOrEqual(900);
    // The card had no room beside the page and closed by itself. Asked for,
    // it is over the page, and the page is not asked to keep clear.
    const content = canvasElement.querySelector("[data-slot='app-shell-content']") as HTMLElement;
    await expect(canvas.queryByRole("complementary", { name: "Quellen" })).toBeNull();
    await userEvent.click(await canvas.findByRole("button", { name: "Quellen ausklappen" }));
    const card = (await canvas.findByRole("complementary", { name: "Quellen" })).getBoundingClientRect();
    await expect(card.width).toBeGreaterThan(0);
    await expect(card.left).toBeGreaterThanOrEqual(main.left);
    await expect(content.style.getPropertyValue("--app-shell-bubble-inset")).toBe("");
    // Hidden, the panel gives the room back and the column returns.
    await userEvent.click(within(column).getByRole("button", { name: "Seitenbereich ausblenden" }));
    await canvas.findByRole("button", { name: "Verlauf einklappen" });
  },
};
