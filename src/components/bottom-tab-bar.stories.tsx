import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { FolderOpen, History, MessageSquare, Sparkles } from "lucide-react";
import { BottomTabBar, type BottomTabBarItem } from "./bottom-tab-bar";

const ITEMS: BottomTabBarItem[] = [
  { id: "history", icon: <History />, label: "Verlauf" },
  { id: "chat", icon: <MessageSquare />, label: "Chat" },
  { id: "assistant", icon: <Sparkles />, label: "Assistent" },
  { id: "files", icon: <FolderOpen />, label: "Quellen" },
];

const meta = {
  title: "Components/Navigation/BottomTabBar",
  component: BottomTabBar,
  args: {
    items: ITEMS,
    activeId: "chat",
    label: "Bereichswechsel",
    onChange: () => {},
  },
  argTypes: {
    items: { control: false },
    onChange: { control: false },
  },
} satisfies Meta<typeof BottomTabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Phone-sized frame: the bar is `fixed` by default, so a story pins it to its
 *  own frame with the layout-only `absolute` override. */
const Phone = ({ activeId, children }: { activeId: string; children: ReactNode }) => (
  <div className="relative mx-auto h-140 w-90 overflow-hidden rounded-xl border border-outline-variant bg-surface">
    <div className="flex h-full items-center justify-center pb-15 font-body-base text-body-base text-on-surface-variant">
      {activeId}
    </div>
    {children}
  </div>
);

const Interactive = () => {
  const [activeId, setActiveId] = useState("chat");
  return (
    <Phone activeId={activeId}>
      <BottomTabBar
        items={ITEMS}
        activeId={activeId}
        onChange={setActiveId}
        label="Bereichswechsel"
        className="absolute"
      />
    </Phone>
  );
};

/**
 * The mobile area switch: a `<nav>` landmark, N tabs of icon + label, the
 * active one carries `aria-current="page"`. Which area belongs to an id is
 * the consumer's decision.
 */
export const Playground: Story = {
  render: () => <Interactive />,
};

/** Two tabs — the bar distributes them evenly, whatever their number. */
export const TwoTabs: Story = {
  args: { items: ITEMS.slice(0, 2), activeId: "history" },
  render: (args) => (
    <Phone activeId={args.activeId}>
      <BottomTabBar {...args} className="absolute" />
    </Phone>
  ),
};
