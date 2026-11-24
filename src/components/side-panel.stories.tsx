import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect } from "storybook/test";
import { FileText, History, MessageSquare } from "lucide-react";
import { SidePanel } from "./side-panel";

const meta = {
  title: "Primitives/SidePanel",
  component: SidePanel,
  args: {
    side: "left",
    isOpen: true,
    width: 320,
    expandLabel: "Verlauf ausklappen",
    collapseLabel: "Verlauf einklappen",
    onExpand: () => {},
    onCollapse: () => {},
    children: null,
  },
  argTypes: {
    onExpand: { control: false },
    onCollapse: { control: false },
    header: { control: false },
    collapsedPreview: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof SidePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const entries = ["Zulassungsfristen", "Prüfungsordnung", "Bibliothek", "Mensa"];

const panelBody = (
  <ul className="flex min-h-0 flex-1 flex-col gap-stack-sm overflow-y-auto px-gutter py-stack-md">
    {entries.map((entry) => (
      <li
        key={entry}
        className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 font-body-base text-body-base text-on-surface"
      >
        {entry}
      </li>
    ))}
  </ul>
);

/**
 * Title node for the `header` slot. `truncate` sits on the consumer's node,
 * not in the frame: the slot is `min-w-0`, and the application has to decide
 * whether its title truncates, wraps or doesn't shrink at all.
 */
const paneTitle = (text: string) => (
  <h2 className="truncate font-body-base text-body-base text-on-surface">{text}</h2>
);

const preview = (
  <>
    <History className="h-5 w-5 text-on-surface-variant" aria-hidden />
    <MessageSquare className="h-5 w-5 text-on-surface-variant" aria-hidden />
    <FileText className="h-5 w-5 text-on-surface-variant" aria-hidden />
  </>
);

/** Frame with a page-like neighbour, so the border edge is visible. */
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="flex h-120 overflow-hidden rounded-xl border border-outline-variant bg-surface">
    {children}
  </div>
);

const Interactive = ({
  side,
  title = "Verlauf",
}: {
  side: "left" | "right";
  title?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const panel = (
    <SidePanel
      side={side}
      isOpen={isOpen}
      width={320}
      onExpand={() => setIsOpen(true)}
      onCollapse={() => setIsOpen(false)}
      expandLabel="Verlauf ausklappen"
      collapseLabel="Verlauf einklappen"
      header={paneTitle(title)}
      collapsedPreview={preview}
      aria-label="Verlauf"
    >
      {panelBody}
    </SidePanel>
  );
  const content = (
    <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
      Seiteninhalt
    </div>
  );
  return (
    <Frame>
      {side === "left" ? panel : content}
      {side === "left" ? content : panel}
    </Frame>
  );
};

/**
 * Controlled: `isOpen` and `width` live with the consumer. The collapse button
 * belongs to the frame — in the collapsed state it is the only control. On the
 * left it sits at the **trailing** edge, i.e. the one facing the content;
 * `header` fills the rest of the row.
 */
export const Playground: Story = {
  render: () => <Interactive side="left" />,
};

/**
 * Right panel: border and chevron mirror via `side` — and the toggle moves
 * along. It sits **before** the `header`, again at the edge facing the
 * content, so the two header rows of a view with two panels mirror each other
 * toward the middle.
 */
export const RightSide: Story = {
  render: () => <Interactive side="right" />,
};

/**
 * Long title: the `header` slot is `min-w-0`, so a `truncate` node shortens
 * with an ellipsis instead of pushing the toggle out of the row. The row is
 * `h-16` tall in both directions — the same chrome unit as the
 * `AppShellLayout` bar, so the header rows line up.
 */
export const LongHeaderTitle: Story = {
  render: () => (
    <Interactive
      side="left"
      title="Gesprächsverlauf zur Prüfungsordnung des Fachbereichs 07"
    />
  ),
};

/**
 * Collapsed: a 60px rail with the expand button and an optional
 * `collapsedPreview`. The content stays mounted but hidden — scroll position
 * and half-typed input survive collapsing. The `header`, on the other hand, is
 * **not rendered at all**: the rail has room for exactly one control (here
 * with `header` set, and it is still missing).
 */
export const Collapsed: Story = {
  args: {
    isOpen: false,
    header: paneTitle("Verlauf"),
    collapsedPreview: preview,
    children: panelBody,
  },
  render: (args) => (
    <Frame>
      <SidePanel {...args} aria-label="Verlauf" />
      <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
        Seiteninhalt
      </div>
    </Frame>
  ),
};

/** Without `collapsedPreview`, only the expand button stays in the rail. */
export const CollapsedWithoutPreview: Story = {
  args: { isOpen: false, children: panelBody },
  render: (args) => (
    <Frame>
      <SidePanel {...args} aria-label="Verlauf" />
      <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
        Seiteninhalt
      </div>
    </Frame>
  ),
};

/**
 * **Header-row geometry.** The row is inset `px-2` (8px), like the `p-2` body
 * `AppShellLayout` gives its navigation, and the toggle is a 36px ghost square
 * (20px icon) with a 4px gap to the edge it sits on — so its right edge is
 * 12px from the column's edge, where the ⋯ menus of the `p-2` body's rows end
 * (8px body padding + the row's 4px end inset).
 *
 * **The oracle is the body control's rectangle, not a number in the test.**
 * The body here is a `p-2` box whose 36px control carries the row's `mr-1`
 * end inset; the `play` function compares both right edges in the same
 * browser layout. The button's width (36px) and the row's padding (8px) are
 * also pinned as numbers, because otherwise two measures moved together would
 * look valid.
 */
export const ToggleAlignsWithBodyControl: Story = {
  args: {
    header: paneTitle("Verlauf"),
    children: (
      <div className="p-2">
        <div className="flex">
          <button className="mr-1 ml-auto size-9" data-testid="body-control" />
        </div>
      </div>
    ),
  },
  render: (args) => (
    <Frame>
      <SidePanel {...args} aria-label="Verlauf" />
      <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
        Seiteninhalt
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const toggle = await canvas.findByRole("button", { name: "Verlauf einklappen" });
    const bodyControl = await canvas.findByTestId("body-control");
    await expect(Math.abs(toggle.getBoundingClientRect().right - bodyControl.getBoundingClientRect().right)).toBeLessThan(1);
    await expect(toggle.getBoundingClientRect().width).toBeCloseTo(36, 0);
    // The toggle's parent node IS the header row — `SidePanel` renders it
    // directly into the `h-14` row.
    const headerRow = toggle.parentElement as HTMLElement;
    await expect(getComputedStyle(headerRow).paddingLeft).toBe("8px");
  },
};
