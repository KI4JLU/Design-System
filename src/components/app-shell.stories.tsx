import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell, type AppShellPanel } from "./app-shell";
import { Card } from "./card";
import { Container } from "./container";
import { Logo } from "./logo";
import { NavItem } from "./nav-item";
import { PageHeader } from "./page-header";
import { SIDE_PANEL_RAIL_WIDTH } from "./side-panel-variants";
import type { MobilePaneTab } from "../lib/pane-layout";

const TABS: MobilePaneTab[] = [
  { id: "nav", icon: <Home />, label: "Bereiche", pane: "left" },
  { id: "page", icon: <LayoutDashboard />, label: "Seite", pane: "main" },
  { id: "sources", icon: <FileText />, label: "Quellen", pane: "right" },
];

const meta = {
  title: "Internals/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "**Internal — not exported since 0.93.0.** The frame `AppShellLayout` " +
          "(Templates) is built on: its columns, bar and tabs. Apps use " +
          "`AppShellLayout`; this page documents the frame for work on the DS itself.",
      },
    },
  },
  // Base args only for the props table: every story renders through `render`
  // with its own state, because the collapsed state and the active tab live
  // with the consumer and can only exist as local state in Storybook.
  args: {
    mobileTabs: TABS,
    activeMobileTab: "page",
    onMobileTabChange: () => {},
    mobileTabBarLabel: "Bereichswechsel",
  },
  argTypes: {
    left: { control: false },
    right: { control: false },
    mobileTabs: { control: false },
    onMobileTabChange: { control: false },
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const brand = <Logo product="App" size="sm" />;

const navRows = (
  <nav aria-label="Hauptnavigation" className="flex flex-col gap-2 p-4">
    <NavItem label="Übersicht" active>
      <LayoutDashboard width="1em" height="1em" aria-hidden />
      <span>Übersicht</span>
    </NavItem>
    <NavItem label="Team">
      <Users width="1em" height="1em" aria-hidden />
      <span>Team</span>
    </NavItem>
    <NavItem label="Einstellungen">
      <Settings width="1em" height="1em" aria-hidden />
      <span>Einstellungen</span>
    </NavItem>
  </nav>
);

const collapsedPreview = (
  <>
    <LayoutDashboard className="h-5 w-5 text-on-surface-variant" aria-hidden />
    <Sparkles className="h-5 w-5 text-on-surface-variant" aria-hidden />
  </>
);

/**
 * The state of both columns lives — as in an app — outside the shell. Here it
 * is local story state instead of a context or `localStorage`.
 */
function Frame() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("page");

  const left: AppShellPanel = {
    content: navRows,
    header: brand,
    footer: (
      <div className="p-4 text-body-sm text-on-surface-variant">Jamie Lee</div>
    ),
    label: "Hauptnavigation",
    isOpen: leftOpen,
    onOpenChange: setLeftOpen,
    expandLabel: "Navigation ausklappen",
    collapseLabel: "Navigation einklappen",
    collapsedPreview,
  };

  const right: AppShellPanel = {
    content: (
      <div className="flex flex-col gap-stack-md p-gutter">
        <Card className="p-4">Quelle 1</Card>
        <Card className="p-4">Quelle 2</Card>
      </div>
    ),
    header: <span className="truncate font-title-md">Quellen</span>,
    label: "Quellen",
    isOpen: rightOpen,
    onOpenChange: setRightOpen,
    expandLabel: "Quellen ausklappen",
    collapseLabel: "Quellen einklappen",
  };

  return (
    <AppShell
      left={left}
      right={right}
      topBar={
        <Container className="flex items-center gap-4">
          <p className="m-0 font-headline-md text-headline-md font-bold text-on-surface">
            Übersicht
          </p>
        </Container>
      }
      mobileTabs={TABS}
      activeMobileTab={activeTab}
      onMobileTabChange={setActiveTab}
      mobileTabBarLabel="Bereichswechsel"
    >
      <Container className="py-gutter md:py-margin-page">
        <PageHeader title="Übersicht" description="Hauptbereich — Inhalt kommt von der Seite." />
        <Card className="mt-gutter p-6">Seiteninhalt</Card>
      </Container>
    </AppShell>
  );
}

/**
 * **The one reference story of the primitive** (KI-847): the frame with no
 * template around it — `SidePanel` left | main column with a free-form
 * `topBar` | `SidePanel` right. It is here to show what `AppShell` itself
 * owns; every page context, and every mechanism regression of the full app
 * chrome, is a story of `Templates/AppShellLayout`, which composes this frame
 * (an app uses that template and never builds the frame by hand).
 *
 * Both columns collapse to the 60px rail independently; the left column's
 * header row, the main column's bar and the right column's header row are
 * each 56px high and on one line. Below `lg` the same shell shows **one**
 * area plus the `BottomTabBar` — visible by making the window narrower than
 * 1024px; the narrow arrangement is asserted in `app-shell.test.tsx` (jsdom,
 * stubbed viewport), because the Storybook runner renders at 1280px.
 *
 * Until KI-847 this file held four stories. `ThreeColumns` and
 * `ColumnsCollapsed` are the two halves of this story's `play`;
 * `WithoutRightColumn` is `app-shell.test.tsx` → „renders no right column and
 * no rail when `right` is omitted"; `Mobile` was a visual control without
 * assertions — `Templates/AppShellLayout` → `Mobile` is that control now.
 */
export const Reference: Story = {
  render: () => <Frame />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Oracle: the layout boxes Chromium's engine returns — no class names.
    // Order and side-by-side placement are the sketch's claim; in jsdom
    // (0×0 boxes) the same check would be worthless.
    const left = await canvas.findByRole("complementary", { name: "Hauptnavigation" });
    const right = await canvas.findByRole("complementary", { name: "Quellen" });
    const main = canvasElement.querySelector("main")!;
    // The chrome row is found structurally, not via `banner`: `PageHeader` in
    // the page content renders a `<header>` too, and aria-query (behind
    // `getByRole`) still maps a `<header>` **inside** `<main>` to `banner`,
    // while axe-core uses the current scope `article, aside, main, nav,
    // section` for it and doesn't count it as a landmark (checked in
    // `node_modules/axe-core`, `landmarkHasBodyContextMatches`). The first
    // `<header>` in the tree is the shell's row.
    const bar = canvasElement.querySelector("header") as HTMLElement;

    const l = left.getBoundingClientRect();
    const m = main.getBoundingClientRect();
    const r = right.getBoundingClientRect();
    await expect(l.right).toBeLessThanOrEqual(m.left + 1);
    // The right pane floats over the page as a card, inside main's box.
    await expect(r.left).toBeGreaterThan(m.left);
    await expect(r.right).toBeLessThanOrEqual(m.right);

    // One chrome unit: the row above the content is 56px tall and sits on the
    // top edge of both columns.
    await expect(bar.getBoundingClientRect().height).toBe(56);
    await expect(Math.round(bar.getBoundingClientRect().top)).toBe(Math.round(l.top));
    await expect(Math.round(r.top)).toBe(Math.round(bar.getBoundingClientRect().bottom));

    // Both columns collapsed: two 60px rails (`SIDE_PANEL_RAIL_WIDTH`), the
    // left one with `collapsedPreview` icons. **The collapsed form is the
    // rail** — there is no icon navigation mode any more (developer decision,
    // 2026-09-17). Until KI-847 this was the story `ColumnsCollapsed`, which
    // started collapsed; here it is reached through the two toggles.
    await userEvent.click(await canvas.findByRole("button", { name: "Navigation einklappen" }));
    await userEvent.click(await canvas.findByRole("button", { name: "Quellen einklappen" }));
    // Oracle: the exported design constant — no literal 60 here.
    const rail = await canvas.findByRole("complementary", { name: "Hauptnavigation" });
    await expect(rail.getBoundingClientRect().width).toBe(SIDE_PANEL_RAIL_WIDTH);
    // The closed card is hidden, with no rail of its own.
    await expect(canvas.queryByRole("complementary", { name: "Quellen" })).toBeNull();
    await expect(await canvas.findByRole("button", { name: "Quellen ausklappen" })).toBeVisible();
    // Only the way back is reachable; the header rows are cleared away.
    await expect(
      await canvas.findByRole("button", { name: "Navigation ausklappen" }),
    ).toBeVisible();
    await expect(canvas.queryByRole("navigation", { name: "Hauptnavigation" })).toBeNull();
  },
};
