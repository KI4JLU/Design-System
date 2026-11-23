import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageSquare } from "lucide-react";
import { expect, waitFor } from "storybook/test";
import { SidebarCard, SidebarCardList } from "./sidebar-card";
import { SidebarScrollArea } from "./sidebar-scroll-area";

/**
 * The scrolling part of a side column under its fixed head — the chat
 * history, the source list. `SidebarPanel` uses it for its list; on its own
 * it is for a column with a head of its own. Two things set it apart from a
 * plain `overflow-y: auto`:
 * - the content **fades out at an edge with more to scroll** (a CSS mask,
 *   `data-scroll-fade="top" | "bottom" | "top bottom"`), instead of a hard crop;
 * - the scrollbar sits in the **right gutter**, so the rows are as wide with a
 *   scrollbar as without one.
 */
const meta = {
  title: "Components/Navigation/SidebarScrollArea",
  component: SidebarScrollArea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SidebarScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const chats = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, title: `Chat ${i + 1}: Fristen und Anmeldung` }));

/**
 * A 260px column, 240px high. The area keeps the default 16px `gutter` — room
 * for a classic scrollbar (15–17px on Windows) — so the column has no right
 * padding of its own.
 */
function Column({ count, testId }: { count: number; testId: string }) {
  return (
    <div className="flex h-60 w-[260px] flex-col rounded-[var(--ui-radius-box)] border border-outline-variant bg-surface py-2 pl-2">
      <SidebarScrollArea data-testid={testId}>
        <SidebarCardList>
          {chats(count).map((chat) => (
            <SidebarCard key={chat.id} icon={<MessageSquare />} title={chat.title} onOpen={() => {}} />
          ))}
        </SidebarCardList>
      </SidebarScrollArea>
    </div>
  );
}

const area = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid='${id}']`)!;

/**
 * A long history beside a short one. `play` oracles [the DOM; the boxes]:
 * - the short list does not scroll and fades nowhere;
 * - the long list fades at the bottom only at the top, at both edges in the
 *   middle, at the top only at the end;
 * - the gutter: each list's right padding plus its scrollbar's width is the
 *   16px `gutter` — the bar takes the padding's place instead of the rows'
 *   width — and the rows of both lists are equally wide. (The test browser
 *   hides scrollbars, so both bars are 0 there; on Windows the long list's
 *   bar takes ~15px of the 16 and its padding drops to ~1.)
 */
export const FadesAndGutter: Story = {
  render: () => (
    <div className="flex gap-6">
      <Column count={3} testId="short" />
      <Column count={30} testId="long" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const short = area(canvasElement, "short");
    const long = area(canvasElement, "long");
    await expect(short.scrollHeight).toBeLessThanOrEqual(short.clientHeight);
    await expect(short.dataset.scrollFade).toBeUndefined();

    await waitFor(() => expect(long.dataset.scrollFade).toBe("bottom"));
    long.scrollTop = (long.scrollHeight - long.clientHeight) / 2;
    await waitFor(() => expect(long.dataset.scrollFade).toBe("top bottom"));
    long.scrollTop = long.scrollHeight;
    await waitFor(() => expect(long.dataset.scrollFade).toBe("top"));

    for (const el of [short, long]) {
      const bar = el.offsetWidth - el.clientWidth;
      await expect(parseFloat(getComputedStyle(el).paddingRight) + bar).toBe(16);
    }
    const rowWidth = (el: HTMLElement) => el.querySelector("li")!.getBoundingClientRect().width;
    await expect(rowWidth(long)).toBe(rowWidth(short));
  },
};
