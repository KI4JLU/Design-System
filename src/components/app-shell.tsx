import * as React from "react";
import { createPortal } from "react-dom";
import { Lock, Maximize2, Minimize2, PanelLeftClose, PanelRightClose, PanelRightOpen, Plus, SquareMenu, TextAlignStart, X } from "lucide-react";
import { cn } from "../lib/utils";
import { PANE_FILL, useIsDesktop, type MobilePaneTab, type PaneId } from "../lib/pane-layout";
import { useTitlebar } from "../lib/use-titlebar";
import { Button } from "./button";
import { BottomSheet } from "./bottom-sheet";
import { Drawer, DrawerContent, DrawerTitle } from "./drawer";
import { Kbd, KbdGroup } from "./kbd";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { ResizeHandle } from "./resize-handle";
import { SidePanel } from "./side-panel";
import { SidebarCollapsedContext } from "./sidebar-context";
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
 * What the main area keeps beside an `AppShellSidePanel`, in px: below it a
 * chat's composer no longer fits. The frame's shrinking rules follow from it,
 * in this order as the frame narrows:
 *
 *  1. The side panel gives way first: it is at most 70% of the frame and at
 *     most what leaves the main area this width, but never below its own
 *     minimum.
 *  2. Then the left column collapses to its rail, for as long as it would
 *     otherwise take the main area below this width. The consumer's
 *     `isOpen` is not touched; the column comes back with the room.
 *  3. The floating card stops asking the page to keep clear of it
 *     (`--app-shell-bubble-inset`) once that would leave the page less than
 *     this width: it then simply lies over the page's end.
 */
const MAIN_MIN_WIDTH = 360;
/** Largest share of the frame's width a side panel takes. */
const SIDE_PANEL_MAX_FRACTION = 0.7;
/** A side panel's smallest width when it names none (no `resize`). */
const SIDE_PANEL_MIN_WIDTH = 360;

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
   * The column's primary action below `md` (left column only) — „Neuer
   * Chat". There the column is a drawer, and this stands in its bottom row,
   * at the end, with `footer` beside it in its collapsed form (a user menu
   * as its avatar): the place a thumb reaches. On a wide screen it is not
   * rendered; the action is part of `content` there, and `content` leaves it
   * out below `md` so it does not show twice.
   */
  narrowAction?: React.ReactNode;
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
  /**
   * Icon of the toggle that shows and hides the column while it floats as a
   * card (hidden title bar, right column only): it says what the card holds.
   * Default: a neutral list icon. Not the sidebar icons (`PanelRight…`) —
   * those stand for a column of the frame, which the card is not; the open
   * state is the button's tint, not a second icon.
   */
  toggleIcon?: React.ReactNode;
  /**
   * Tooltip of that toggle (hover and keyboard focus): what the card is, and
   * — with `locked` — why it cannot be opened. Omitted, there is no tooltip.
   */
  toggleTooltip?: React.ReactNode;
  /**
   * The floating card exists but this user may not open it (right column
   * only). The toggle stays in the bar so the place does not jump between
   * users: dimmed, `aria-disabled`, with a small lock on hover and focus; it
   * stays focusable so the tooltip that says why is reachable by keyboard.
   * No card is rendered and `content` is ignored — below `md` too, where a
   * tab that points at the pane shows the main area instead. `description` is the
   * reason for assistive technology (the toggle's `aria-describedby`); show
   * the same words in `toggleTooltip`.
   */
  locked?: { description: string };
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
   *
   * **Left column only.** From `lg` up the right column floats as a card and
   * takes no width in the row, so it has no separator; its `width` sizes the card.
   *
   * **Left column only**: the floating right card has no rail.
   */
  resize?: AppShellPanelResize;
  /** Accessible name of the expand button (collapsed state). */
  expandLabel: string;
  /** Accessible name of the collapse button (expanded state). */
  collapseLabel: string;
  /**
   * **Floating right card only.** Accessible name of a close button in the
   * card's top end corner, e.g. „Quellen schließen" — distinct from
   * `collapseLabel`, the toggle's name in the bar. Omitted, the card has no
   * button of its own and closes from the toggle.
   */
  closeLabel?: string;
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
 * **Below `md`: the page, with drawers over it**, chosen in JS
 * (`useIsDesktop`, `lib/pane-layout.ts`) for the reason given there: an area
 * shown there is not a narrower version of itself. The page stays on screen;
 * the left column is a drawer from the left edge, opened by a toggle at the
 * start of the bar; the right card is a `BottomSheet`; a shown
 * `AppShellSidePanel` fills the frame. There is no tab bar (until 0.83.0
 * there was one, and one area at a time): the toggles stay in the bar, as on
 * a wide screen. What is open is still the consumer's `activeMobileTab` — one
 * id, mapped to an area by `mobileTabs` — so the app writes no breakpoint
 * check.
 *
 * **The drawers are overlays, and bring an overlay's contract**: the page
 * behind is inert, Escape and the scrim close them, the focus returns to what
 * opened them. Each node is still mounted once: a column's content is in the
 * drawer below `md` and in the column from `md` up, never in both.
 *
 * **One `<main>`, in every arrangement.** A workspace screen (two side panes
 * around the main area) is this frame too, through `AppShellLayout` +
 * `rightPanel`; `mainLabel` and `showRight` (0.37.0) are the props that case
 * needed.
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
   * **Ignored below `md`**, deliberately: hiding buys horizontal space, and
   * one area on screen has none to win — a tab whose column refused to appear
   * would be a dead control. Omitting `right` is the other thing: then the
   * column does not exist at all, in either arrangement.
   *
   * TODO: that the flag is ignored below `md` (a consumer reading only the
   * prop name could expect otherwise), and that there is no symmetric
   * `showLeft`, is reasoning carried over with the arrangement in 0.37.0 —
   * not confirmed with the design-system owner.
   */
  showRight?: boolean;
  /**
   * The floating right card's toggle is the bar's last control. By default it
   * stands after `topBar` and takes its width from it. `true` when `topBar`
   * keeps its own end clear instead: the toggle then lies over the bar's end
   * edge, and the bar carries `--app-shell-bar-end-reserve` — the room
   * `topBar` leaves free there, on top of an inset of 1.5rem. A bar that
   * centres something on itself needs this, or the toggle moves its centre
   * (`AppShellLayout` sets it).
   */
  topBarClearsToggle?: boolean;
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
   * screen (`Alert layout="toast"`). Either way it covers
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
  /**
   * The areas of the narrow arrangement, each with an id: which id shows the
   * left column, which the main area, which the right card. There is no tab
   * bar; only `id` and `pane` are read (the icon and label of a
   * `MobilePaneTab` are not shown anywhere).
   */
  mobileTabs: MobilePaneTab[];
  /**
   * Id of the current area — the **single** input that decides what is open
   * below `md`: the navigation drawer (`pane: "left"`), the sources card
   * (`pane: "right"`) or neither (`pane: "main"`). The page stays on screen
   * in all three. Any derivation the app needs stays in the app.
   */
  activeMobileTab: string;
  /**
   * Another area was asked for: a toggle in the bar was used, or the drawer
   * or card was dismissed (then it carries the `main` id).
   */
  onMobileTabChange: (id: string) => void;
  /** @deprecated Unused: the narrow arrangement has no tab bar. */
  mobileTabBarLabel?: string;
}

/**
 * The frame's two slots an `AppShellSidePanel` renders into — the end column
 * of the row and the end of the bar, for its toggle (each `null` until the
 * element is mounted) — or `undefined` where the frame has no such column:
 * outside an `AppShell`, and below `md`.
 */
const AppShellSidePanelContext = React.createContext<
  | {
      column: HTMLElement | null;
      toggle: HTMLElement | null;
      /** Most the panel may measure right now; `null` while unmeasured. */
      maxWidth: number | null;
      /** Where the main area starts in the row, in px: what a maximised panel keeps clear. */
      inset: number;
      /** The narrow frame: one area on screen, so the shown panel fills it. */
      narrow: boolean;
      /** A mounted panel says it is there, so the frame keeps a row for its toggle; returns the undo. */
      present: () => () => void;
      /** The shown panel tells the frame its smallest and its current width, and whether it covers the main area. */
      report: (size: { min: number; width: number; maximized: boolean } | null) => void;
    }
  | undefined
>(undefined);

/** One tab of an `AppShellSidePanel`: what the strip shows for it. */
export interface AppShellSidePanelTab {
  /** Identity of the tab; `activeTabId` and the callbacks carry it. */
  id: string;
  /** The tab's label. Truncated in the strip, so keep the start distinctive. */
  title: string;
  /** Optional icon before the title: what kind of content the tab holds. */
  icon?: React.ReactNode;
  /** Accessible name of the tab's close button, e.g. „Quelle schließen". */
  closeLabel: string;
}

/** One kind of content an `AppShellSidePanel` can open as a tab. */
export interface AppShellSidePanelLauncher {
  /** Identity of the kind; `onLaunch` carries it. */
  id: string;
  /** Its name, e.g. „Quellen", „Browser". */
  label: string;
  /** Icon before the name. */
  icon?: React.ReactNode;
  /** Listed but not available. Say why in `label` or leave it out instead. */
  disabled?: boolean;
  /**
   * One key that opens it while the empty panel lists the launchers and the
   * focus is in the panel or nowhere (never while the user types): „B". Shown
   * at the row's end, there and in the `+` menu.
   */
  shortcut?: string;
}

export interface AppShellSidePanelProps {
  /** Accessible name of the column's `complementary` landmark. */
  label: string;
  /** Shown (`true`) or hidden (`false`). Hiding keeps the tabs. Consumer state. */
  isOpen: boolean;
  /** The toggle was used, or the last tab was closed; carries the REQUESTED state. */
  onOpenChange: (isOpen: boolean) => void;
  /** Accessible name of the toggle while the panel is hidden. */
  expandLabel: string;
  /** Accessible name of the toggle while the panel is shown. */
  collapseLabel: string;
  /** The open tabs, in strip order. Consumer state. */
  tabs: AppShellSidePanelTab[];
  /** The shown tab; `null` (or an unknown id) shows `empty`. */
  activeTabId: string | null;
  /** Another tab was chosen. */
  onTabChange: (id: string) => void;
  /**
   * A tab's close button was used. The consumer removes the tab and picks
   * the next active one; closing the last tab should also hide the panel.
   */
  onTabClose: (id: string) => void;
  /** Accessible name of the tab strip, e.g. „Geöffnete Inhalte". */
  tabListLabel: string;
  /** Width in px. The consumer's number, as for the other columns. */
  width: number;
  /** Given, a separator on the panel's content-facing edge drags its width. */
  resize?: AppShellPanelResize;
  /**
   * What the panel can open. Given, a `+` button stands after the last tab
   * and opens them as a menu, and a panel with no tab open lists them under
   * `launcherTitle` — the same list in both places. Omitted, there is no `+`.
   */
  launchers?: AppShellSidePanelLauncher[];
  /** One was chosen. The consumer opens (or shows) that tab. */
  onLaunch?: (id: string) => void;
  /** Accessible name of the `+` button, e.g. „Inhalt öffnen". */
  addLabel?: string;
  /**
   * Accessible names of the button that lets the panel cover the main area
   * and brings it back beside it. Both given, the button stands before the
   * toggle; omitted, the panel cannot be maximised.
   */
  maximizeLabel?: string;
  restoreLabel?: string;
  /** Covers the main area. Consumer state, with `onMaximizedChange`; omitted, the panel keeps it itself. */
  isMaximized?: boolean;
  onMaximizedChange?: (isMaximized: boolean) => void;
  /**
   * `aria-keyshortcuts` of the toggle and of the maximise button
   * („Meta+Alt+B"). Names the consumer's shortcut only: the chord itself is
   * the app's to handle, as every window-wide shortcut is.
   */
  toggleKeyShortcuts?: string;
  maximizeKeyShortcuts?: string;
  /** Heading of the list in the empty panel. Default: `addLabel`. */
  launcherTitle?: string;
  /**
   * Shown in place of a tab's content while no tab is open, instead of the
   * launcher list — or as the whole empty state when there are no `launchers`.
   */
  empty?: React.ReactNode;
  /** The active tab's content. Only that: inactive tabs are not mounted. */
  children?: React.ReactNode;
}

/**
 * A panel beside the page, at the frame's end edge: a full-height column
 * with a tab strip in its first row and one tab's content below. For what a
 * page opens next to itself and that has to stay readable beside it — a cited
 * source next to an answer, a document, an embedded browser.
 *
 * **Declared in the page, placed by the frame.** Render it anywhere under an
 * `AppShell`: the column goes to the end of the frame's row, the toggle to
 * the end of the bar. What opens a tab is page state (which citation was
 * clicked), usually far below the component that renders the frame, so the
 * panel is controlled from there and needs no state lifted to the frame.
 *
 * **It takes width from the main area**, unlike the floating `right` card,
 * which covers the main area's end. With both shown, the card floats beside
 * the panel.
 *
 * **The toggle hides the panel and keeps its tabs.** Hidden, the toggle is
 * the bar's last control; shown, it stands at the end of the tab strip — the
 * frame's top end corner either way. It is there with no tab open too, so
 * its place does not depend on what the page has opened; the panel then
 * shows `empty`.
 *
 * **Only the active tab's content is mounted** (`children`), and none while
 * the panel is hidden: what a tab must keep across that lives in the
 * consumer's state. A tab whose content is not DOM — a native browser view a
 * desktop host lays over the page — fills its content area with a
 * placeholder and reports that element's rectangle to the host.
 *
 * **Below `md`, and outside an `AppShell`, nothing renders**: the frame has
 * no columns there and one area on screen. The consumer shows the content
 * its own way (a full-screen dialog).
 */
const SHORTCUT_KEY_SIGNS: Record<string, string> = { Meta: "⌘", Alt: "⌥", Shift: "⇧", Control: "Ctrl" };

/**
 * An icon button's tooltip: its name, and its shortcut where it has one
 * (`aria-keyshortcuts` form, „Meta+Alt+B").
 */
function IconTip({ label, shortcut, children }: { label?: string; shortcut?: string; children: React.ReactElement }) {
  if (!label) return children;
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">
        <span className="flex items-center gap-2">
          {label}
          {shortcut && (
            <KbdGroup aria-hidden>
              {shortcut.split("+").map((key) => (
                <Kbd key={key}>{SHORTCUT_KEY_SIGNS[key] ?? key}</Kbd>
              ))}
            </KbdGroup>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function AppShellSidePanel({
  label,
  isOpen,
  onOpenChange,
  expandLabel,
  collapseLabel,
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  tabListLabel,
  width,
  resize,
  launchers,
  onLaunch,
  addLabel,
  launcherTitle,
  maximizeLabel,
  restoreLabel,
  isMaximized,
  onMaximizedChange,
  toggleKeyShortcuts,
  maximizeKeyShortcuts,
  empty,
  children,
}: AppShellSidePanelProps) {
  const slots = React.useContext(AppShellSidePanelContext);
  const panelId = React.useId();
  const tabId = (id: string) => `${panelId}-tab-${id}`;
  const active = tabs.find((tab) => tab.id === activeTabId) ?? null;

  // The toggle is mounted anew when it moves between bar and strip; a toggle
  // that was used keeps the focus across that move.
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const refocusToggle = React.useRef(false);
  React.useEffect(() => {
    if (!refocusToggle.current) return;
    refocusToggle.current = false;
    toggleRef.current?.focus();
  });

  // The frame's cap (see `MAIN_MIN_WIDTH`): the panel gives way before the
  // main area does, down to its own minimum. The consumer's `width` is not
  // changed by it, so the panel is its old size again once there is room.
  const minWidth = resize ? resize.minWidth : Math.min(width, SIDE_PANEL_MIN_WIDTH);
  const cap = slots?.maxWidth ?? null;
  const maxWidth = cap === null ? null : Math.max(minWidth, cap);
  const shownWidth = maxWidth === null ? width : Math.min(width, maxWidth);
  const report = slots?.report;
  const shown = Boolean(slots) && isOpen;
  // Maximised, the panel covers the main area; its width beside it is kept
  // for the way back.
  const canMaximize = maximizeLabel !== undefined && restoreLabel !== undefined;
  const [ownMaximized, setOwnMaximized] = React.useState(false);
  const narrow = slots?.narrow ?? false;
  const maximized = narrow || (canMaximize && (isMaximized ?? ownMaximized));
  const setMaximized = (next: boolean) => {
    setOwnMaximized(next);
    onMaximizedChange?.(next);
  };
  React.useLayoutEffect(() => {
    if (!report || !shown) return;
    report({ min: minWidth, width: shownWidth, maximized });
  }, [report, shown, minWidth, shownWidth, maximized]);

  // A launcher's key opens it while the empty panel lists them — from inside
  // the panel, or with the focus nowhere; never out of a field being typed in.
  const asideRef = React.useRef<HTMLElement>(null);
  const hasActiveTab = tabs.some((tab) => tab.id === activeTabId);
  const launchKeys = shown && !hasActiveTab && empty === undefined ? launchers : undefined;
  const onLaunchRef = React.useRef(onLaunch);
  React.useEffect(() => {
    onLaunchRef.current = onLaunch;
  });
  React.useEffect(() => {
    if (!launchKeys?.some((launcher) => launcher.shortcut)) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const focusFree = !target || target === document.body;
      if (!focusFree && !asideRef.current?.contains(target)) return;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const hit = launchKeys.find(
        (launcher) => !launcher.disabled && launcher.shortcut?.toLowerCase() === event.key.toLowerCase(),
      );
      if (!hit) return;
      event.preventDefault();
      onLaunchRef.current?.(hit.id);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [launchKeys]);
  React.useLayoutEffect(() => {
    if (!report || !shown) return;
    return () => report(null);
  }, [report, shown]);
  const present = slots?.present;
  React.useLayoutEffect(() => present?.(), [present]);

  if (!slots) return null;

  const toggle = (
    <IconTip label={isOpen ? collapseLabel : expandLabel} shortcut={toggleKeyShortcuts}>
    <Button
      ref={toggleRef}
      variant="ghost"
      size="icon"
      className={PANE_TOGGLE_CLASS}
      data-slot="app-shell-panel-toggle"
      aria-label={isOpen ? collapseLabel : expandLabel}
      aria-expanded={isOpen}
      aria-controls={isOpen ? panelId : undefined}
      aria-keyshortcuts={toggleKeyShortcuts}
      onClick={() => {
        refocusToggle.current = true;
        onOpenChange(!isOpen);
      }}
    >
      {isOpen ? <PanelRightClose aria-hidden /> : <PanelRightOpen aria-hidden />}
    </Button>
    </IconTip>
  );

  if (!isOpen) return slots.toggle ? createPortal(toggle, slots.toggle) : null;
  if (!slots.column) return null;

  const canLaunch = launchers !== undefined && launchers.length > 0;

  // Arrow keys move along the strip and show the tab they land on, as a
  // tablist with automatic activation does.
  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null || next === index) return;
    event.preventDefault();
    const target = tabs[next];
    onTabChange(target.id);
    document.getElementById(tabId(target.id))?.focus();
  };

  return createPortal(
    <>
      {resize && !maximized && (
        <ResizeHandle
          side="right"
          value={shownWidth}
          min={resize.minWidth}
          max={maxWidth === null ? resize.maxWidth : Math.max(resize.minWidth, Math.min(resize.maxWidth, maxWidth))}
          label={resize.label}
          controls={panelId}
          onValueChange={resize.onWidthChange}
        />
      )}
      {/* Maximised, the panel leaves the flow; this keeps its width in the
          row, so the covered page is not laid out anew. */}
      {maximized && !narrow && <div aria-hidden className="shrink-0" style={{ width: shownWidth }} />}
      <aside
        ref={asideRef}
        id={panelId}
        aria-label={label}
        data-slot="app-shell-side-panel"
        data-maximized={maximized ? "" : undefined}
        className={cn(
          "flex min-h-0 min-w-0 flex-col border-l border-outline-variant bg-canvas text-on-surface",
          maximized && "absolute inset-y-0 right-0 z-10",
          narrow && "z-30 border-l-0",
        )}
        style={maximized ? { left: narrow ? 0 : slots.inset } : { width: shownWidth }}
      >
        {/* The strip: level with the bar and the left column's header row,
            and part of the title bar under a hidden one. */}
        <div
          data-slot="app-shell-side-panel-strip"
          data-app-region="drag"
          className={cn(
            "flex h-14 shrink-0 items-center gap-1 border-b border-outline-variant pr-2 pl-2",
            // Filling a narrow frame, the strip is the window's first row:
            // it keeps clear of a native shell's window controls.
            narrow && "pl-[max(0.5rem,var(--titlebar-inset-start,0px))]",
          )}
        >
          <div
            role="tablist"
            aria-label={tabListLabel}
            className="flex min-w-0 items-center gap-1 overflow-x-auto"
          >
            {tabs.map((tab, index) => {
              const selected = tab.id === active?.id;
              return (
                <div
                  key={tab.id}
                  data-slot="app-shell-side-panel-tab"
                  data-state={selected ? "active" : "inactive"}
                  className={cn(
                    "flex h-9 max-w-56 min-w-0 shrink items-center rounded-[var(--ui-radius-control)] pr-1 text-sm",
                    selected
                      ? "bg-surface-container text-on-surface"
                      : "text-on-surface-variant hover:bg-surface-container-low",
                  )}
                >
                  <button
                    type="button"
                    role="tab"
                    id={tabId(tab.id)}
                    aria-selected={selected}
                    aria-controls={selected ? `${panelId}-content` : undefined}
                    // One stop for the strip; the arrow keys move within it.
                    tabIndex={selected || (!active && index === 0) ? 0 : -1}
                    className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[inherit] border-0 bg-transparent pr-1 pl-3 text-inherit [font:inherit] [&_svg]:size-4 [&_svg]:shrink-0"
                    onClick={() => onTabChange(tab.id)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.title}</span>
                  </button>
                  <IconTip label={tab.closeLabel}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 p-0 text-on-surface-variant [&_svg]:size-3.5"
                      aria-label={tab.closeLabel}
                      onClick={() => onTabClose(tab.id)}
                    >
                      <X aria-hidden />
                    </Button>
                  </IconTip>
                </div>
              );
            })}
          </div>
          {canLaunch && (
            <DropdownMenu>
              <IconTip label={addLabel}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 p-0 text-on-surface-variant [&_svg]:size-4"
                    data-slot="app-shell-side-panel-add"
                    aria-label={addLabel}
                  >
                    <Plus aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
              </IconTip>
              <DropdownMenuContent align="start">
                {launchers.map((launcher) => (
                  <DropdownMenuItem
                    key={launcher.id}
                    disabled={launcher.disabled}
                    onSelect={() => onLaunch?.(launcher.id)}
                  >
                    {launcher.icon}
                    {launcher.label}
                    {launcher.shortcut && <Kbd aria-hidden className="ml-auto">{launcher.shortcut.toUpperCase()}</Kbd>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* The strip's free room stays with the window: it drags it. */}
          <span className="min-w-0 flex-1" />
          {canMaximize && !narrow && (
            <IconTip label={maximized ? restoreLabel : maximizeLabel} shortcut={maximizeKeyShortcuts}>
            <Button
              variant="ghost"
              size="icon"
              className={PANE_TOGGLE_CLASS}
              data-slot="app-shell-side-panel-maximize"
              aria-label={maximized ? restoreLabel : maximizeLabel}
              aria-pressed={maximized}
              aria-keyshortcuts={maximizeKeyShortcuts}
              onClick={() => setMaximized(!maximized)}
            >
              {maximized ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
            </Button>
            </IconTip>
          )}
          {toggle}
        </div>
        <div
          id={`${panelId}-content`}
          role={active ? "tabpanel" : undefined}
          aria-labelledby={active ? tabId(active.id) : undefined}
          data-slot="app-shell-side-panel-content"
          className="flex min-h-0 flex-1 flex-col"
        >
          {active ? children : empty ?? (canLaunch && (
            <div data-slot="app-shell-side-panel-launcher" className="m-auto flex w-full max-w-sm flex-col gap-1 p-6">
              <p className="m-0 mb-2 text-center text-sm text-on-surface-variant">{launcherTitle ?? addLabel}</p>
              {launchers.map((launcher) => (
                <Button
                  key={launcher.id}
                  variant="ghost"
                  className="h-10 w-full justify-start gap-3 [&_svg]:size-4 [&_svg]:shrink-0"
                  disabled={launcher.disabled}
                  aria-keyshortcuts={launcher.shortcut}
                  onClick={() => onLaunch?.(launcher.id)}
                >
                  {launcher.icon}
                  {launcher.label}
                  {launcher.shortcut && <Kbd aria-hidden className="ml-auto">{launcher.shortcut.toUpperCase()}</Kbd>}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </>,
    slots.column,
  );
}
AppShellSidePanel.displayName = "AppShellSidePanel";

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      className,
      left: leftProp,
      right,
      showRight = true,
      topBarClearsToggle = false,
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
      mobileTabBarLabel: _mobileTabBarLabel,
      children,
      ...props
    },
    ref,
  ) => {
    const isDesktop = useIsDesktop();
    // Deprecated and unused; taken out so it does not reach the DOM.
    void _mobileTabBarLabel;

    /*
      The frame's width, for its shrinking rules (see `MAIN_MIN_WIDTH`).
      Unmeasured (no ResizeObserver, no layout) none of them applies: every
      column is what the consumer says.
    */
    const rowRef = React.useRef<HTMLDivElement>(null);
    const [rowWidth, setRowWidth] = React.useState<number | null>(null);
    React.useLayoutEffect(() => {
      const el = rowRef.current;
      if (!isDesktop || !el || typeof ResizeObserver === "undefined") {
        setRowWidth(null);
        return;
      }
      // A frame of no width has no layout to keep (a hidden tree, jsdom).
      const measure = () => setRowWidth(el.clientWidth || null);
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      measure();
      return () => observer.disconnect();
    }, [isDesktop]);
    // The shown side panel's smallest and current width, as it reports them.
    const [sidePanel, setSidePanel] = React.useState<{ min: number; width: number; maximized: boolean } | null>(null);
    // How many `AppShellSidePanel`s are mounted: with one, the frame has a
    // first row for its toggle even where nothing else asks for a bar.
    const [sidePanelCount, setSidePanelCount] = React.useState(0);
    const hasSidePanel = sidePanelCount > 0;
    const sidePanelPresent = React.useCallback(() => {
      setSidePanelCount((count) => count + 1);
      return () => setSidePanelCount((count) => count - 1);
    }, []);
    const reportSidePanel = React.useCallback((size: { min: number; width: number; maximized: boolean } | null) => {
      setSidePanel((prev) =>
        prev?.min === size?.min && prev?.width === size?.width && prev?.maximized === size?.maximized ? prev : size,
      );
    }, []);

    /*
      Rule 2: beside a side panel, an expanded left column that would take
      the main area below its minimum shows as its rail. Only the display:
      the consumer's `isOpen` — a remembered preference — stays, so the
      column is back once the panel goes or the frame widens. Expanding it by
      hand while the frame is that narrow is the user's call and holds until
      the room is back.
      Collapsing it again there only takes that override back: the stored
      preference is not written, so the column still returns with the room.
    */
    const [leftHeldOpen, setLeftHeldOpen] = React.useState(false);
    const leftExpandedWidth = Math.max(
      leftProp?.width ?? DEFAULT_PANEL_WIDTH,
      leftProp?.resize?.minWidth ?? 0,
    );
    const leftCrowds =
      isDesktop && Boolean(leftProp) && sidePanel !== null && rowWidth !== null &&
      rowWidth - leftExpandedWidth < MAIN_MIN_WIDTH + sidePanel.min;
    if (!leftCrowds && leftHeldOpen) setLeftHeldOpen(false);
    const left: AppShellPanel | undefined =
      leftProp && leftCrowds
        ? {
            ...leftProp,
            isOpen: leftProp.isOpen && leftHeldOpen,
            onOpenChange: (next) => {
              setLeftHeldOpen(next);
              if (next !== leftProp.isOpen && next) leftProp.onOpenChange(true);
            },
          }
        : leftProp;

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
    const rightLockId = React.useId();

    // The slots an `AppShellSidePanel` renders into: elements, held in state
    // so the panel renders once they exist.
    const [panelColumnSlot, setPanelColumnSlot] = React.useState<HTMLElement | null>(null);
    const [panelToggleSlot, setPanelToggleSlot] = React.useState<HTMLElement | null>(null);

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

    // What the left column takes of the row right now, and from it rule 1:
    // the most a side panel may measure.
    const leftTaken = !left ? 0 : left.isOpen ? leftWidth : SIDE_PANEL_RAIL_WIDTH;
    const sidePanelMax =
      rowWidth === null
        ? null
        : Math.min(Math.floor(rowWidth * SIDE_PANEL_MAX_FRACTION), rowWidth - leftTaken - MAIN_MIN_WIDTH);
    const panelSlots = React.useMemo(
      () => ({ column: panelColumnSlot, toggle: panelToggleSlot, maxWidth: sidePanelMax, inset: leftTaken, narrow: !isDesktop, report: reportSidePanel, present: sidePanelPresent }),
      [panelColumnSlot, panelToggleSlot, sidePanelMax, leftTaken, isDesktop, reportSidePanel, sidePanelPresent],
    );
    // Rule 3: the page keeps clear of the open card only while that leaves it
    // its minimum; otherwise the card lies over its end.
    const mainWidth = rowWidth === null ? null : rowWidth - leftTaken - (sidePanel?.width ?? 0);

    /*
      From `lg` up the right column is not a column: it floats over the main
      area as a card below the bar, and its toggle is the last control of the
      bar — the top-right corner, on the web and in a native window alike. It
      takes no width, so it has no rail and no resize handle; closed, it is
      hidden but stays mounted, like a collapsed column's body. The frame's
      columns are left to what frames the app (navigation, a host's own
      sidebars); what belongs to the page floats over it.
    */
    /*
      Below `md` the same card and the same toggle: what is open there is the
      consumer's `activeMobileTab`, so the card's state is read from it and a
      toggle reports the area to show. `showRight` buys horizontal room and
      is ignored there, as before.
    */
    const narrowPane: PaneId | undefined = isDesktop
      ? undefined
      : (mobileTabs.find((tab) => tab.id === activeMobileTab)?.pane ?? "main");
    const areaId = (pane: PaneId) => mobileTabs.find((tab) => tab.pane === pane)?.id;
    // Closing a drawer goes back to the main-area id that was current before
    // it opened — an app may map several ids to the main area.
    const [lastMainId, setLastMainId] = React.useState<string | undefined>(undefined);
    if (
      activeMobileTab !== lastMainId &&
      mobileTabs.find((tab) => tab.id === activeMobileTab)?.pane === "main"
    ) {
      setLastMainId(activeMobileTab);
    }
    const showArea = (pane: PaneId) => {
      const remembered = pane === "main" && mobileTabs.some((tab) => tab.id === lastMainId)
        ? lastMainId
        : undefined;
      const id = remembered ?? areaId(pane);
      if (id !== undefined && id !== activeMobileTab) onMobileTabChange(id);
    };
    const narrowRight = !isDesktop && areaId("right") !== undefined;
    const rightSource = right && (showRight || !isDesktop) ? right : null;
    const floatRight: AppShellPanel | null =
      rightSource && narrowRight
        ? {
            ...rightSource,
            isOpen: narrowPane === "right",
            onOpenChange: (open) => showArea(open ? "right" : "main"),
          }
        : rightSource;
    const rightLocked = floatRight?.locked;
    const rightOpen = Boolean(floatRight?.isOpen) && !rightLocked;
    const bubbleLeavesRoom =
      isDesktop && (mainWidth === null ||
      mainWidth - ((floatRight?.width ?? DEFAULT_PANEL_WIDTH) + 16) >= MAIN_MIN_WIDTH);
    // Rule 4: at the width where the card stops standing beside the page and
    // would lie over it, an open card closes — it is in the way there until
    // asked for. Opened by hand below that width it stays, and the frame
    // widening again does not reopen it.
    const bubbleHadRoom = React.useRef(true);
    const closeBubble = React.useRef<(() => void) | null>(null);
    React.useEffect(() => {
      closeBubble.current = rightOpen && floatRight ? () => floatRight.onOpenChange(false) : null;
    });
    React.useEffect(() => {
      if (!isDesktop) {
        bubbleHadRoom.current = true;
        return;
      }
      if (bubbleHadRoom.current && !bubbleLeavesRoom) closeBubble.current?.();
      bubbleHadRoom.current = bubbleLeavesRoom;
    }, [isDesktop, bubbleLeavesRoom]);
    const rightButton = floatRight ? (
      <Button
        variant="ghost"
        size="icon"
        className={cn(PANE_TOGGLE_CLASS, rightLocked && "group/locked relative cursor-not-allowed hover:bg-transparent active:bg-transparent")}
        aria-label={rightOpen ? floatRight.collapseLabel : floatRight.expandLabel}
        aria-expanded={rightLocked ? undefined : rightOpen}
        aria-controls={rightLocked ? undefined : rightPaneId}
        aria-disabled={rightLocked ? true : undefined}
        aria-describedby={rightLocked ? rightLockId : undefined}
        // The ghost button's own open tint marks the shown card.
        data-state={rightOpen ? "open" : "closed"}
        data-locked={rightLocked ? "" : undefined}
        onClick={rightLocked ? undefined : () => floatRight.onOpenChange(!floatRight.isOpen)}
      >
        <span className={cn("contents", rightLocked && "[&>svg]:opacity-40")}>
          {floatRight.toggleIcon ?? <SquareMenu aria-hidden />}
        </span>
        {rightLocked && (
          <>
            <span
              aria-hidden
              data-slot="app-shell-right-toggle-lock"
              className="absolute right-0.5 bottom-0.5 hidden size-4 items-center justify-center rounded-full bg-canvas text-on-surface group-hover/locked:flex group-focus-visible/locked:flex [&_svg]:size-3!"
            >
              <Lock />
            </span>
            <span id={rightLockId} hidden>{rightLocked.description}</span>
          </>
        )}
      </Button>
    ) : null;
    const rightToggle = floatRight && rightButton ? (
      <span data-slot="app-shell-right-toggle" className="flex shrink-0 items-center">
        {floatRight.toggleTooltip ? (
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>{rightButton}</TooltipTrigger>
            <TooltipContent side="bottom" align="end">{floatRight.toggleTooltip}</TooltipContent>
          </Tooltip>
        ) : rightButton}
      </span>
    ) : null;
    // The bar's end: the card's toggle, then the slot a hidden
    // `AppShellSidePanel` puts its toggle into — the frame's top end corner.
    // Without either it is no box and takes no room.
    const barEnd = (
      <span
        data-slot="app-shell-bar-end"
        className={cn(
          "flex shrink-0 items-center gap-1 has-[button]:pr-2",
          topBar && topBarClearsToggle && rightToggle && "absolute inset-y-0 right-0",
        )}
      >
        {rightToggle}
        <span ref={setPanelToggleSlot} data-slot="app-shell-panel-toggle-slot" className="contents" />
      </span>
    );

    /*
      Below `md` the left column is a drawer over the page, opened by a
      toggle at the start of the bar — where the column's own toggle stands
      on a wide screen. The consumer's `isOpen` is the wide screen's collapse
      preference and is not read here: a drawer starts closed.
    */
    const narrowLeftOpen = narrowPane === "left";
    const narrowLeftToggle = !isDesktop && left && areaId("left") !== undefined ? (
      <Button
        variant="ghost"
        size="icon"
        className={PANE_TOGGLE_CLASS}
        data-slot="app-shell-drawer-toggle"
        aria-label={narrowLeftOpen ? left.collapseLabel : left.expandLabel}
        aria-expanded={narrowLeftOpen}
        onClick={() => showArea(narrowLeftOpen ? "main" : "left")}
      >
        {/* Not the column icon: below `md` this opens a drawer, not a column. */}
        <TextAlignStart aria-hidden />
      </Button>
    ) : null;
    // The card's own way out, in its top end corner (`closeLabel`). The
    // toggle in the bar closes it too; the focus goes back there.
    const bubbleClose = floatRight?.closeLabel ? (
      <IconTip label={floatRight.closeLabel}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 p-0 text-on-surface-variant [&_svg]:size-4"
        data-slot="app-shell-bubble-close"
        aria-label={floatRight.closeLabel}
        onClick={(event) => {
          const toggle = event.currentTarget.ownerDocument.querySelector<HTMLElement>(
            `[aria-controls="${CSS.escape(rightPaneId)}"]`,
          );
          floatRight.onOpenChange(false);
          toggle?.focus();
        }}
      >
        <X aria-hidden />
      </Button>
      </IconTip>
    ) : null;
    const rightBubble = floatRight && !rightLocked ? (
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
          <div className="flex h-12 shrink-0 items-center gap-stack-sm pr-2 pl-4">
            <div className="flex min-w-0 flex-1 items-center gap-stack-sm">{floatRight.header}</div>
            {bubbleClose}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{floatRight.content}</div>
        {/* Without a header row the button lies over the card's corner. */}
        {!floatRight.header && bubbleClose && (
          <span className="absolute top-2 right-2 rounded-[var(--ui-radius-control)] bg-surface-container-lowest">{bubbleClose}</span>
        )}
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
          narrowLeftToggle && cornerOwner !== "bar" && "pl-2",
          besideRail && "relative z-10 bg-canvas",
          // The bar's end lies over it instead of taking width beside
          // `topBar`: what `topBar` has to keep clear beyond a 1.5rem inset —
          // one toggle, or two while a side panel's toggle stands there too.
          rightToggle && topBarClearsToggle &&
            "relative [--app-shell-bar-end-reserve:1.5rem] has-[[data-slot=app-shell-panel-toggle]]:[--app-shell-bar-end-reserve:4rem]",
        )}
        style={overRail}
      >
        {railBrand}
        {railToggle}
        {narrowLeftToggle}
        {!controlsInLeft && controls}
        {topBar}
        {barEnd}
      </header>
    ) : cornerOwner === "bar" || besideRail || (controls && !controlsInLeft) || rightToggle || narrowLeftToggle || hasSidePanel ? (
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
        {narrowLeftToggle}
        {!controlsInLeft && controls}
        <span className="flex-1" />
        {barEnd}
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
      a value nothing responds to. The third gate — „not below `md`" — is the
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
      return (
        <AppShellSidePanelContext.Provider value={panelSlots}>
        <div
          ref={ref}
          className={cn(
            "relative flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-on-surface",
            className,
          )}
          {...props}
        >
          {!titlebar && noticeRegion}
          {/* The page is always on screen: drawer and card lie over it. The
              bar is inside this box, as on a wide screen: the card hangs
              one bar's height below the box's top edge. */}
          <div
            data-slot="app-shell-content"
            className={cn("flex min-h-0 min-w-0 flex-1 flex-col", sidePanel?.maximized && "invisible")}
            inert={sidePanel?.maximized || undefined}
          >
            {bar}
            <main ref={mainRef} aria-label={mainLabel} className={PANE_FILL}>
              {statusLayer}
              {children}
            </main>
            {cornerLayer}
          </div>
          {/* The slot a shown `AppShellSidePanel` fills: here it lies over
              the whole frame, one area on screen. */}
          <div ref={setPanelColumnSlot} data-slot="app-shell-panel-slot" className="contents" />
          {/* The card is a drawer here, from the bottom edge: one area on
              screen, nothing floating. */}
          {floatRight && !rightLocked && (
            <BottomSheet
              id={rightPaneId}
              data-slot="app-shell-bubble"
              open={floatRight.isOpen}
              onOpenChange={floatRight.onOpenChange}
              label={floatRight.label}
              header={(floatRight.header || bubbleClose) && (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-stack-sm">{floatRight.header}</div>
                  {bubbleClose}
                </>
              )}
              footer={floatRight.footer}
            >
              {floatRight.content}
            </BottomSheet>
          )}
          {/* Under a hidden title bar the notice is the frame's last row. */}
          {noticeAtBottom && noticeRegion}
          {left && narrowLeftToggle && (
            <Drawer
              direction="left"
              open={narrowLeftOpen}
              onOpenChange={(open) => showArea(open ? "left" : "main")}
            >
              <DrawerContent
                data-slot="app-shell-drawer"
                className="w-[min(20rem,85vw)] sm:max-w-none"
              >
                <DrawerTitle className="sr-only">{left.label}</DrawerTitle>
                {/* The column's header row, with the toggle that closes the drawer. */}
                <div className="flex h-14 shrink-0 items-center gap-stack-sm pr-2 pl-4">
                  <span className="flex min-w-0 flex-1 items-center">{left.header}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={PANE_TOGGLE_CLASS}
                    aria-label={left.collapseLabel}
                    onClick={() => showArea("main")}
                  >
                    <PanelLeftClose aria-hidden />
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">{left.content}</div>
                {left.narrowAction ? (
                  // The drawer's bottom row: the footer as its short form at
                  // the start, the primary action at the end.
                  <div
                    data-slot="app-shell-drawer-actions"
                    className="flex shrink-0 items-center justify-between gap-3 pr-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-2"
                  >
                    <SidebarCollapsedContext.Provider value>
                      <span className="flex shrink-0 items-center">{left.footer}</span>
                    </SidebarCollapsedContext.Provider>
                    {left.narrowAction}
                  </div>
                ) : (
                  left.footer && <div className="shrink-0">{left.footer}</div>
                )}
              </DrawerContent>
            </Drawer>
          )}
        </div>
        </AppShellSidePanelContext.Provider>
      );
    }

    return (
      <AppShellSidePanelContext.Provider value={panelSlots}>
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
        <div ref={rowRef} data-slot="app-shell-row" className="relative flex min-h-0 flex-1">
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
          <div
            data-slot="app-shell-content"
            className={cn("flex min-w-0 flex-1 flex-col bg-canvas", floatRight && "relative", sidePanel?.maximized && "invisible")}
            // Under a maximised side panel the page is covered: out of the
            // tab order and the accessibility tree until the panel is back.
            inert={sidePanel?.maximized || undefined}
            // What the open bubble covers at the content's end edge: its width
            // plus `right-2` and the same gap on its other side. Content that
            // must stay readable beside the bubble keeps clear of it by this
            // much; without a bubble, or closed, the variable is unset.
            style={rightOpen && floatRight && bubbleLeavesRoom ? ({ "--app-shell-bubble-inset": `calc(${floatRight.width ?? DEFAULT_PANEL_WIDTH}px + 1rem)` } as React.CSSProperties) : undefined}
          >
            {bar}
            <main ref={mainRef} aria-label={mainLabel} className={PANE_FILL}>
              {statusLayer}
              {children}
            </main>
            {cornerLayer}
            {rightBubble}
          </div>
          {/* The end column an `AppShellSidePanel` fills. After the main
              column, so the floating card — inside it — stays beside the
              panel. `contents`: the slot is no box; empty, the row is as it
              was. */}
          <div ref={setPanelColumnSlot} data-slot="app-shell-panel-slot" className="contents" />
        </div>
        {/* Under a hidden title bar the first row is the window's title bar,
            so the notice is the frame's last row instead: full width, in the
            flow, never scrolling away. */}
        {noticeAtBottom && noticeRegion}
      </div>
      </AppShellSidePanelContext.Provider>
    );
  },
);
AppShell.displayName = "AppShell";

export { AppShell, AppShellSidePanel };
