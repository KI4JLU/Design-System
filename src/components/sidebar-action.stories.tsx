import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageSquare, Plus } from "lucide-react";
import { expect } from "storybook/test";
import { Kbd } from "./kbd";
import { SidebarAction } from "./sidebar-action";
import { SidebarCard, SidebarCardList } from "./sidebar-card";

/**
 * A side column's primary action, shown where it lives: above the column's
 * cards, in a 320px column.
 */
const meta = {
  title: "Components/Navigation/SidebarAction",
  component: SidebarAction,
  parameters: { layout: "padded" },
  args: { icon: <Plus />, children: "Neuer Chat", type: "button" },
  render: (args) => (
    <div className="flex w-80 flex-col gap-2 p-2">
      <SidebarAction {...args} />
      <SidebarCardList>
        <SidebarCard icon={<MessageSquare />} title="Fragen zur Anmeldung" onOpen={() => {}} />
        <SidebarCard icon={<MessageSquare />} title="Fristen im Wintersemester" onOpen={() => {}} />
      </SidebarCardList>
    </div>
  ),
} satisfies Meta<typeof SidebarAction>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Left edge of the first `svg` inside an element. */
const iconLeft = (el: Element) => el.querySelector("svg")!.getBoundingClientRect().left;

/**
 * **The action row** — a flat, full-width row, not a filled button.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. its icon starts on the same vertical line as the cards' icons below —
 *    the shared 10px row inset; the action's icon is 18px and a card's 16px,
 *    so their centres differ by 1px [the icons' boxes against each other];
 * 2. it is as wide as the list [the boxes].
 */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const action = canvas.getByRole("button", { name: "Neuer Chat" });
    const card = canvasElement.querySelector("[data-slot='sidebar-card']")!;
    await expect(iconLeft(action)).toBeCloseTo(iconLeft(card), 1);
    await expect(action.getBoundingClientRect().width).toBeCloseTo(
      canvas.getByRole("list").getBoundingClientRect().width,
      0,
    );
  },
};

/**
 * **With `trailing`**: a shortcut hint at the row's end. A long label
 * truncates before it instead of pushing it out.
 *
 * `play` oracles: the label is clipped, not wrapped [scroll vs. client
 * width]; the hint lies inside the row, after the label [the boxes].
 */
export const WithShortcut: Story = {
  args: {
    children: "Neuen Chat in diesem Thema beginnen",
    trailing: <Kbd>⌘ K</Kbd>,
  },
  play: async ({ canvas, canvasElement }) => {
    const action = canvas.getByRole("button", { name: /Neuen Chat/ });
    const label = canvas.getByText("Neuen Chat in diesem Thema beginnen");
    const hint = canvasElement.querySelector("[data-slot='sidebar-action-trailing']")!;
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
      hint.getBoundingClientRect().left,
    );
    await expect(hint.getBoundingClientRect().right).toBeLessThanOrEqual(
      action.getBoundingClientRect().right,
    );
  },
};
