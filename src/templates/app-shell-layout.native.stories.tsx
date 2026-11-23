import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { LayoutGrid, Menu } from "lucide-react";
import { AppShellLayout } from "./app-shell-layout";
import { Alert, AlertDescription } from "../components/alert";
import { Logo } from "../components/logo";
import { AppShellFixture, TOPIC_SECTION } from "../test/fixtures/app-shell";
import {
  NativeShellHost,
  OWN_IFRAME_IN_DOCS,
  SidePanelDemo,
  alphaOf,
  bar,
  expectPanelBesideCard,
  historyControls,
  nativeLogo,
} from "../test/fixtures/app-shell-stories";
import { MeinWissen } from "../test/fixtures/mein-wissen";
import { TOPIC_NAME, TopicConversation } from "../test/fixtures/topic-chat";

/* ---------------------------------------------------------------------------
 * The native shell: the same `AppShellLayout` JustRAG renders on the web, in
 * the desktop app's window. The host sets `data-shell="native"` and
 * `data-titlebar` on `<html>`; the frame arranges itself from them — there is
 * no second layout, and the app never asks which platform it is on. These
 * stories stand in for the host (`NativeShellHost`); the page „Native shell"
 * (`src/docs/NativeShell.mdx`) is their docs page and the host's setup guide.
 * ------------------------------------------------------------------------- */

const meta = {
  title: "Native shell",
  component: AppShellLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen", controls: { disable: true } },
  // Required props only; every story renders the fixture, which owns the slots.
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
 * A native shell (`<html data-shell="native" data-titlebar="inset">`): the
 * frame and the side column paint nothing, so the window's material shows,
 * the main column the opaque canvas. The column's header row starts after the
 * window controls and the top row drags the window. See „Native shell".
 */
export const Overview: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture
        context="overview" bar={false}
        titlebarControls={historyControls}
        logo={nativeLogo}
      >
        <MeinWissen />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement }) => {
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
    // …on one line with the controls, at the frame's top; the overview has no
    // chrome bar, so the page itself starts on that line too.
    const rowBox = headerRow.getBoundingClientRect();
    await expect(rowBox.top).toBeCloseTo(frame.getBoundingClientRect().top, 0);
    await expect(canvasElement.querySelector("[data-slot='app-shell-titlebar']")).toBeNull();
    await expect(content.getBoundingClientRect().top).toBeCloseTo(rowBox.top, 0);
    await expect((controls.top + controls.bottom) / 2).toBeCloseTo((rowBox.top + rowBox.bottom) / 2, 0);

    // Labels in the column are not selectable; it is the navigation.
    await expect(getComputedStyle(column).userSelect).toBe("none");

    // The row drags the window, its button does not.
    const region = (el: Element) => getComputedStyle(el).getPropertyValue("-webkit-app-region");
    await expect(region(headerRow)).toBe("drag");
    await expect(region(toggle)).toBe("no-drag");
  },
};

/**
 * Full screen (`data-titlebar="hidden"`): the window controls are gone, so
 * the brand stands at the column's left edge, on the line of the rows below
 * it, as on the web. The arrangement of the row stays.
 */
export const FullScreen: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost titlebar="hidden">
      <AppShellFixture
        context="overview" bar={false}
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
 * The overview collapsed in a native shell — JustRAG's overview has no chrome
 * bar, so the title bar is the shell's empty title-bar row: it holds the
 * column's toggle after the window controls and drags the window; the rail
 * starts below it and the page beside it.
 */
export const OverviewCollapsed: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture context="overview" bar={false} leftOpen={false} titlebarControls={historyControls} logo={nativeLogo}>
        <MeinWissen />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement }) => {
    const row = canvasElement.querySelector<HTMLElement>("[data-slot='app-shell-titlebar']");
    await expect(row).not.toBeNull();
    const rowBox = row!.getBoundingClientRect();
    const controls = canvasElement.querySelector("[data-slot='window-controls']")!.getBoundingClientRect();
    const toggle = await within(row!).findByRole("button", { name: "Navigation ausklappen" });
    const toggleBox = toggle.getBoundingClientRect();
    // The toggle stands after the window controls, on their centre line.
    await expect(toggleBox.left).toBeGreaterThanOrEqual(controls.right);
    await expect((toggleBox.top + toggleBox.bottom) / 2).toBeCloseTo((controls.top + controls.bottom) / 2, 0);
    // The rail's own content starts below the row.
    const column = canvas.getByRole("complementary", { name: "Hauptnavigation" });
    const firstIcon = column.querySelector("a, button") as HTMLElement;
    await expect(firstIcon.getBoundingClientRect().top).toBeGreaterThanOrEqual(rowBox.bottom);
    // The row drags the window; its button does not.
    const region = (el: Element) => getComputedStyle(el).getPropertyValue("-webkit-app-region");
    await expect(region(row!)).toBe("drag");
    await expect(region(toggle)).toBe("no-drag");
  },
};

/**
 * A collapsed column does not reach into the title bar: the bar spans the
 * window's full width and carries the column's toggle where it stands while
 * expanded; the rail starts below. In the topic view, where JustRAG has a bar:
 * after the toggle the app's back / forward, then the breadcrumb.
 */
export const TopicCollapsed: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture
        context="topic" topic={TOPIC_NAME}
        leftOpen={false}
        titlebarControls={historyControls}
        logo={nativeLogo}
      >
        <TopicConversation />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement }) => {
    const header = bar(canvasElement);
    const toggle = await within(header).findByRole("button", { name: "Verlauf ausklappen" });
    const expand = toggle.getBoundingClientRect();
    const controls = canvasElement
      .querySelector("[data-slot='window-controls']")!
      .getBoundingClientRect();
    const headerBox = header.getBoundingClientRect();
    const column = canvas.getByRole("complementary", { name: "Verlauf" });
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
    const breadcrumb = within(header).getByRole("link", { name: TOPIC_SECTION });
    await expect(breadcrumb.getBoundingClientRect().left).toBeGreaterThan(forward.right);
  },
};

/**
 * In a native shell with the window controls inset (`data-titlebar="inset"`)
 * the right column floats as it does on the web: a card over the main area,
 * below the bar, opened by the last control of the title row.
 */
export const Topic: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture
        context="topic" topic={TOPIC_NAME}
        titlebarControls={historyControls}
        logo={nativeLogo}
      >
        <TopicConversation />
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
export const WithNotice: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture
        context="topic" topic={TOPIC_NAME}
        titlebarControls={historyControls}
        logo={nativeLogo}
        notice={
          <Alert tone="info" layout="banner" live="polite">
            <AlertDescription>Dieses Angebot befindet sich im Testbetrieb.</AlertDescription>
          </Alert>
        }
      >
        <TopicConversation />
      </AppShellFixture>
    </NativeShellHost>
  ),
  play: async ({ canvas, canvasElement }) => {
    const region = await canvas.findByRole("region", { name: "Systemmeldung" });
    const notice = region.getBoundingClientRect();
    const frame = region.parentElement!.getBoundingClientRect();
    const header = bar(canvasElement).getBoundingClientRect();
    const column = canvas.getByRole("complementary", { name: "Verlauf" }).getBoundingClientRect();
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

/** The same panel in a native shell: opaque, its strip part of the title bar. */
export const TopicWithSidePanel: Story = {
  parameters: OWN_IFRAME_IN_DOCS,
  render: () => (
    <NativeShellHost>
      <AppShellFixture context="topic" topic={TOPIC_NAME} titlebarControls={historyControls} logo={<Logo product="RAG" size="sm" />}>
        <TopicConversation />
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
