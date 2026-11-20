import type { Meta, StoryObj } from "@storybook/react-vite";
import { Compass, Home, MessageSquare, Plus, Users } from "lucide-react";
import { expect } from "storybook/test";
import { NavItem } from "./nav-item";
import { SidebarAction } from "./sidebar-action";
import { SidebarCard, SidebarCardList } from "./sidebar-card";
import { SidebarPanel } from "./sidebar-panel";

/**
 * The body of a side column. Apps get it inside `AppShellLayout`'s columns
 * (`nav`, `rightPanel.content`); here it stands alone in a fixed 320 × 480
 * box, so the list has more rows than room and has to scroll.
 */
const meta = {
  title: "Components/Navigation/SidebarPanel",
  component: SidebarPanel,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="h-[480px] w-80 overflow-hidden rounded-[var(--ui-radius-box)] border border-outline-variant bg-surface-container-lowest">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SidebarPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const CHATS = [
  "Zusammenfassung der Modulbeschreibungen",
  "Fragen zur Anmeldung",
  "Fristen im Wintersemester",
  "Anerkennung von Studienleistungen",
  "Prüfungsordnung § 12 erklärt",
  "Wahlpflichtmodule im Master",
  "Rücktritt von einer Prüfung",
  "Praktikum im Ausland",
  "Abschlussarbeit anmelden",
  "Nachteilsausgleich beantragen",
  "Teilzeitstudium",
  "Beurlaubung und Fristen",
];

function ChatList() {
  return (
    <SidebarCardList>
      {CHATS.map((title, i) => (
        <SidebarCard
          key={title}
          icon={<MessageSquare />}
          title={title}
          onOpen={() => {}}
          active={i === 0}
        />
      ))}
    </SidebarCardList>
  );
}

const scroller = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>("[data-slot='sidebar-panel'] > :last-child")!;

/**
 * **A history column** — JLURAG's `HistoryPanel.tsx`: the primary action as
 * `head`, the list's label as `title`, the chats as `SidebarCard`s.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the label is a level-2 heading and sits between the action and the list
 *    [ARIA `heading`; the layout boxes];
 * 2. the list overflows its box, and scrolling it moves the list only — the
 *    action and the label stay where they are [scroll metrics; the boxes
 *    before and after a scroll].
 */
export const HistoryColumn: Story = {
  args: {
    title: "Verlauf",
    head: (
      <SidebarAction type="button" icon={<Plus />}>
        Neuer Chat
      </SidebarAction>
    ),
    children: <ChatList />,
  },
  play: async ({ canvas, canvasElement }) => {
    const action = canvas.getByRole("button", { name: "Neuer Chat" });
    const heading = canvas.getByRole("heading", { level: 2, name: "Verlauf" });
    const list = canvas.getByRole("list");
    await expect(action.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      heading.getBoundingClientRect().top,
    );
    await expect(heading.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      list.getBoundingClientRect().top + 1,
    );

    const area = scroller(canvasElement);
    await expect(area.scrollHeight).toBeGreaterThan(area.clientHeight);
    const actionTop = action.getBoundingClientRect().top;
    const headingTop = heading.getBoundingClientRect().top;
    const listTop = list.getBoundingClientRect().top;
    area.scrollTop = 120;
    await expect(area.scrollTop).toBeGreaterThan(0);
    await expect(action.getBoundingClientRect().top).toBe(actionTop);
    await expect(heading.getBoundingClientRect().top).toBe(headingTop);
    await expect(list.getBoundingClientRect().top).toBeLessThan(listTop);
    area.scrollTop = 0;
  },
};

/**
 * **Navigation and a list in one column**: `nav` rows stay put between the
 * head and the list, which alone scrolls — page navigation above, content
 * below.
 *
 * `play` oracle: after a scroll the nav rows have not moved and the list has
 * [the boxes before and after].
 */
export const NavAndList: Story = {
  args: {
    title: "Verlauf",
    nav: (
      <>
        <NavItem type="button" label="Mein Wissen" active>
          <Home size={20} aria-hidden="true" />
          <span>Mein Wissen</span>
        </NavItem>
        <NavItem type="button" label="Geteiltes Wissen">
          <Users size={20} aria-hidden="true" />
          <span>Geteiltes Wissen</span>
        </NavItem>
        <NavItem type="button" label="Entdecken">
          <Compass size={20} aria-hidden="true" />
          <span>Entdecken</span>
        </NavItem>
      </>
    ),
    children: <ChatList />,
  },
  play: async ({ canvas, canvasElement }) => {
    const navRow = canvas.getByRole("button", { name: "Entdecken" });
    const list = canvas.getByRole("list");
    const navTop = navRow.getBoundingClientRect().top;
    const listTop = list.getBoundingClientRect().top;

    const area = scroller(canvasElement);
    area.scrollTop = 120;
    await expect(navRow.getBoundingClientRect().top).toBe(navTop);
    await expect(list.getBoundingClientRect().top).toBeLessThan(listTop);
    area.scrollTop = 0;
  },
};

/**
 * **Without `title`, `head` and `nav`** the panel renders no head at all: the
 * list starts on the column's top inset, the line the rail's first entry
 * sits on when the column collapses.
 *
 * `play` oracle: no head element and no heading [the DOM; ARIA].
 */
export const ListOnly: Story = {
  args: { children: <ChatList /> },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector("[data-slot='sidebar-panel-head']")).toBeNull();
    await expect(canvas.queryByRole("heading")).toBeNull();
  },
};
