import * as React from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "../lib/utils";
import {
  MOBILE_PANE_STYLE,
  PANE_FILL,
  useIsDesktop,
  type MobilePaneTab,
} from "../lib/pane-layout";
import { useTitlebar } from "../lib/use-titlebar";
import { BottomTabBar } from "./bottom-tab-bar";
import { Button } from "./button";
import { ResizeHandle } from "./resize-handle";
import { SidePanel } from "./side-panel";
import { PANE_TOGGLE_CLASS, SIDE_PANEL_RAIL_WIDTH } from "./side-panel-variants";

/**
 * Default expanded width of a shell column, in px.
 *
 * 256 = 16rem = the `--width-sidebar` token at the 16px default root size,
 * i.e. exactly what the fixed sidebar column measured before 0.30.0, so a
 * shell that names no width does not move. It is a number and not the token
 * because `SidePanel.width` is consumer state carried as a number (inline
 * style, next to a drag-resize value) — reading a CSS variable back out of the
 * CSSOM to hand it to React would be a second source for one measurement.
 *
 * TODO: whether a *default* width belongs here at all — rather than making
 * `width` required — is a convenience decision for the shell only; not confirmed with the design-system owner.
 */
const DEFAULT_PANEL_WIDTH = 256;

/**
 * Smallest width of the left column while its header row is the window's
 * title bar AND holds the app's `titlebarControls`: room for the window
 * controls (`--titlebar-inset-start`, 100px), a brand of about 80px, two 28px
 * icon buttons and the 36px toggle, with their gaps. Below it the brand would
 * be clipped.
 */
const TITLEBAR_LEFT_MIN_WIDTH = 296;

/**
 * Makes a shell column drag-resizable (0.36.0). Present on an `AppShellPanel`,
 * `AppShell` renders a `ResizeHandle` on that column's content-facing edge —
 * the same widget a standalone pane uses, not a second mechanism.
 *
 * **One object, all-or-nothing, and that is the point.** As four loose
 * optionals („handle without bounds" — a separator whose `aria-valuemin` /
 * `-valuemax` are missing, i.e. an APG splitter that is not one) would be
 * expressible; here it cannot be. `width` stays separate because it exists
 * without resizing too (it has a default, these have none: bounds are the
 * app's decision).
 *
 * **No persistence here.** The consumer stores the number — see the note on
 * `AppShellPanel` — so this carries a callback and no storage key.
 */
export interface AppShellPanelResize {
  /** Smallest width the handle allows, in px (`aria-valuemin`, Home). */
  minWidth: number;
  /** Largest width the handle allows, in px (`aria-valuemax`, End). */
  maxWidth: number;
  /** Receives every clamped width — from the arrow keys and from the drag. */
  onWidthChange: (width: number) => void;
  /** Accessible name of the separator, e.g. „Breite der Navigation ändern". */
  label: string;
}

/**
 * One shell column: its content plus the controlled state it shares with the
 * consumer. Both columns have the identical shape, so they are one object type
 * rather than two flat prop lists.
 *
 * **Controlled, with no `defaultOpen`.** `isOpen` is the app's state — a
 * column width is exactly the kind of thing an app persists per user — and a
 * remembered value here would be a second truth next to it.
 */
export interface AppShellPanel {
  /** Column body: nav rows, a source list, whatever the column is for. */
  content: React.ReactNode;
  /**
   * Node in the column's `h-14` header row, inline with the collapse toggle
   * (`SidePanel.header`): a logo on the left column, a pane title on the
   * right. Unmounted while collapsed — the rail holds only the expand button
   * and `collapsedPreview`.
   */
  header?: React.ReactNode;
  /**
   * Pinned to the bottom of the column, below the scrolling `content` (a user
   * menu). Forwarded to `SidePanel.footer`, so it stays reachable in the
   * collapsed rail — a `SidebarUserMenu` there renders as its avatar alone.
   */
  footer?: React.ReactNode;
  /**
   * Accessible name of the column's `complementary` landmark. Required: a
   * shell can have two of them on screen, and unnamed landmarks cannot be told
   * apart.
   */
  label: string;
  /** Expanded (`true`) or collapsed to the rail (`false`). Consumer state. */
  isOpen: boolean;
  /** Collapse/expand was requested; carries the REQUESTED state. */
  onOpenChange: (isOpen: boolean) => void;
  /** Expanded width in px. Default 256 (= the `--width-sidebar` token). */
  width?: number;
  /**
   * Given, the column is drag-resizable: `AppShell` renders a `ResizeHandle`
   * on its content-facing edge (0.36.0). Omitted, there is no separator at
   * all — every call site written before this release is unchanged.
   *
   * The handle appears **only while the column is expanded** (the collapsed
   * rail is a fixed 60px, so a separator there would report a value with no
   * visible effect) and **only from
   * `lg` up** (below it the shell shows one area at a time; there is nothing
   * to resize a column against).
   */
  resize?: AppShellPanelResize;
  /** Accessible name of the expand button (collapsed state). */
  expandLabel: string;
  /** Accessible name of the collapse button (expanded state). */
  collapseLabel: string;
  /** Optional icon strip shown in the collapsed rail. */
  collapsedPreview?: React.ReactNode;
}

/**
 * Responsive application frame: an optional collapsible column on each side of
 * a main column that carries one chrome bar (`topBar`) above the page's one
 * `<main>`.
 *
 * ```
 * | left SidePanel        | main column                 | right SidePanel   |
 * | header: logo + toggle | topBar (h-14)               | header + toggle   |
 * | content … footer      | <main> scrolls on its own   | content … footer  |
 * ```
 *
 * **Both side columns are `SidePanel`** (0.30.0), with its own toggle, its own
 * rail and its `h-14` header row, which is why the two column headers and
 * `topBar` land on one baseline. The collapsed form **is** the 60px rail; a
 * shell that wants icons in it passes `collapsedPreview`. (The legacy 80px
 * `Sidebar` this frame rendered before 0.30.0 was removed in KI-846.)
 *
 * **Both columns are drag-resizable since 0.36.0** — opt-in, through
 * `AppShellPanel.resize`. Given, the shell composes `SidePanel` +
 * `ResizeHandle` per column; before 0.36.0 the shell had the panes but not the
 * handles, so an app on `AppShellLayout`
 * could not widen its nav column at all (JustRAG's KB screen, KI-94). Omitted,
 * nothing changes: no separator, no id on the `<aside>`, the 256px default.
 * The width itself stays the consumer's number — this package stores nothing.
 *
 * **Below `lg`: one area at a time plus a `BottomTabBar`**, chosen in JS
 * (`useIsDesktop`, `lib/pane-layout.ts`) for the reason given there: a shown
 * area is not a narrower version of itself — it
 * fills the screen, ignores the collapse state and must lose its collapse
 * control. The consumer declares which tab shows which area (`mobileTabs`) and
 * which tab is current; it writes no breakpoint check.
 *
 * **No drawer, no dialog, and therefore no focus management.** Until 0.29.0
 * the narrow-screen navigation was a Radix `Dialog`, which brought a focus
 * trap, Escape-to-close and a scroll lock *because it was an overlay*: content
 * behind a modal must not be reachable, and a modal needs a way out. The
 * tab-bar arrangement is not an overlay — the shown area **is** the page,
 * nothing is layered over anything, so there is no "behind" to trap focus away
 * from and no dismissal to bind Escape to. Removing the dialog removes all
 * three requirements rather than leaving them unimplemented; what stays is the
 * tab bar's own contract (a `navigation` landmark, exactly one
 * `aria-current="page"`).
 *
 * **Every node is mounted once.** The drawer rendered the *same* nav node a
 * second time, so a consumer's `id` inside it existed twice while the drawer
 * was open (JustRAG hit exactly this and documented it in `AppChrome.tsx`).
 * With the drawer gone there is one mount per node in every state — which is
 * also why `SidebarSurfaceContext`, the mechanism that told the two copies
 * apart, is deleted.
 *
 * **One `<main>` per arrangement, never two** — and when a side column is the
 * area on screen below `lg`, there is no `main` landmark at all: the main
 * column is not in the tree, and wrapping a `complementary` in `main` would be
 * a worse lie than its absence. A workspace screen (two side panes around the
 * main area) is this frame too, through `AppShellLayout` + `rightPanel`;
 * `mainLabel` and `showRight` (0.37.0) are the props that case needed. The
 * former `WorkspaceLayout` wrapper was removed in KI-846, so there is one
 * frame in this library, not two.
 * TODO: that a narrow screen showing a side column has no `main` landmark is a
 * consequence, not a confirmed decision with the design-system owner.
 *
 * TODO: below `lg` a shown column renders its `content` and its `footer` but
 * **not** its `header` — the header row exists to carry the collapse toggle
 * (which must be gone there) and the brand (which `topBar` already shows),
 * while the footer is typically the only route to sign-out. Reasoned from
 * those two facts, not confirmed with the design-system owner.
 *
 * **The collapsed rail keeps the footer** (0.30.0): `SidePanel` renders it
 * below the rail's scrolling strip, and publishes its collapsed state on
 * `SidebarCollapsedContext`, so a `SidebarUserMenu` there shrinks to its
 * avatar. Without both halves a collapsed column had no route to sign-out and
 * rendered full-width nav labels in 60px.
 */
export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Left column, usually the navigation. Omit it for a shell without one. */
  left?: AppShellPanel;
  /** Right column (sources, details, …). Omit it for a shell without one. */
  right?: AppShellPanel;
  /**
   * Keeps the right column out of the **desktop** arrangement without touching
   * its `isOpen` (default `true`). „Hidden is not collapsed" (0.37.0): an app
   * state that needs the horizontal space must not travel through the user's
   * collapse preference — hiding *by* collapsing leaves the column collapsed
   * once that state passes, which is the bug recorded for workspace screens
   * before this flag moved here in 0.37.0.
   *
   * **Ignored below `lg`**, deliberately: hiding buys horizontal space, and
   * one area on screen has none to win — a tab whose column refused to appear
   * would be a dead control. Omitting `right` is the other thing: then the
   * column does not exist at all, in either arrangement.
   *
   * TODO: that the flag is ignored below `lg` (a consumer reading only the
   * prop name could expect otherwise), and that there is no symmetric
   * `showLeft`, is reasoning carried over with the arrangement in 0.37.0 —
   * not confirmed with the design-system owner.
   */
  showRight?: boolean;
  /**
   * Content of the `h-14` chrome bar above `<main>`, in **both**
   * arrangements — the page-label/search/actions row on a wide screen, the
   * brand row on a narrow one. The frame owns the row's height (56px in every
   * state: consumers position overlays under that edge), the consumer owns
   * what is in it. Omitted entirely, no bar and no `banner` landmark render.
   */
  topBar?: React.ReactNode;
  /**
   * Accessible name of the shell's `<main>` landmark, in **both**
   * arrangements (0.37.0). Optional: a shell whose page content already names
   * itself needs no second name, and every call site written before this
   * release renders the unchanged `<main>`. A shell that is the whole page
   * passes it, because nothing above it contributes the page's `main`
   * landmark.
   */
  mainLabel?: string;
  /**
   * A system banner for everyone on every screen of the app — maintenance, an
   * outage, a service in test operation (typically an `Alert` with
   * `layout="banner"`). Rendered at the **top of the frame, full width** —
   * above the columns and above `topBar`, in **both** arrangements — and in
   * the flow: it pushes the whole frame down rather than covering anything.
   * A system state is about the app, not about one column or one area, so it
   * is not placed inside any of them (inside the main column it was narrower
   * on a workspace screen than on an overview, and read as a card in the
   * page). It never scrolls away.
   *
   * The slot is the frame's, the message is the app's: what it says, whether
   * it can be closed and where that is remembered stay with the consumer.
   * Omitted (or falsy), nothing renders — no landmark, no spacing.
   */
  notice?: React.ReactNode;
  /**
   * Accessible name of the `region` landmark around `notice`. Default
   * „Systemmeldung". Named because an unnamed `section` is no landmark, and
   * content outside every landmark is unreachable by landmark navigation.
   */
  noticeLabel?: string;
  /**
   * A small status message about reduced operation — high load, a degraded
   * service (typically an `Alert` with `layout="pill"`). It **floats** at the
   * top centre of the main area, over the page and without moving it, and
   * stays there while the page scrolls. Less prominent than `notice`, which is
   * for an outage or maintenance; the app picks one by severity.
   *
   * The message brings its own live-region role (`Alert live="polite"`), so
   * the slot adds no landmark. Omitted (or falsy), nothing renders.
   *
   * `statusPosition` moves it to the bottom end of the main area.
   */
  status?: React.ReactNode;
  /**
   * Where `status` floats. `top` (default): centred at the top of the main
   * area (`Alert layout="pill"`). `bottom-end`: a card in the bottom-right
   * corner of the main area, up to 24rem wide — full width on a narrow
   * screen, above the tab bar (`Alert layout="toast"`). Either way it covers
   * the page without moving it; the corner never reaches over a side column.
   */
  statusPosition?: "top" | "bottom-end";
  /**
   * Window-level controls for the title bar of a native shell — history
   * back/forward, typically. Rendered **only under a hidden title bar**
   * (`<html data-titlebar>`, Storybook „Native shell"), right after the
   * sidebar toggle: in the left column's header row while it is expanded, at
   * the start of the bar otherwise. On the web nothing renders — a browser
   * brings these controls itself.
   */
  titlebarControls?: React.ReactNode;
  /** Tabs of the narrow-screen bar, each declaring which area it shows. */
  mobileTabs: MobilePaneTab[];
  /**
   * Id of the current tab — the **single** input that decides which area is on
   * screen below `lg`. Any derivation the app needs (two tabs on one area, a
   * tab implied by other view state) stays in the app.
   */
  activeMobileTab: string;
  /** A tab was tapped. */
  onMobileTabChange: (id: string) => void;
  /** Accessible name of the tab bar's `navigation` landmark. */
  mobileTabBarLabel: string;
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      className,
      left,
      right,
      showRight = true,
      topBar,
      mainLabel,
      notice,
      noticeLabel = "Systemmeldung",
      status,
      statusPosition = "top",
      titlebarControls,
      mobileTabs,
      activeMobileTab,
      onMobileTabChange,
      mobileTabBarLabel,
      children,
      ...props
    },
    ref,
  ) => {
    const isDesktop = useIsDesktop();

    /*
      The main area's height, for the corner card's cap (see `cornerLayer`).
      Measured only while a corner card is shown; without ResizeObserver
      (jsdom) the card keeps its viewport-based fallback cap.
    */
    const mainRef = React.useRef<HTMLElement>(null);
    const [mainHeight, setMainHeight] = React.useState<number | null>(null);
    const measureMain = Boolean(status) && statusPosition === "bottom-end";
    React.useLayoutEffect(() => {
      const el = mainRef.current;
      if (!measureMain || !el || typeof ResizeObserver === "undefined") {
        setMainHeight(null);
        return;
      }
      const observer = new ResizeObserver(() => setMainHeight(el.clientHeight));
      observer.observe(el);
      setMainHeight(el.clientHeight);
      return () => observer.disconnect();
      // A narrow screen mounts a new <main> when its tab comes back.
    }, [measureMain, isDesktop, activeMobileTab]);

    /*
      Ids for the two columns, so a handle's `aria-controls` can name the
      column it resizes (APG splitter). Minted HERE and not inside `SidePanel`,
      because this component is the one place that
      composes column and handle, so it is the one place that knows both ends
      of the reference. The id lands on the pane ROOT (`SidePanel`'s `<aside>`,
      through its pass-through `id`) — the element carrying the inline width
      that `aria-valuenow` reports — not on the inner body region the collapse
      toggle points at: that reference is about visibility, this one about
      size.

      `useId` is called unconditionally (hooks rule) but the attribute is only
      *rendered* on a resizable column, so a shell without `resize` produces
      exactly the DOM it produced before 0.36.0.
    */
    const leftPaneId = React.useId();
    const rightPaneId = React.useId();

    /*
      Native shell with a hidden title bar (`<html data-titlebar>`): the
      frame's first row IS the window's title bar. The window controls sit in
      its top-left corner, so the one element there keeps clear of them — the
      left column's header row, else the bar — and a notice becomes the
      frame's last row instead of its first. On the web
      (`null`) nothing here applies.
    */
    const titlebar = useTitlebar() !== null;
    const noticeAtBottom = titlebar && Boolean(notice);
    const cornerOwner = !titlebar ? null : isDesktop && left ? "left" : "bar";
    // A collapsed left column does not reach into the title bar: the bar
    // spans the window's full width over the rail's top row and carries the
    // column's brand and its expand toggle.
    const besideRail = cornerOwner === "left" && !left?.isOpen;
    const [railToggleSlot, setRailToggleSlot] = React.useState<HTMLElement | null>(null);
    // The brand never leaves the window controls: while the column is
    // collapsed the bar carries the column's `header`, in the same place.
    const railBrand = besideRail && left?.header ? (
      <span data-slot="app-shell-brand" className="flex shrink-0 items-center gap-stack-sm">
        {left.header}
      </span>
    ) : null;
    const railToggle = besideRail && (
      <span
        ref={setRailToggleSlot}
        data-slot="app-shell-rail-toggle"
        className="flex shrink-0 items-center"
      />
    );
    // The row starts right after the window controls; in full screen, where
    // there are none, it keeps the 8px a header row has anyway.
    const overRail: React.CSSProperties | undefined = besideRail
      ? {
          marginLeft: -SIDE_PANEL_RAIL_WIDTH,
          paddingLeft: "max(0.5rem, var(--titlebar-inset-start))",
        }
      : undefined;
    // The app's window controls. While the left column is open they stand in
    // its header row, right-aligned beside the toggle; otherwise at the start
    // of the bar, after the toggle the bar then carries.
    const controlsInLeft = cornerOwner === "left" && !besideRail;
    const controls = titlebar && titlebarControls ? (
      <span
        data-slot="app-shell-titlebar-controls"
        // Compact, whatever the app hangs in: the title row is tight, and the
        // buttons stand beside the brand, not as actions of their own.
        className={cn(
          "flex shrink-0 items-center [&>button]:size-7 [&>button]:p-0 [&>button_svg]:size-[18px]",
          // In the column's header row they stand at its far end, beside the
          // toggle; the brand keeps the start to itself.
          controlsInLeft && "ml-auto",
        )}
      >
        {titlebarControls}
      </span>
    ) : null;
    // Window controls, brand, the app's controls and the toggle have to fit
    // the header row, so the column is at least this wide while it holds them.
    // The floor is the separator's too: its bounds and its value are what the
    // column really measures, so a drag below the floor reports the floor and
    // `aria-valuenow` never leaves `aria-valuemin`…`-max`.
    const leftFloor = left && controlsInLeft && controls ? TITLEBAR_LEFT_MIN_WIDTH : 0;
    const leftWidth = Math.max(left?.width ?? DEFAULT_PANEL_WIDTH, leftFloor);

    /*
      Under a hidden title bar the right column is not a column: it floats
      over the main area as a card below the bar, and its toggle is the last
      control of the title row — the window's top-right corner. It takes no
      width, so it has no rail and no resize handle; closed, it is hidden but
      stays mounted, like a collapsed column's body.
    */
    const floatRight = titlebar && isDesktop && right && showRight ? right : null;
    const RightIcon = floatRight?.isOpen ? PanelRightClose : PanelRightOpen;
    const rightToggle = floatRight ? (
      <span data-slot="app-shell-right-toggle" className="flex shrink-0 items-center pr-2">
        <Button
          variant="ghost"
          size="icon"
          className={PANE_TOGGLE_CLASS}
          aria-label={floatRight.isOpen ? floatRight.collapseLabel : floatRight.expandLabel}
          aria-expanded={floatRight.isOpen}
          aria-controls={rightPaneId}
          onClick={() => floatRight.onOpenChange(!floatRight.isOpen)}
        >
          <RightIcon aria-hidden />
        </Button>
      </span>
    ) : null;
    const rightBubble = floatRight ? (
      <aside
        id={rightPaneId}
        aria-label={floatRight.label}
        hidden={!floatRight.isOpen}
        data-slot="app-shell-bubble"
        className={cn(
          "absolute top-14 right-2 z-20 max-h-[calc(100%-4rem)] max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-[var(--ui-radius-box)] border border-outline-variant bg-surface-container-lowest shadow-overlay",
          floatRight.isOpen ? "flex" : "hidden",
        )}
        style={{ width: floatRight.width ?? DEFAULT_PANEL_WIDTH }}
      >
        {floatRight.header && (
          <div className="flex h-12 shrink-0 items-center gap-stack-sm px-4">{floatRight.header}</div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{floatRight.content}</div>
        {floatRight.footer && <div className="shrink-0">{floatRight.footer}</div>}
      </aside>
    ) : null;

    /*
      The chrome bar. `h-14` is on the row itself and not derived from its
      contents, so the bar is 56px tall whatever is hung into it — the same
      chrome unit as a `SidePanel` header row, and a published geometry
      contract outside this repo (JustRAG's `Toast.css`: `top: 68px` = 56 + 12).
    */
    const bar = topBar ? (
      <header
        data-app-region="drag"
        data-titlebar-inset={cornerOwner === "bar" || besideRail ? "start" : undefined}
        className={cn(
          "flex h-14 shrink-0 items-center",
          cornerOwner === "bar" && "pl-(--titlebar-inset-start)",
          (besideRail || (controls && cornerOwner === "bar")) && "gap-1.5",
          besideRail && "relative z-10 bg-canvas",
        )}
        style={overRail}
      >
        {railBrand}
        {railToggle}
        {!controlsInLeft && controls}
        {topBar}
        {rightToggle}
      </header>
    ) : cornerOwner === "bar" || besideRail || (controls && !controlsInLeft) || rightToggle ? (
      // No bar: an empty title-bar row carries what the title bar has to —
      // the room for the window controls, the toggles, the app's controls —
      // and drags the window.
      <div
        data-slot="app-shell-titlebar"
        data-app-region="drag"
        data-titlebar-inset={cornerOwner === "bar" || besideRail ? "top" : undefined}
        className={cn(
          "flex h-14 shrink-0 items-center gap-1.5",
          cornerOwner === "bar" && "pl-(--titlebar-inset-start)",
          besideRail && "relative z-10 bg-canvas",
        )}
        style={overRail}
      >
        {railBrand}
        {railToggle}
        {!controlsInLeft && controls}
        <span className="flex-1" />
        {rightToggle}
      </div>
    ) : null;

    /*
      The notice region, the frame's first row. No inset of its own: the
      banner is chrome edge to edge (`Alert layout="banner"` brings its own
      padding), not a card in the page. `shrink-0` keeps a long page from
      squeezing it.
    */
    const noticeRegion = notice ? (
      <section
        aria-label={noticeLabel}
        data-slot="app-shell-notice"
        data-app-region={titlebar ? undefined : "drag"}
        className="shrink-0"
      >
        {notice}
      </section>
    ) : null;

    /*
      The floating status layer, the first child of `<main>`: `sticky` keeps it
      at the top of the main area while the page scrolls, `h-0` lets it take
      no room (the message overflows it downwards), so the page under it
      neither moves nor reflows. The layer lets clicks through; the message
      itself takes them; a long message wraps at 48rem instead of spanning a
      wide column. Keeping the slot in front of `children` — null or not —
      never remounts the page.
    */
    const statusLayer = status && statusPosition === "top" ? (
      <div
        data-slot="app-shell-status"
        data-position="top"
        className="pointer-events-none sticky top-3 z-20 flex h-0 shrink-0 justify-center overflow-visible px-4"
      >
        <div className="pointer-events-auto h-fit max-w-[min(100%,48rem)]">{status}</div>
      </div>
    ) : null;

    /*
      The corner layer, a row of no height right under `<main>`: the card hangs
      from its top edge upwards (`bottom-full`), so it sits on the main area's
      bottom edge whatever is below — the frame's edge on a desktop, the tab
      bar on a narrow screen — and needs no knowledge of either's height. Not
      inside `<main>`, which scrolls: there an absolute box would scroll away
      with the page. The layer lets clicks through to the page; only the card
      takes them.

      The card's holder is capped at the main area's own height (measured, so
      a banner that wraps or a zoomed bar shrink it too) less the 16px insets,
      and scrolls beyond that, so its title and close button stay reachable on
      a short screen. The holder is the scroller, so it takes the card's
      radius and overlay shadow itself: the card's own shadow is clipped by
      the scroller, the holder's is not.
    */
    const cornerLayer = status && statusPosition === "bottom-end" ? (
      <div
        data-slot="app-shell-status"
        data-position="bottom-end"
        className="pointer-events-none relative z-20 h-0 shrink-0"
      >
        <div className="absolute inset-x-0 bottom-full flex justify-end p-4">
          <div
            data-slot="app-shell-status-scroller"
            className="pointer-events-auto max-h-[calc(100dvh-9.25rem)] w-full overflow-y-auto rounded-[var(--ui-radius-box)] shadow-overlay sm:max-w-sm"
            style={mainHeight != null ? { maxHeight: Math.max(mainHeight - 32, 0) } : undefined}
          >
            {status}
          </div>
        </div>
      </div>
    ) : null;

    /*
      A column, as the desktop arrangement renders it. `content` scrolls and
      `footer` is pinned under it — both are `SidePanel`'s own slots since
      0.30.0, so the footer also survives into the collapsed rail instead of
      disappearing with the hidden body. `content` stays mounted while
      collapsed, so scroll position and half-typed input survive.
    */
    const column = (panel: AppShellPanel, side: "left" | "right", paneId: string) => (
      <SidePanel
        // Only on a resizable column — see the id comment above.
        id={panel.resize ? paneId : undefined}
        side={side}
        isOpen={panel.isOpen}
        width={side === "left" ? leftWidth : (panel.width ?? DEFAULT_PANEL_WIDTH)}
        onExpand={() => panel.onOpenChange(true)}
        onCollapse={() => panel.onOpenChange(false)}
        expandLabel={panel.expandLabel}
        collapseLabel={panel.collapseLabel}
        header={
          side === "left" && controlsInLeft && controls ? (
            <>
              {panel.header}
              {controls}
            </>
          ) : (
            panel.header
          )
        }
        collapsedPreview={panel.collapsedPreview}
        footer={panel.footer}
        titlebarInset={side === "left" && cornerOwner === "left"}
        railToggleContainer={side === "left" && besideRail ? railToggleSlot : undefined}
        aria-label={panel.label}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{panel.content}</div>
      </SidePanel>
    );

    /*
      The column's separator, or nothing. Two gates: no `resize` contract → the column is not resizable at all, and a
      collapsed column is the fixed-width rail, where a separator would report
      a value nothing responds to. The third gate — „not below `lg`" — is the
      arrangement itself: the narrow branch below returns before this is
      called.

      `value` reads the same `panel.width ?? DEFAULT_PANEL_WIDTH` the column
      does, so `aria-valuenow` and the inline width are one number and not two.
    */
    const handle = (panel: AppShellPanel, side: "left" | "right", paneId: string) =>
      panel.resize && panel.isOpen ? (
        <ResizeHandle
          side={side}
          value={side === "left" ? leftWidth : (panel.width ?? DEFAULT_PANEL_WIDTH)}
          min={side === "left" ? Math.max(panel.resize.minWidth, leftFloor) : panel.resize.minWidth}
          max={side === "left" ? Math.max(panel.resize.maxWidth, leftFloor) : panel.resize.maxWidth}
          label={panel.resize.label}
          controls={paneId}
          onValueChange={panel.resize.onWidthChange}
        />
      ) : null;

    if (!isDesktop) {
      // One lookup in the consumer's own table — not a derivation: the app
      // decides which tab is active, the table says which area that tab shows.
      // A tab pointing at a column this shell does not have (and an id that is
      // in no tab at all) falls back to the main area rather than to a blank
      // screen.
      const activePane = mobileTabs.find((tab) => tab.id === activeMobileTab)?.pane;
      const panel =
        activePane === "left" ? left : activePane === "right" ? right : undefined;
      const paneStyle = noticeAtBottom ? undefined : MOBILE_PANE_STYLE;

      return (
        <div
          ref={ref}
          className={cn(
            "flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-on-surface",
            className,
          )}
          {...props}
        >
          {!titlebar && noticeRegion}
          {bar}
          {panel ? (
            <aside
              aria-label={panel.label}
              className="flex min-h-0 min-w-0 flex-1 flex-col bg-sidebar"
              style={paneStyle}
            >
              <div className="min-h-0 flex-1 overflow-y-auto">{panel.content}</div>
              {panel.footer && <div className="shrink-0">{panel.footer}</div>}
            </aside>
          ) : (
            <main ref={mainRef} aria-label={mainLabel} className={PANE_FILL} style={paneStyle}>
              {statusLayer}
              {children}
            </main>
          )}
          {/* With the main area only: a side column has the screen to itself. */}
          {!panel && cornerLayer}
          {/* Under a hidden title bar the notice is the last row, above the
              tab bar: it takes over the room the area reserves for the bar. */}
          {noticeAtBottom && (
            <div data-slot="app-shell-notice-row" className="shrink-0" style={MOBILE_PANE_STYLE}>
              {noticeRegion}
            </div>
          )}
          <BottomTabBar
            items={mobileTabs}
            activeId={activeMobileTab}
            onChange={onMobileTabChange}
            label={mobileTabBarLabel}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          // `h-dvh`, not `min-h-dvh`: the columns are full-height flex children
          // and `<main>` scrolls inside the frame, so the frame has to HAVE a
          // height. With `min-h-dvh` the heights inside resolve against the
          // content, and a long page would push the columns past the viewport
          // instead of scrolling the main area.
          //
          // A column (`flex-col`) of two rows: the notice region, then the
          // row of columns. The row is there with or without a notice, so a
          // notice appearing or going away never remounts the columns (their
          // scroll positions, a half-typed message).
          //
          // `bg-window` is the canvas on the web and transparent in a native
          // shell, where the side panels let the OS material through; the
          // main column paints the canvas itself for that case.
          "flex h-dvh flex-col overflow-hidden bg-window text-on-surface",
          className,
        )}
        {...props}
      >
        {!titlebar && noticeRegion}
        <div data-slot="app-shell-row" className="flex min-h-0 flex-1">
          {/* Column, then its separator: the handle sits on the edge that faces
              the content, which is the right edge of a left column and the left
              edge of a right one — carried by DOM order, so tab order matches
              the visual one. */}
          {left && (
            <>
              {column(left, "left", leftPaneId)}
              {handle(left, "left", leftPaneId)}
            </>
          )}
          {/* `app-shell-content`: the bar plus `<main>` — the region a
              page-sized dialog covers (`SettingsDialog` `fitTo`). */}
          <div data-slot="app-shell-content" className={cn("flex min-w-0 flex-1 flex-col bg-canvas", floatRight && "relative")}>
            {bar}
            <main ref={mainRef} aria-label={mainLabel} className={PANE_FILL}>
              {statusLayer}
              {children}
            </main>
            {cornerLayer}
            {rightBubble}
          </div>
          {/* `showRight` gates the DESKTOP arrangement only — see the prop. */}
          {right && showRight && !floatRight && (
            <>
              {handle(right, "right", rightPaneId)}
              {column(right, "right", rightPaneId)}
            </>
          )}
        </div>
        {/* Under a hidden title bar the first row is the window's title bar,
            so the notice is the frame's last row instead: full width, in the
            flow, never scrolling away. */}
        {noticeAtBottom && noticeRegion}
      </div>
    );
  },
);
AppShell.displayName = "AppShell";

export { AppShell };
