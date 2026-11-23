import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { GridLayout } from "./grid-layout";
import { MeinWissen } from "../test/fixtures/mein-wissen";
import { TopicCard } from "../test/fixtures/topic-card";
import { TOPICS } from "../test/fixtures/topics";

/* ---------------------------------------------------------------------------
 * `GridLayout` with sample content from JustRAG's „Mein Wissen": filters at
 * the start of the toolbar, the „Karten / Liste" switch and „Neues Thema" at
 * its end, then the favourites row („Favoriten" over „Weitere Themen") of
 * hairline accent cards, or rows. The cards are the `topic-card` fixture,
 * built from DS parts.
 * ------------------------------------------------------------------------- */

const meta = {
  title: "Templates/GridLayout",
  component: GridLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { label: "Mein Wissen" },
} satisfies Meta<typeof GridLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const cells = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>("[data-slot='grid-layout-grid'] > *")];

/**
 * **„Mein Wissen" as cards**, and the switch to the list.
 *
 * `play` (Chromium, 1280px), oracles in brackets:
 * 1. one named region with the page's `<h1>` [ARIA `region`, `heading`];
 * 2. the toolbar: filters at its start edge, the view switch and „Neues
 *    Thema" at its end edge [the layout boxes];
 * 3. the cards fill more than one column, each at least 17.5rem wide, and
 *    in each group's grid every row is as tall as the tallest
 *    (`uniformRows`) [the boxes; the rem from the CSSOM];
 * 4. „Liste" turns the page into one column of rows under the column labels
 *    [`data-view`; the rows' boxes; the header text]; „Karten" turns it back,
 *    so the story settles on the cards it is named for.
 */
export const Cards: Story = {
  render: () => <MeinWissen />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const region = canvas.getByRole("region", { name: "Mein Wissen" });
    await expect(within(region).getByRole("heading", { level: 1, name: "Mein Wissen" })).toBeVisible();

    const toolbar = canvasElement.querySelector<HTMLElement>("[data-slot='grid-layout-toolbar']")!.getBoundingClientRect();
    const filters = canvas.getByRole("group", { name: "Themen filtern" }).getBoundingClientRect();
    const create = canvas.getByRole("button", { name: "Neues Thema" }).getBoundingClientRect();
    await expect(filters.left).toBeCloseTo(toolbar.left, 0);
    await expect(create.right).toBeCloseTo(toolbar.right, 0);
    // The toolbar's icons are 16px (`size-4`) — an
    // unsized lucide icon would be 24px [the icons' boxes].
    for (const name of ["Karten", "Liste", "Neues Thema"]) {
      const icon = canvas.getByRole("button", { name }).querySelector("svg")!.getBoundingClientRect();
      await expect([name, icon.width]).toEqual([name, 16]);
    }

    const boxes = cells(canvasElement).map((c) => c.getBoundingClientRect());
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(new Set(boxes.map((b) => Math.round(b.left))).size).toBeGreaterThan(1);
    for (const b of boxes) await expect(b.width).toBeGreaterThanOrEqual(17.5 * rem);
    const grids = [...canvasElement.querySelectorAll<HTMLElement>("[data-slot='grid-layout-grid']")];
    await expect(grids).toHaveLength(2); // the favourites row and the rest
    for (const grid of grids) {
      const heights = [...grid.children].map((c) => Math.round(c.getBoundingClientRect().height));
      await expect(new Set(heights).size).toBe(1);
    }

    await userEvent.click(canvas.getByRole("button", { name: "Liste" }));
    await waitFor(() => expect(region).toHaveAttribute("data-view", "list"));
    const rows = cells(canvasElement).map((c) => c.getBoundingClientRect());
    await expect(new Set(rows.map((b) => Math.round(b.left))).size).toBe(1);
    await expect(new Set(rows.map((b) => Math.round(b.width))).size).toBe(1);
    await expect(within(region).getByText("Zuletzt aktiv")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Karten" }));
    await waitFor(() => expect(region).toHaveAttribute("data-view", "cards"));
  },
};

/**
 * **A narrow page** (480px): the toolbar has no room for the filters and the
 * actions on one line, so the actions wrap below — the filters are not
 * squeezed, and nothing sticks out of the page.
 *
 * `play` (Chromium), oracles in brackets: the filters keep at least 20rem or
 * the row's whole width [the boxes; the rem from the CSSOM]; the actions start
 * below the filters and end inside the toolbar [the boxes]; the page does not
 * scroll sideways [scroll vs. client width].
 */
export const NarrowToolbar: Story = {
  render: () => (
    <div data-slot="narrow" className="w-[480px] overflow-hidden">
      <MeinWissen />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector<HTMLElement>("[data-slot='grid-layout-toolbar']")!.getBoundingClientRect();
    const filters = canvasElement.querySelector<HTMLElement>("[data-slot='grid-layout-filters']")!.getBoundingClientRect();
    const actions = canvasElement.querySelector<HTMLElement>("[data-slot='grid-layout-actions']")!.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(filters.width).toBeGreaterThanOrEqual(Math.min(toolbar.width, 20 * rem) - 1);
    await expect(actions.top).toBeGreaterThanOrEqual(filters.bottom);
    await expect(actions.right).toBeLessThanOrEqual(toolbar.right + 0.5);
    await expect(actions.left).toBeGreaterThanOrEqual(toolbar.left - 0.5);
    const narrow = canvasElement.querySelector<HTMLElement>("[data-slot='narrow']")!;
    await expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
  },
};

/**
 * **The list.** One column at every width, rows closer together than cards,
 * the column labels right above the first row.
 *
 * `play` oracles: one column [the boxes]; the gap between rows is the
 * `--spacing-stack-sm` token, read back from the CSSOM [computed `row-gap`];
 * the labels sit above the first row [the boxes].
 */
export const ListView: Story = {
  name: "List",
  render: () => <MeinWissen initialView="list" />,
  play: async ({ canvas, canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>("[data-slot='grid-layout-grid']")!;
    const token = getComputedStyle(document.documentElement).getPropertyValue("--spacing-stack-sm").trim();
    await expect(getComputedStyle(grid).rowGap).toBe(token);
    const rows = cells(canvasElement).map((c) => c.getBoundingClientRect());
    await expect(new Set(rows.map((b) => Math.round(b.left))).size).toBe(1);
    const header = canvas.getByText("Quellen").getBoundingClientRect();
    await expect(header.bottom).toBeLessThanOrEqual(rows[0].top);
  },
};

/**
 * **With favourites**: two groups under small headings, „Favoriten" first.
 * The headings exist only because there are two groups.
 *
 * `play` oracles: two level-2 headings, in order [ARIA `heading`]; the second
 * group starts below the first [the boxes]; the „Favoriten" chip leaves only
 * the favourites — one grid, no group heading — and „Alle" brings the rest
 * back [the cells; ARIA].
 */
export const WithFavorites: Story = {
  render: () => <MeinWissen withFavorites />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const headings = canvas.getAllByRole("heading", { level: 2 });
    await expect(headings.map((h) => h.textContent)).toEqual(["Favoriten", "Weitere Themen"]);
    const grids = [...canvasElement.querySelectorAll("[data-slot='grid-layout-grid']")];
    await expect(grids).toHaveLength(2);
    await expect(grids[1].getBoundingClientRect().top).toBeGreaterThan(grids[0].getBoundingClientRect().bottom);

    const chips = within(canvas.getByRole("group", { name: "Themen filtern" }));
    await userEvent.click(chips.getByRole("button", { name: "Favoriten" }));
    await waitFor(() => expect(cells(canvasElement)).toHaveLength(TOPICS.filter((t) => t.favorite).length));
    await expect(canvas.queryByRole("heading", { level: 2 })).toBeNull();
    await userEvent.click(chips.getByRole("button", { name: "Alle" }));
    await waitFor(() => expect(cells(canvasElement)).toHaveLength(TOPICS.length));
  },
};

/**
 * **Only one group has cells** — every topic is a favourite: no group
 * heading, since it would only repeat the page's title.
 *
 * `play` oracle: no level-2 heading, one grid [ARIA; the DOM].
 */
export const OneGroupNoHeadings: Story = {
  render: () => <MeinWissen withFavorites topics={TOPICS.map((t) => ({ ...t, favorite: true }))} />,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.queryByRole("heading", { level: 2 })).toBeNull();
    await expect(canvasElement.querySelectorAll("[data-slot='grid-layout-grid']")).toHaveLength(1);
  },
};

/**
 * **No topics**: the empty state takes the grid's place; header and toolbar
 * stay, so „Neues Thema" is where it always is.
 *
 * `play` oracles: the empty state is shown, no grid is rendered, the toolbar
 * is still there [the text; the DOM; ARIA].
 */
export const Empty: Story = {
  render: () => <MeinWissen topics={[]} />,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText("Noch keine eigenen Themen")).toBeVisible();
    await expect(canvasElement.querySelector("[data-slot='grid-layout-grid']")).toBeNull();
    await expect(canvas.getByRole("button", { name: "Karten" })).toBeVisible();
  },
};

/**
 * **The topic card in its states** — the hairline card of the `topic-card`
 * fixture: with and without a category, a favourite, a name too
 * long for the line, a topic shared by someone else, a public one.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. at rest the activity shows and the description is hidden; with the
 *    focus inside the card — the keyboard twin of the pointer — they swap
 *    [computed `opacity`];
 * 2. the long name is one line, cut [scroll vs. client width].
 */
export const TopicCards: Story = {
  render: () => (
    <div className="grid w-[1080px] grid-cols-3 gap-6 p-6">
      {TOPICS.map((t) => (
        <TopicCard key={t.id} topic={t} />
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>("[data-topic='mhb']")!;
    const description = card.querySelector<HTMLElement>("[data-slot='topic-description']")!;
    await expect(Number(getComputedStyle(description).opacity)).toBe(0);
    // CSS `:hover` follows the real pointer only, so the swap is checked
    // through its twin rule: the focus inside the card (the keyboard path).
    within(card).getByRole("button", { name: /Thema öffnen/ }).focus();
    await waitFor(() => expect(Number(getComputedStyle(description).opacity)).toBe(1), { timeout: 2000 });
    (document.activeElement as HTMLElement).blur();

    const long = canvas.getByRole("button", { name: /^Thema öffnen: Richtlinien zur Sicherung/ });
    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
  },
};
