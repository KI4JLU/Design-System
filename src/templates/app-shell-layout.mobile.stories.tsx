import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayoutGrid, Menu } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { Logo } from "../components/logo";
import { AppShellFixture } from "../test/fixtures/app-shell";
import { MeinWissen } from "../test/fixtures/mein-wissen";
import { TOPIC_NAME, TopicConversation } from "../test/fixtures/topic-chat";

/* ---------------------------------------------------------------------------
 * The mobile shell: `AppShellLayout` below `md` (768px). The same component
 * as on a wide screen — it picks the narrow arrangement itself (JavaScript,
 * `useIsDesktop`), so the app writes no breakpoint check and nothing is
 * mounted twice. Every story is pinned to a 390px phone viewport.
 *
 * No `play` assertions, on purpose: the arrangement follows the real viewport
 * (`matchMedia`), and the Storybook test run renders every story in a 1280px
 * window. The narrow arrangement is asserted in `app-shell-layout.test.tsx`
 * (jsdom, stubbed viewport): drawer, sheet, focus, one `<main>`.
 * ------------------------------------------------------------------------- */

const PHONE = {
  viewport: {
    options: { phone: { name: "Phone", styles: { width: "390px", height: "844px" } } },
  },
};

const meta = {
  title: "Templates/Mobile Shell",
  component: AppShellLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", controls: { disable: true }, ...PHONE },
  globals: { viewport: { value: "phone" } },
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
 * **The overview on a phone** — „Mein Wissen" fills the screen; the
 * navigation is a drawer from the left edge, opened by the toggle at the
 * start of the bar. The column's collapse state is not read here.
 */
export const Overview: Story = {
  render: () => (
    <AppShellFixture context="overview" bar={false}>
      <MeinWissen />
    </AppShellFixture>
  ),
};

/**
 * **A topic on a phone** — the bar with the breadcrumb and the gear, the chat
 * as the page. The history is a drawer from the left (toggle at the start of
 * the bar), the sources a `BottomSheet` (toggle at its end).
 */
export const Topic: Story = {
  render: () => (
    <AppShellFixture context="topic" topic={TOPIC_NAME}>
      <TopicConversation />
    </AppShellFixture>
  ),
};
