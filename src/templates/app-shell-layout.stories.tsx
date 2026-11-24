import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LayoutGrid, Menu } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../components/alert";
import { Button } from "../components/button";
import { Logo } from "../components/logo";
import { SIDE_PANEL_RAIL_WIDTH } from "../components/side-panel-variants";
import {
  AppShellFixture,
  NO_HISTORY,
  SOURCES_LOCKED_LABEL,
  SOURCES_LOCKED_REASON,
  TOPIC_SECTION,
} from "../test/fixtures/app-shell";
import {
  bar,
  expectBarHeight,
  EDGE_SLACK,
  page,
  ChatPage,
  SidePanelDemo,
  expectPanelBesideCard,
} from "../test/fixtures/app-shell-stories";
import { MeinWissen } from "../test/fixtures/mein-wissen";
import { Entdecken, GeteiltesWissen } from "../test/fixtures/overview-pages";
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
 * template's two contexts — `overview` (a list of pages in the column) or
 * `topic` (one topic open, with its history and its sources). The sample
 * content is JustRAG's, the DS's consumer, so the stories show the features
 * an app really uses. The overview's page is a `GridLayout` (the
 * `mein-wissen` fixture), which renders its title itself — the reason
 * `pageLabel` is optional: with a label, the title would stand twice. The
 * mechanism stories fill the central `search`; the page stories show the
 * shell without it (`bar={false}` on the overview, a bar with a breadcrumb
 * and no search in the topic view). The first seven stories are the page
 * stories — the overview and its settings, a topic view in three states and
 * its settings — then `Mobile`; the rest are the mechanism regressions (centring, empty bar, short bar, inset,
 * collapse, rail positions, resize, handle), on the same fixture instead of a
 * hand-built shell of their own.
 *
 * No story mounts a theme toggle: colour scheme, contrast, accent and Style
 * live behind the user menu's „Einstellungen" (`SettingsDialog` +
 * `AppearanceSettings`), which `SettingsFromUserMenu` walks through.
 * ------------------------------------------------------------------------- */

// Portable Stories: page content is the content templates' own stories —
// templates compose into each other, nothing is mocked again.

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
 * A mechanism check, not a page: out of the sidebar and the generated docs
 * (`!dev`, `!autodocs`), still run by `npm test` (`test`). The MDX shows one
 * where it explains something.
 */
const CHECK_ONLY = ["!dev", "!autodocs"];

/* ======================================================================== */
/* One story per page context                                               */
/* ======================================================================== */

/**
 * **The overview context** — a list of pages in the column and one page of
 * the user's items: no chrome bar (`bar={false}`); the brand, the NavItem
 * rows — „Suchen" (opens a search palette), „Mein Wissen", „Geteiltes
 * Wissen", „Entdecken" — in a `SidebarPanel`, the user menu pinned to the
 * column's foot. The page is `GridLayout` with the favourites row
 * („Favoriten" over „Weitere Themen") and the hairline accent cards, and it
 * renders the page's `<h1>` itself.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. no chrome bar: the page starts at the frame's top [the DOM; the boxes];
 * 2. the column stands left of `<main>` [the layout engine's boxes];
 * 3. the navigation's rows in order, „Mein Wissen" current
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
    <AppShellFixture context="overview" bar={false}>
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
 * The navigation marks `name` as the current page, and `<main>` holds the
 * region of that name with the page's only `<h1>`. Oracle: the ARIA tree
 * (`aria-current`, `region`, `heading`).
 */
async function expectOverviewPage(canvas: ReturnType<typeof within>, name: string) {
  const nav = within(canvas.getByRole("navigation", { name: "Hauptnavigation" }));
  await expect(nav.getByRole("button", { name })).toHaveAttribute("aria-current");
  for (const other of ["Mein Wissen", "Geteiltes Wissen", "Entdecken"].filter((n) => n !== name)) {
    await expect(nav.getByRole("button", { name: other })).not.toHaveAttribute("aria-current");
  }
  const region = within(canvas.getByRole("main")).getByRole("region", { name });
  await expect(within(region).getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
}

/**
 * **„Geteiltes Wissen"** — an overview page of items owned by others: the
 * topics somebody shared with you
 * and the public topics you subscribed to in „Entdecken", on the same
 * `GridLayout` as „Mein Wissen" (`overview-pages` fixture). A shared card
 * names its owner („von …") and its sharing („Geteilt (2)", „Öffentlich").
 *
 * `play` oracles [ARIA; text]: the navigation marks the page, which holds
 * the only `<h1>` (`expectOverviewPage`); the filters offer „Favoriten" but
 * not „Privat" / „Geteilt" — every topic here is shared; no card is private,
 * the shared ones name their owner; the primary action is „Thema
 * hinzufügen", the way to „Entdecken".
 */
export const SharedTopics: Story = {
  render: () => (
    <AppShellFixture context="overview" bar={false} section="shared">
      <GeteiltesWissen />
    </AppShellFixture>
  ),
  play: async ({ canvas, userEvent }) => {
    await expectOverviewPage(canvas, "Geteiltes Wissen");
    const page = within(canvas.getByRole("main"));
    const filters = within(page.getByRole("group", { name: "Themen filtern" }));
    await expect(filters.getByRole("button", { name: "Favoriten" })).toBeInTheDocument();
    await expect(filters.queryByRole("button", { name: "Privat" })).toBeNull();
    await expect(filters.queryByRole("button", { name: "Geteilt" })).toBeNull();
    await expect(page.queryByText("Privat")).toBeNull();
    await expect(page.getByText("Dr. Anna Weber")).toBeInTheDocument();
    await expect(page.getByText("Öffentlich")).toBeInTheDocument();
    await expect(page.getByRole("button", { name: "Thema hinzufügen" })).toBeVisible();

    // A filter that matches nothing says so — not „Noch nichts geteilt" — and
    // leads back to „Alle".
    await userEvent.click(filters.getByRole("button", { name: "Favoriten" }));
    await expect(await page.findByText("Keine Themen für diesen Filter")).toBeVisible();
    await expect(page.queryByText("Noch nichts geteilt")).toBeNull();
    await userEvent.click(page.getByRole("button", { name: "Filter zurücksetzen" }));
    await expect(await page.findByText("Dr. Anna Weber")).toBeInTheDocument();
  },
};

/**
 * **„Entdecken"** — a catalog page: public topics anyone at the university may
 * subscribe to. A catalog card carries „Abonnieren" — or, once subscribed,
 * „Abonniert" as a pressed toggle — in its band, the description, the size
 * and „Stand …". No „Favoriten" chip (a favourite is a topic you already
 * hold) and no primary action. The catalog is laid out at most two cards
 * per row with its own list — the band holds the name and the subscribe
 * button, too much for a 17.5rem cell; the fixture uses `GridLayout` and sets
 * the two columns through `renderGroup`, since the template has no option
 * for wider cells (an open point for the owner).
 *
 * `play` oracles [ARIA; text]: the navigation marks the page, which holds the
 * only `<h1>`; no „Favoriten" chip, no „Thema hinzufügen" / „Neues Thema";
 * exactly one entry is subscribed — its toggle pressed — and the others
 * offer „Abonnieren", not pressed; two cards per row at the runner's 1280px
 * window [the boxes] — at that width the template's own grid gives two as
 * well, so the check does not tell the fixture's cap from it; the cap
 * matters on wider screens, which the runner does not reach; the
 * subscribed card shows „1 Dokument" and its „Stand".
 */
export const DiscoverTopics: Story = {
  render: () => (
    <AppShellFixture context="overview" bar={false} section="discover">
      <Entdecken />
    </AppShellFixture>
  ),
  play: async ({ canvas }) => {
    await expectOverviewPage(canvas, "Entdecken");
    const page = within(canvas.getByRole("main"));
    const filters = within(page.getByRole("group", { name: "Themen filtern" }));
    await expect(filters.queryByRole("button", { name: "Favoriten" })).toBeNull();
    await expect(page.queryByRole("button", { name: /Thema hinzufügen|Neues Thema/ })).toBeNull();

    const subscribed = page.getAllByRole("button", { name: /^Abonniert: / });
    await expect(subscribed).toHaveLength(1);
    await expect(subscribed[0]).toHaveAttribute("aria-pressed", "true");
    const offers = page.getAllByRole("button", { name: /^Abonnieren: / });
    await expect(offers.length).toBeGreaterThan(0);
    for (const offer of offers) await expect(offer).toHaveAttribute("aria-pressed", "false");

    // Two cards per row: the second card starts on the first one's row.
    const cards = Array.from(canvas.getByRole("main").querySelectorAll<HTMLElement>("[data-topic]"));
    await expect(cards[1].getBoundingClientRect().top).toBe(cards[0].getBoundingClientRect().top);
    await expect(cards[2].getBoundingClientRect().top).toBeGreaterThan(cards[0].getBoundingClientRect().bottom);

    const card = subscribed[0].closest("[data-topic]") as HTMLElement;
    await expect(within(card).getByText("1 Dokument")).toBeInTheDocument();
    await expect(within(card).getByText("Stand 16.10.2026")).toBeInTheDocument();
  },
};

/**
 * **The topic context** — one topic open:
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
 * Only the history column is resizable; the card has no handle. The bar has
 * no search (the slot is deprecated); its inset is the column gutter, checked
 * below.
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
export const TopicView: Story = {
  render: () => (
    <AppShellFixture context="topic" topic={TOPIC_NAME}>
      <TopicConversation />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // At the 1280px test canvas the page beside the card would be under twice
    // the card, so the frame closes it (`AppShell`, rule 3); opened by hand it
    // lies over the page.
    const sourcesToggle = await canvas.findByRole("button", { name: /^Quellen (aus|ein)klappen$/ });
    if (sourcesToggle.getAttribute("aria-expanded") !== "true") await userEvent.click(sourcesToggle);
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
    const section = q.getByRole("link", { name: TOPIC_SECTION }).getBoundingClientRect();
    const title = q.getByText(TOPIC_NAME).getBoundingClientRect();
    const gear = q.getByRole("button", { name: "Einstellungen des Themas" }).getBoundingClientRect();
    await expect(section.right).toBeLessThanOrEqual(title.left + EDGE_SLACK);
    await expect(title.right).toBeLessThanOrEqual(gear.left + EDGE_SLACK);

    const label = header.querySelector<HTMLElement>("[data-slot='app-shell-page-label']")!;
    await expect(label.tagName).toBe("DIV");
    // The bar's inset is the column gutter: the label starts that far from the
    // history column. Oracle: the token, read back from the CSSOM.
    const gutter = getComputedStyle(document.documentElement).getPropertyValue("--spacing-gutter").trim();
    await expect(gutter).toMatch(/^\d+(\.\d+)?px$/);
    await expect(label.getBoundingClientRect().left - history.right).toBeCloseTo(parseFloat(gutter), 0);
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
 * **A new chat in a topic** — the topic's start page once it has sources: the topic's name, the model, „1 Dokument · Stand …",
 * the description, then the composer and the suggested questions, centred
 * in the column (`ChatStage empty`), built from DS parts only.
 *
 * `play` oracles: the topic's name is the page's only `<h1>`, above the
 * composer, and the suggestions follow [ARIA `heading`, `textbox`; the
 * boxes; text]; the stage is in its empty state and the block — name to
 * suggestions — sits in the middle: the gap above the name equals the gap
 * between the composer's block and the disclaimer, within 1px
 * (`expectCentredStart`) [`data-empty`; the boxes].
 */
export const TopicNewChat: Story = {
  render: () => (
    <AppShellFixture context="topic" topic={TOPIC_NAME}>
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
 * **A new topic, no sources yet** — right after „Neues Thema": „Füge deine
 * erste Quelle hinzu" in the middle over the composer, „Noch kein Verlauf
 * vorhanden." in the history, and the sources card's list is a
 * `FileDropzone` (`emptyTopic`). The card stays open: adding the first
 * source is the one thing to do.
 *
 * `play` oracles [ARIA `heading`, `button`; text; the boxes]: the call is the
 * page's `<h1>`, centred with the composer as in `TopicNewChat`; the
 * history has no chat and says so; the card offers the dropzone (a button
 * that opens the file picker) and lists no source.
 */
export const TopicWithoutSources: Story = {
  render: () => (
    <AppShellFixture context="topic" topic={TOPIC_NAME} emptyTopic>
      <TopicNew />
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // At the 1280px test canvas the page beside the card would be under twice
    // the card, so the frame closes it (`AppShell`, rule 3); opened by hand it
    // lies over the page.
    const sourcesToggle = await canvas.findByRole("button", { name: /^Quellen (aus|ein)klappen$/ });
    if (sourcesToggle.getAttribute("aria-expanded") !== "true") await userEvent.click(sourcesToggle);
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

/* ======================================================================== */
/* Mechanism regressions, on the same fixture                               */
/* ======================================================================== */

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
  tags: CHECK_ONLY,
  render: () => (
    <AppShellFixture context="overview" bar={false}>
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

/**
 * Both states of the left column in one story, because the toggle is the
 * only way back: a click shows the 60px **rail**, a second click the full
 * column.
 */
export const WithCollapsibleColumns: Story = {
  tags: CHECK_ONLY,
  render: () => (
    <AppShellFixture context="overview" bar={false}>
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
  tags: CHECK_ONLY,
  render: () => (
    <AppShellFixture context="overview" bar={false}>
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
 * **The left column is draggable**, shown in the topic context (the
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
  tags: CHECK_ONLY,
  render: () => (
    <AppShellFixture context="topic">
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
  tags: CHECK_ONLY,
  render: () => (
    <AppShellFixture context="topic">
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
 * `AppChrome.tsx` for a user whose role may not see the sources: the
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
      context="topic"
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
      context="topic" topic={TOPIC_NAME}
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
      <TopicConversation />
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
      .getByRole("complementary", { name: "Verlauf" })
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
      context="topic" topic={TOPIC_NAME}
      status={
        <Alert tone="warning" layout="pill" live="polite" onDismiss={() => {}}>
          <AlertTitle>Hohe Auslastung</AlertTitle>
          <AlertDescription>Antworten können länger dauern.</AlertDescription>
        </Alert>
      }
    >
      <TopicConversation />
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
  tags: CHECK_ONLY,
  render: () => (
    <AppShellFixture
      context="topic" topic={TOPIC_NAME}
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
      <TopicConversation />
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
  tags: CHECK_ONLY,
  render: () => (
    <AppShellFixture
      context="topic" topic={TOPIC_NAME}
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
      <TopicConversation />
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
  tags: CHECK_ONLY,
  render: () => (
    <AppShellFixture
      context="topic" topic={TOPIC_NAME}
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
      <TopicConversation />
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
 * `AppShellSidePanel`: the page declares a tabbed panel beside itself — a
 * cited source next to the answer. It takes width from the main area; the
 * floating sources card stays over the main area, beside the panel. The
 * toggle hides the panel and keeps its tabs; closing the last tab hides it.
 */
export const TopicWithSidePanel: Story = {
  render: () => (
    <AppShellFixture context="topic">
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

/**
 * The frame's shrinking rules, in a 900px frame with the panel shown: the
 * left column shows as its rail by itself, the main area keeps 360px, the
 * panel its minimum — and the sources card lies over the page, which does
 * not move aside for it.
 */
export const SidePanelInNarrowFrame: Story = {
  tags: CHECK_ONLY,
  render: () => (
    <div style={{ width: 900 }}>
      <AppShellFixture context="topic">
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
