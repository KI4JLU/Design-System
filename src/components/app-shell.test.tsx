import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { FolderOpen, Home, MessageSquare } from "lucide-react";
import {
  AppShell,
  AppShellSidePanel,
  type AppShellSidePanelProps,
  type AppShellPanel,
  type AppShellPanelResize,
} from "./app-shell";
import { NavItem } from "./nav-item";
import { SIDE_PANEL_RAIL_WIDTH } from "./side-panel-variants";
import type { MobilePaneTab } from "../lib/pane-layout";

/**
 * `AppShell` after 0.30.0: two `SidePanel` columns around a main column, and
 * below `lg` one area at a time plus a `BottomTabBar`. This file is a
 * **rewrite** — every assertion about the Radix drawer is gone with the drawer
 * itself, not adjusted, because the arrangement it described no longer exists.
 *
 * Oracles, all of them outside the code under test:
 *
 * 1. **ARIA landmark roles as HTML-AAM defines them** — `aside` with an
 *    accessible name is `complementary`, `main` is `main`, a `header` that is
 *    not inside a sectioning element is `banner`, `nav` is `navigation`, and a
 *    document has at most one `main`. Testing Library computes those from the
 *    markup (aria-query + dom-accessibility-api) and reads none of this repo's
 *    classes, so „the right areas are on screen" is checkable without
 *    asserting the component's own output back at itself. No assertion below
 *    names a CSS class.
 * 2. **`Node.compareDocumentPosition`**, the DOM's own answer to „which of
 *    these two elements comes first". Used for the order of the three columns
 *    and for header-before-content inside a column: DOM order is what carries
 *    the visual order here (the shell renders no `order-*` utility), and it is
 *    also what the tab sequence and a screen reader follow.
 * 3. **The WAI-ARIA disclosure pattern**, which `SidePanel` implements:
 *    `aria-expanded` on the toggle plus `aria-controls` resolving to the pane
 *    body. Read as attributes, never as internal state.
 * 4. **The consumer's own data** — the widths, labels, ids and tab table this
 *    file passes in. A number asserted below is a number this file chose (311,
 *    233), never one the component computed; the single exception is the
 *    collapsed rail, which is the exported `SIDE_PANEL_RAIL_WIDTH`.
 * 5. **`BottomTabBar`'s published contract**: a `navigation` landmark with
 *    exactly one `aria-current="page"`, asserted through the attribute.
 * 6. **The card's own acceptance criteria** (KI-809), which name the states to
 *    reach: both columns collapsible independently, no dialog in the tree,
 *    exactly one pane per active tab, no node mounted twice, and an omitted
 *    column leaving neither landmark nor rail.
 * 7. **`ResizeHandle`'s published contract** (0.36.0 suite): the WAI-ARIA APG
 *    „Window Splitter" — a focusable `separator` with
 *    `aria-valuemin`/`-valuemax`/`-valuenow` and `aria-controls` — plus its
 *    *mirrored* arrow keys, a left column growing on `→` and a right one
 *    shrinking on it. That mirroring is asserted in `resize-handle.test.tsx`
 *    against the component itself; here it is the oracle for the only thing
 *    this shell decides, namely which `side` each column's handle is handed.
 *    A wrong `side` is invisible to every other assertion and shows up only
 *    as the sign of the reported width.
 *
 * jsdom implements no `matchMedia` (verified against jsdom 29), so the
 * viewport is stubbed per test — that stub *is* the test's viewport, and no
 * assertion here depends on CSS having been applied.
 */

const askedQueries: string[] = [];

function stubViewport(isDesktop: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => {
    askedQueries.push(query);
    return {
      matches: isDesktop,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  askedQueries.length = 0;
});

// Widths chosen so they can only have come from this file.
const LEFT_WIDTH = 311;
const RIGHT_WIDTH = 233;
// Bounds likewise: this file's numbers, never the component's (it has none —
// `AppShellPanelResize` bakes in no defaults).
const LEFT_MIN = 180;
const LEFT_MAX = 540;
const RIGHT_MIN = 160;
const RIGHT_MAX = 480;
// `ResizeHandle`'s documented default step. Not re-derived here: it is that
// component's published contract (DESIGN_SYSTEM.md §4, asserted in
// `resize-handle.test.tsx`), which is what makes it usable as an oracle.
const STEP = 10;

function leftResize(
  overrides: Partial<AppShellPanelResize> = {},
): AppShellPanelResize {
  return {
    minWidth: LEFT_MIN,
    maxWidth: LEFT_MAX,
    onWidthChange: vi.fn(),
    label: "Breite der Navigation ändern",
    ...overrides,
  };
}

function rightResize(
  overrides: Partial<AppShellPanelResize> = {},
): AppShellPanelResize {
  return {
    minWidth: RIGHT_MIN,
    maxWidth: RIGHT_MAX,
    onWidthChange: vi.fn(),
    label: "Breite der Quellen ändern",
    ...overrides,
  };
}

function leftPanel(overrides: Partial<AppShellPanel> = {}): AppShellPanel {
  return {
    content: (
      <nav aria-label="Hauptnavigation">
        <NavItem asChild>
          <a href="#bereich-a" id="nav-bereich-a">
            Bereich A
          </a>
        </NavItem>
      </nav>
    ),
    header: <span>Marke</span>,
    footer: <button type="button">Abmelden</button>,
    label: "Navigationsspalte",
    isOpen: true,
    width: LEFT_WIDTH,
    onOpenChange: vi.fn(),
    expandLabel: "Navigation ausklappen",
    collapseLabel: "Navigation einklappen",
    ...overrides,
  };
}

function rightPanel(overrides: Partial<AppShellPanel> = {}): AppShellPanel {
  return {
    content: <p>Quellen-Inhalt</p>,
    header: <span>Quellen</span>,
    label: "Quellen",
    isOpen: true,
    width: RIGHT_WIDTH,
    onOpenChange: vi.fn(),
    expandLabel: "Quellen ausklappen",
    collapseLabel: "Quellen einklappen",
    ...overrides,
  };
}

const TABS: MobilePaneTab[] = [
  { id: "nav", icon: <Home />, label: "Navigation", pane: "left" },
  { id: "page", icon: <MessageSquare />, label: "Seite", pane: "main" },
  { id: "sources", icon: <FolderOpen />, label: "Quellen", pane: "right" },
];

function shellElement(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return (
    <AppShell
      topBar={<span>Anwendung</span>}
      left={leftPanel()}
      right={rightPanel()}
      mobileTabs={TABS}
      activeMobileTab="page"
      onMobileTabChange={() => {}}
      mobileTabBarLabel="Bereichswechsel"
      {...props}
    >
      <p>Inhalt</p>
    </AppShell>
  );
}

function renderShell(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return render(shellElement(props));
}

/** `true` when `a` precedes `b` in document order. */
function precedes(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("AppShell — desktop arrangement", () => {
  it("puts left column, main area and right column on screen, in that order", () => {
    stubViewport(true);
    renderShell();

    const left = screen.getByRole("complementary", { name: "Navigationsspalte" });
    const main = screen.getByRole("main");
    const right = screen.getByRole("complementary", { name: "Quellen" });

    expect(main).toHaveTextContent("Inhalt");
    // The sketch's column order, read off the DOM rather than off a class.
    expect(precedes(left, main)).toBe(true);
    expect(precedes(main, right)).toBe(true);
    // The columns are siblings of the main area, not content of it: they are
    // the screen's chrome.
    expect(main).not.toContainElement(left);
    expect(main).not.toContainElement(right);
  });

  it("renders the chrome bar as a banner above the main area", () => {
    stubViewport(true);
    renderShell();
    const bar = screen.getByRole("banner");
    expect(bar).toHaveTextContent("Anwendung");
    expect(precedes(bar, screen.getByRole("main"))).toBe(true);
    // Chrome, not page content: the bar is outside the `main` landmark, so it
    // does not scroll with the page and does not belong to it.
    expect(screen.getByRole("main")).not.toContainElement(bar);
  });

  it("puts each column's header in its own toggle row, above its content", () => {
    stubViewport(true);
    renderShell();

    const left = screen.getByRole("complementary", { name: "Navigationsspalte" });
    const brand = within(left).getByText("Marke");
    const toggle = within(left).getByRole("button", { name: "Navigation einklappen" });
    const nav = within(left).getByRole("navigation", { name: "Hauptnavigation" });
    const footer = within(left).getByRole("button", { name: "Abmelden" });

    // [header … toggle] on a left column (SidePanel's contract), then the
    // content, then the pinned footer — one column, four things, one order.
    expect(precedes(brand, toggle)).toBe(true);
    expect(precedes(toggle, nav)).toBe(true);
    expect(precedes(nav, footer)).toBe(true);

    // The right pane is a card over the page: its header carries no toggle,
    // that one is the bar's (see „right column" below).
    const right = screen.getByRole("complementary", { name: "Quellen" });
    expect(within(right).getByText("Quellen")).toBeInTheDocument();
    expect(within(right).queryByRole("button", { name: "Quellen einklappen" })).toBeNull();
  });

  it("points each toggle at the column body it controls, resolved and distinct", () => {
    stubViewport(true);
    renderShell();

    const resolved: HTMLElement[] = [];
    for (const [toggleName, contentText] of [
      ["Navigation einklappen", "Bereich A"],
      ["Quellen einklappen", "Quellen-Inhalt"],
    ] as const) {
      const toggle = screen.getByRole("button", { name: toggleName });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      const body = document.getElementById(toggle.getAttribute("aria-controls") ?? "");
      expect(body).not.toBeNull();
      expect(body).toContainElement(screen.getByText(contentText));
      resolved.push(body as HTMLElement);
    }
    // The wiring bug this pins: both toggles pointing at one column.
    expect(resolved[0]).not.toBe(resolved[1]);
  });

  it("reports a collapse to its own column only — the other one does not move", async () => {
    stubViewport(true);
    const left = leftPanel();
    const right = rightPanel();
    renderShell({ left, right });

    const rightColumn = screen.getByRole("complementary", { name: "Quellen" });
    expect(rightColumn).toHaveAttribute(
      "style",
      expect.stringContaining(`${RIGHT_WIDTH}px`),
    );

    await userEvent.click(screen.getByRole("button", { name: "Navigation einklappen" }));

    expect(left.onOpenChange).toHaveBeenCalledWith(false);
    expect(right.onOpenChange).not.toHaveBeenCalled();
    // Unmoved, measured against the width THIS FILE passed in: same element,
    // same inline width, same expanded controls.
    expect(screen.getByRole("complementary", { name: "Quellen" })).toBe(rightColumn);
    expect(rightColumn).toHaveAttribute(
      "style",
      expect.stringContaining(`${RIGHT_WIDTH}px`),
    );
    expect(screen.getByRole("button", { name: "Quellen einklappen" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Quellen-Inhalt")).toBeVisible();
  });

  /*
    The shell-level half of the same 0.30.0 regression: a collapsed nav column
    must still carry its footer, because that is typically the only route to
    sign-out. Before the fix the shell pinned `footer` inside `SidePanel`'s
    children, i.e. inside the region the collapse hides — the control was in the
    document and unreachable, so only a visibility oracle catches it.
  */
  it("keeps the collapsed column's footer reachable in the rail", () => {
    stubViewport(true);
    renderShell({ left: leftPanel({ isOpen: false }) });

    const leftColumn = screen.getByRole("complementary", { name: "Navigationsspalte" });
    expect(within(leftColumn).getByRole("button", { name: "Abmelden" })).toBeVisible();
  });

  it("collapses a column to the rail and leaves the other one expanded", async () => {
    stubViewport(true);
    const left = leftPanel({ isOpen: false });
    renderShell({ left });

    const leftColumn = screen.getByRole("complementary", { name: "Navigationsspalte" });
    // The rail: the exported design constant, not a literal 60 restated here.
    expect(leftColumn).toHaveAttribute(
      "style",
      expect.stringContaining(`${SIDE_PANEL_RAIL_WIDTH}px`),
    );
    // Only the way back out is on screen; the header is gone with the rest.
    const expand = within(leftColumn).getByRole("button", {
      name: "Navigation ausklappen",
    });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expect(within(leftColumn).queryByText("Marke")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Hauptnavigation" }),
    ).not.toBeInTheDocument();

    // …while the right column is untouched and still full width.
    expect(screen.getByText("Quellen-Inhalt")).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Quellen" })).toHaveAttribute(
      "style",
      expect.stringContaining(`${RIGHT_WIDTH}px`),
    );

    await userEvent.click(expand);
    expect(left.onOpenChange).toHaveBeenCalledWith(true);
  });

  it("falls back to the 256px default width when a column names none", () => {
    stubViewport(true);
    // Oracle: the published default — 16rem = the `--width-sidebar` token at
    // the 16px default root size, i.e. what the fixed column measured before
    // 0.30.0. The token itself is measured in Chromium by the
    // `WithCollapsibleColumns` story; jsdom loads no stylesheet.
    renderShell({ left: leftPanel({ width: undefined }) });
    expect(
      screen.getByRole("complementary", { name: "Navigationsspalte" }),
    ).toHaveAttribute("style", expect.stringContaining("256px"));
  });

  it("renders no right column and no rail when `right` is omitted", () => {
    stubViewport(true);
    renderShell({ right: undefined });

    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    for (const name of ["Quellen einklappen", "Quellen ausklappen"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("renders no left column and no rail when `left` is omitted", () => {
    stubViewport(true);
    renderShell({ left: undefined });

    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect(screen.getByRole("complementary")).toHaveAccessibleName("Quellen");
    for (const name of ["Navigation einklappen", "Navigation ausklappen"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });
});

/**
 * Resizable columns (0.36.0). The shell composes `SidePanel` + `ResizeHandle`
 * per column — so what is under test here is the **wiring**, not the widget: which numbers reach
 * the separator, which element its `aria-controls` names, which `side` it is
 * handed, and in which states it exists at all. `ResizeHandle`'s own behaviour
 * (clamping, the pointer drag, Home/End) is asserted in
 * `resize-handle.test.tsx` and is deliberately not restated.
 */
describe("AppShell — resizable columns", () => {
  it("gives the resizable left column a separator with the consumer's own numbers, the floating right pane none", () => {
    stubViewport(true);
    renderShell({
      left: leftPanel({ resize: leftResize() }),
      right: rightPanel({ resize: rightResize() }),
    });

    // Found by role and accessible name, both computed from the markup by
    // Testing Library — not by a class and not by a test id.
    const left = screen.getByRole("separator", { name: "Breite der Navigation ändern" });
    expect(left).toHaveAttribute("aria-valuemin", String(LEFT_MIN));
    expect(left).toHaveAttribute("aria-valuemax", String(LEFT_MAX));
    expect(left).toHaveAttribute("aria-valuenow", String(LEFT_WIDTH));

    // Exactly one: the right pane floats and takes no width in the row, so a
    // `resize` contract on it draws no separator — its `width` still sizes it.
    expect(screen.getAllByRole("separator")).toHaveLength(1);
    expect(screen.getByRole("complementary", { name: "Quellen" })).toHaveAttribute(
      "style",
      expect.stringContaining(`${RIGHT_WIDTH}px`),
    );
  });

  it("points the separator's aria-controls at its own column, resolved", () => {
    stubViewport(true);
    renderShell({
      left: leftPanel({ resize: leftResize() }),
      right: rightPanel({ resize: rightResize() }),
    });

    /* WAI-ARIA's id-reference contract plus the APG splitter's: the separator
       names the element whose size `aria-valuenow` reports, and an id
       reference has to RESOLVE — a dangling one is worse than none. So each
       case resolves the attribute through the document and pins the resolved
       element both to that column's `complementary` landmark and to the inline
       width this file passed in. The wiring bug this pins is both handles
       naming one column, and the one below it is the id landing on the inner
       body region (the collapse toggle's target) instead of the column root:
       that element carries no width at all. */
    const cases = [
      ["Breite der Navigation ändern", "Navigationsspalte", LEFT_WIDTH],
    ] as const;
    const resolved: HTMLElement[] = [];
    for (const [handleName, columnName, width] of cases) {
      const handle = screen.getByRole("separator", { name: handleName });
      const controls = handle.getAttribute("aria-controls");
      expect(controls).toBeTruthy();
      const column = document.getElementById(controls as string);
      expect(column).not.toBeNull();
      expect(column).toBe(screen.getByRole("complementary", { name: columnName }));
      expect(column).toHaveAttribute("style", expect.stringContaining(`${width}px`));
      resolved.push(column as HTMLElement);
    }
    expect(resolved).toHaveLength(1);
  });

  it("hands the left column's handle the side it sits on", async () => {
    stubViewport(true);
    const left = leftResize();
    const right = rightResize();
    renderShell({
      left: leftPanel({ resize: left }),
      right: rightPanel({ resize: right }),
    });

    /* `ResizeHandle`'s published mirroring is the oracle: the separator moves,
       and `aria-valuenow` reports the COLUMN's size, so one and the same key
       grows a left column and shrinks a right one. The shell's only decision
       is `side` — and a `side` swapped here would still produce two separators
       with correct bounds, correct names and correct `aria-controls`. Only the
       sign of the reported width catches it. */
    screen.getByRole("separator", { name: "Breite der Navigation ändern" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(left.onWidthChange).toHaveBeenCalledWith(LEFT_WIDTH + STEP);
    expect(right.onWidthChange).not.toHaveBeenCalled();
  });

  it("reports the default width when a resizable column names none", () => {
    stubViewport(true);
    // The same published 256 default the non-resizable case falls back to:
    // `aria-valuenow` and the column's inline width are one number, so a
    // handle that read its own fallback would show up as two.
    renderShell({
      left: leftPanel({ width: undefined, resize: leftResize() }),
      right: undefined,
    });
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "256");
    expect(
      screen.getByRole("complementary", { name: "Navigationsspalte" }),
    ).toHaveAttribute("style", expect.stringContaining("256px"));
  });

  it("renders no separator for a column without a resize contract", () => {
    stubViewport(true);
    // Every call site written before 0.36.0: `resize` omitted on both columns.
    renderShell();
    expect(screen.queryAllByRole("separator")).toHaveLength(0);
    // …and nothing else appears either: without a handle there is no reference
    // to resolve, so the column root keeps the DOM it had before this release.
    expect(screen.getByRole("complementary", { name: "Navigationsspalte" })).not.toHaveAttribute("id");
  });

  it("renders no separator next to a collapsed column", () => {
    stubViewport(true);
    renderShell({
      left: leftPanel({ isOpen: false, resize: leftResize() }),
      right: rightPanel({ resize: rightResize() }),
    });

    // The rail is a fixed 60px, so a separator there would report a value
    // nothing responds to.
    expect(
      screen.queryByRole("separator", { name: "Breite der Navigation ändern" }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByRole("separator")).toHaveLength(0);
  });

  it("renders no separator below lg, whichever area is on screen", () => {
    stubViewport(false);
    for (const activeMobileTab of ["nav", "page", "sources"] as const) {
      const { unmount } = renderShell({
        left: leftPanel({ resize: leftResize() }),
        right: rightPanel({ resize: rightResize() }),
        activeMobileTab,
      });
      // One area at a time: there is no neighbour to resize the column
      // against, and the area fills the screen.
      expect(screen.queryAllByRole("separator")).toHaveLength(0);
      unmount();
    }
  });
});

/**
 * `mainLabel` and `showRight` (0.37.0) — the two additive props that made the
 * former `WorkspaceLayout` (removed in KI-846) expressible as a call to this
 * component, so the library has one frame instead of two.
 *
 * Oracles, both outside the code under test:
 *
 * - **The accessible name computation** (aria-query + dom-accessibility-api
 *   behind Testing Library's `getByRole(…, { name })`), which derives the
 *   `main` landmark's name from `aria-label` per the ARIA in HTML mapping.
 *   Nothing here reads a class, and the unnamed case is asserted as the
 *   *absence* of the attribute, so „named" cannot pass by accident.
 * - **„Hidden is not collapsed"**, the rule documented for screens with two side columns
 *   since 0.23.1 and moved to this frame in 0.37.0: hiding must not travel
 *   through the consumer's `isOpen`, and must be ignored below `lg`, where one
 *   area fills the screen and a tab whose column refused to appear would be
 *   dead. It was written before this implementation existed, which is what
 *   keeps it an external contract here. Until KI-846 it was also checked
 *   against `WorkspaceLayout`; that template is removed, so this suite is now
 *   its only check.
 */
describe("AppShell — mainLabel (0.37.0)", () => {
  it.each([
    ["desktop", true, "page"],
    ["below lg", false, "page"],
  ] as const)("names the main landmark (%s)", (_name, isDesktop, activeMobileTab) => {
    stubViewport(isDesktop);
    renderShell({ mainLabel: "Arbeitsbereich", activeMobileTab });

    const main = screen.getByRole("main", { name: "Arbeitsbereich" });
    expect(main).toHaveTextContent("Inhalt");
    // Exactly one, in either arrangement — the name must not arrive twice.
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("leaves <main> unnamed when no label is given — no invented default", () => {
    stubViewport(true);
    renderShell();
    const main = screen.getByRole("main");
    expect(main).not.toHaveAttribute("aria-label");
    expect(main).toHaveAccessibleName("");
  });
});

describe("AppShell — showRight (0.37.0)", () => {
  it("takes the right column out of the desktop arrangement without collapsing it", () => {
    stubViewport(true);
    const right = rightPanel();
    renderShell({ right, showRight: false });

    expect(screen.queryByRole("complementary", { name: "Quellen" })).not.toBeInTheDocument();
    // Only the left column is left — the right one is gone, not collapsed to
    // its rail (a rail would still be a `complementary` landmark).
    const columns = screen.getAllByRole("complementary");
    expect(columns).toHaveLength(1);
    expect(columns[0]).toHaveAccessibleName("Navigationsspalte");
    // The whole point: hiding must not travel through the consumer's state.
    expect(right.onOpenChange).not.toHaveBeenCalled();
  });

  it("drops the hidden column's separator with it", () => {
    stubViewport(true);
    renderShell({
      right: rightPanel({ resize: rightResize() }),
      showRight: false,
    });
    expect(
      screen.queryByRole("separator", { name: "Breite der Quellen ändern" }),
    ).not.toBeInTheDocument();
  });

  it("is ignored below lg — the tab still shows the column", () => {
    stubViewport(false);
    const right = rightPanel();
    renderShell({ right, showRight: false, activeMobileTab: "sources" });

    expect(screen.getByRole("dialog", { name: "Quellen" })).toBeInTheDocument();
    expect(screen.getByText("Quellen-Inhalt")).toBeVisible();
    expect(right.onOpenChange).not.toHaveBeenCalled();
  });

  it("shows the column when the prop is omitted — the default is true", () => {
    stubViewport(true);
    renderShell();
    expect(screen.getByRole("complementary", { name: "Quellen" })).toBeInTheDocument();
  });
});

/**
 * The mechanism KI-797 reported and this card removes: the drawer mounted the
 * SAME node a second time, so a consumer's `id` inside the nav column existed
 * twice while it was open. With the drawer gone there is one mount per node.
 * Oracle: the id is the consumer's own (`nav-bereich-a`, set in `leftPanel()`),
 * counted with `querySelectorAll` — a count, not a claim about markup.
 */
describe("AppShell — every node is mounted once", () => {
  it.each([
    ["desktop, expanded", true, true, "page", 1],
    ["desktop, collapsed", true, false, "page", 1],
    ["narrow, the drawer open", false, true, "nav", 1],
    ["narrow, the drawer closed", false, true, "page", 0],
  ] as const)(
    "%s: the consumer's id occurs %i×",
    (_name, isDesktop, isOpen, activeMobileTab, expected) => {
      stubViewport(isDesktop);
      renderShell({
        left: leftPanel({ isOpen }),
        activeMobileTab,
      });
      // Over the whole document: the narrow drawer is portalled out of the frame.
      expect(document.querySelectorAll("#nav-bereich-a")).toHaveLength(expected);
    },
  );

  it.each([true, false])("puts no dialog in the tree while nothing is open (desktop: %s)", (isDesktop) => {
    stubViewport(isDesktop);
    const { container } = renderShell();
    // Queried over the whole document, because a drawer portals itself
    // outside the container.
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[aria-modal]")).toHaveLength(0);
  });
});

/**
 * `notice` (KI-936). Oracles: the ARIA `region` role (a `section` with an
 * accessible name), `compareDocumentPosition` for bar → notice → page, and
 * the consumer's own text.
 */
describe("AppShell — notice", () => {
  it.each([
    ["desktop", true, "page"],
    ["below lg, main area", false, "page"],
    ["below lg, the drawer open", false, "nav"],
  ] as const)("comes first, above the bar and the page (%s)", (_name, isDesktop, activeMobileTab) => {
    stubViewport(isDesktop);
    const { container } = renderShell({ notice: <p>Wartung am Freitag</p>, activeMobileTab });

    // `hidden`: an open drawer is modal and hides the frame behind it.
    const region = screen.getByRole("region", { name: "Systemmeldung", hidden: true });
    expect(region).toHaveTextContent("Wartung am Freitag");
    expect(precedes(region, screen.getByRole("banner", { hidden: true }))).toBe(true);
    expect(precedes(region, screen.getByRole("main", { hidden: true }))).toBe(true);
    // The frame's own first child: inside nothing, so it spans the frame.
    expect(container.firstElementChild?.firstElementChild).toBe(region);
  });

  it("spans the side columns on a wide screen instead of sitting in one", () => {
    stubViewport(true);
    renderShell({ notice: <p>Wartung</p> });
    const region = screen.getByRole("region", { name: "Systemmeldung" });
    for (const column of screen.getAllByRole("complementary")) {
      expect(column).not.toContainElement(region);
      expect(precedes(region, column)).toBe(true);
    }
  });

  it("does not remount the columns when a notice appears", () => {
    stubViewport(true);
    const { rerender } = renderShell();
    const main = screen.getByRole("main");
    rerender(
      <AppShell
        topBar={<span>Anwendung</span>}
        left={leftPanel()}
        right={rightPanel()}
        mobileTabs={TABS}
        activeMobileTab="page"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
        notice={<p>Wartung</p>}
      >
        <p>Inhalt</p>
      </AppShell>,
    );
    // Same node: the region was added above, nothing below was rebuilt.
    expect(screen.getByRole("main")).toBe(main);
  });

  it("takes the consumer's name for the region", () => {
    stubViewport(true);
    renderShell({ notice: <p>Wartung</p>, noticeLabel: "Hinweis des Betriebs" });
    expect(screen.getByRole("region", { name: "Hinweis des Betriebs" })).toBeInTheDocument();
  });

  it("renders no region when no notice is given", () => {
    stubViewport(true);
    const { container } = renderShell();
    expect(screen.queryByRole("region")).toBeNull();
    expect(container.querySelector("section")).toBeNull();
  });
});

/**
 * `status` + `statusPosition`. Oracles: document order (the corner layer is
 * after `<main>`, not inside the scrolling page; the top layer is main's first
 * child), the tab bar's `navigation` landmark, and `data-position`.
 */
describe("AppShell — status position", () => {
  it("floats at the top of the main area by default", () => {
    stubViewport(true);
    renderShell({ status: <p>Hohe Auslastung</p> });
    const layer = screen.getByText("Hohe Auslastung").closest<HTMLElement>("[data-slot=app-shell-status]")!;
    expect(layer).toHaveAttribute("data-position", "top");
    expect(screen.getByRole("main").firstElementChild).toBe(layer);
  });

  it("floats in the main area's top corner at top-end, in the status layer's place", () => {
    stubViewport(true);
    renderShell({ status: <p>Neue Version</p>, statusPosition: "top-end" });
    const layer = screen.getByText("Neue Version").closest<HTMLElement>("[data-slot=app-shell-status]")!;
    expect(layer).toHaveAttribute("data-position", "top-end");
    expect(screen.getByRole("main").firstElementChild).toBe(layer);
    expect(screen.getAllByText("Neue Version")).toHaveLength(1);
  });

  it("sits under the main area at bottom-end, outside the scrolling page and the side columns", () => {
    stubViewport(true);
    renderShell({ status: <p>Wartung</p>, statusPosition: "bottom-end" });
    const layer = screen.getByText("Wartung").closest<HTMLElement>("[data-slot=app-shell-status]")!;
    expect(layer).toHaveAttribute("data-position", "bottom-end");
    expect(screen.getByRole("main")).not.toContainElement(layer);
    expect(precedes(screen.getByRole("main"), layer)).toBe(true);
    for (const column of screen.getAllByRole("complementary")) {
      expect(column).not.toContainElement(layer);
    }
  });

  it("sits under the page below lg, whatever is open over it", () => {
    stubViewport(false);
    const { rerender } = renderShell({ status: <p>Wartung</p>, statusPosition: "bottom-end" });
    const layer = screen.getByText("Wartung").closest<HTMLElement>("[data-slot=app-shell-status]")!;
    expect(precedes(screen.getByRole("main"), layer)).toBe(true);

    rerender(
      <AppShell
        topBar={<span>Anwendung</span>}
        left={leftPanel()}
        right={rightPanel()}
        mobileTabs={TABS}
        activeMobileTab="nav"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
        status={<p>Wartung</p>}
        statusPosition="bottom-end"
      >
        <p>Inhalt</p>
      </AppShell>,
    );
    // The page stays on screen behind the drawer, and the message with it.
    expect(screen.getByText("Wartung")).toBeInTheDocument();
  });
});

/**
 * Below lg there is no tab bar (owner, 2026-11-17: neither reference chat app
 * has one): the page stays on screen, the navigation is a drawer over it and
 * the sources the same floating card as on a wide screen, each opened by its
 * toggle in the top bar. Which is open is the consumer's `activeMobileTab`.
 */
describe("AppShell — narrow-screen arrangement", () => {
  it("has no tab bar, and keeps the page on screen whatever is open", () => {
    stubViewport(false);
    for (const activeMobileTab of ["nav", "page", "sources"]) {
      const { unmount } = renderShell({ activeMobileTab });
      expect(screen.queryByRole("navigation", { name: "Bereichswechsel" })).toBeNull();
      expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
      expect(screen.getByRole("main", { hidden: true })).toHaveTextContent("Inhalt");
      unmount();
    }
  });

  it("keeps the top bar, with the navigation toggle at its start and the card's at its end", () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "page" });
    const bar = screen.getByRole("banner");
    expect(bar).toHaveTextContent("Anwendung");
    const names = within(bar).getAllByRole("button").map((button) => button.getAttribute("aria-label"));
    expect(names).toEqual(["Navigation ausklappen", "Quellen ausklappen"]);
    expect(precedes(within(bar).getByRole("button", { name: "Navigation ausklappen" }), screen.getByText("Anwendung"))).toBe(true);
    expect(precedes(screen.getByText("Anwendung"), within(bar).getByRole("button", { name: "Quellen ausklappen" }))).toBe(true);
    // Nothing is open: no drawer, the card hidden.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("complementary", { name: "Quellen" })).toBeNull();
  });

  it("opens the navigation as a drawer over the page, named and with the column's footer", async () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "nav" });
    const drawer = await screen.findByRole("dialog", { name: "Navigationsspalte" });
    expect(within(drawer).getByRole("navigation", { name: "Hauptnavigation" })).toBeInTheDocument();
    expect(within(drawer).getByText("Marke")).toBeInTheDocument();
    // Typically the only route to sign-out.
    expect(within(drawer).getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
  });

  it("puts the column's primary action in the drawer's bottom row, after the footer, and nowhere on a wide screen", async () => {
    stubViewport(false);
    const left = leftPanel({ narrowAction: <button type="button">Neuer Chat</button> });
    const narrow = renderShell({ left, activeMobileTab: "nav" });
    const drawer = await screen.findByRole("dialog", { name: "Navigationsspalte" });
    const row = drawer.querySelector("[data-slot='app-shell-drawer-actions']")!;
    const action = within(drawer).getByRole("button", { name: "Neuer Chat" });
    expect(row).toContainElement(action);
    expect(row).toContainElement(within(drawer).getByRole("button", { name: "Abmelden" }));
    expect(precedes(within(drawer).getByRole("button", { name: "Abmelden" }), action)).toBe(true);
    expect(precedes(within(drawer).getByRole("navigation", { name: "Hauptnavigation" }), row)).toBe(true);
    narrow.unmount();
    stubViewport(true);
    renderShell({ left });
    expect(screen.queryByRole("button", { name: "Neuer Chat" })).toBeNull();
  });

  it("reports the area a toggle asks for, and decides nothing itself", async () => {
    stubViewport(false);
    const onMobileTabChange = vi.fn();
    renderShell({ onMobileTabChange, activeMobileTab: "page" });
    await userEvent.click(screen.getByRole("button", { name: "Navigation ausklappen" }));
    expect(onMobileTabChange).toHaveBeenLastCalledWith("nav");
    await userEvent.click(screen.getByRole("button", { name: "Quellen ausklappen" }));
    expect(onMobileTabChange).toHaveBeenLastCalledWith("sources");
    // Controlled: still nothing open.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks for the main area when the drawer is closed from inside", async () => {
    stubViewport(false);
    const onMobileTabChange = vi.fn();
    renderShell({ onMobileTabChange, activeMobileTab: "nav" });
    const drawer = await screen.findByRole("dialog", { name: "Navigationsspalte" });
    await userEvent.click(within(drawer).getByRole("button", { name: "Navigation einklappen" }));
    expect(onMobileTabChange).toHaveBeenLastCalledWith("page");
  });

  it("shows the sources as a drawer, opened by the area and closed to the main one", async () => {
    stubViewport(false);
    const onMobileTabChange = vi.fn();
    const right = rightPanel({ isOpen: false, closeLabel: "Quellen schließen" });
    const { container } = renderShell({ right, onMobileTabChange, activeMobileTab: "sources" });
    // A drawer over the page, not a card floating in it.
    const card = screen.getByRole("dialog", { name: "Quellen" });
    expect(card).toHaveAttribute("data-direction", "bottom");
    expect(container.querySelector("[data-slot='app-shell-content']")).not.toContainElement(card);
    expect(card).toHaveTextContent("Quellen-Inhalt");
    await userEvent.click(within(card).getByRole("button", { name: "Quellen schließen" }));
    expect(onMobileTabChange).toHaveBeenLastCalledWith("page");
    // The wide screen's open state is neither read nor written here.
    expect(right.onOpenChange).not.toHaveBeenCalled();
  });

  it("closes a drawer back to the main-area id that was current, not the first one", async () => {
    stubViewport(false);
    const onMobileTabChange = vi.fn();
    const tabs = [
      { id: "nav", icon: <span />, label: "Navigation", pane: "left" as const },
      { id: "one", icon: <span />, label: "Eins", pane: "main" as const },
      { id: "two", icon: <span />, label: "Zwei", pane: "main" as const },
    ];
    const view = renderShell({ mobileTabs: tabs, activeMobileTab: "two", onMobileTabChange });
    view.rerender(shellElement({ mobileTabs: tabs, activeMobileTab: "nav", onMobileTabChange }));
    await userEvent.keyboard("{Escape}");
    expect(onMobileTabChange).toHaveBeenLastCalledWith("two");
  });

  it("does not read the wide screen's collapse preference: a drawer starts closed", () => {
    stubViewport(false);
    const left = leftPanel({ isOpen: true });
    renderShell({ left, activeMobileTab: "page" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(left.onOpenChange).not.toHaveBeenCalled();
  });

  it("shows only the page for an area whose column this shell lacks", () => {
    stubViewport(false);
    renderShell({ right: undefined, activeMobileTab: "sources" });
    expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
    expect(screen.queryAllByRole("complementary")).toHaveLength(0);
  });

  it("reserves no room at the bottom of the page", () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "page" });
    expect(screen.getByRole("main").getAttribute("style")).toBeNull();
  });

  it("does not ask the page to keep clear of the card", () => {
    stubViewport(false);
    const { container } = renderShell({ activeMobileTab: "sources" });
    expect(
      container.querySelector<HTMLElement>("[data-slot='app-shell-content']")!.style.getPropertyValue("--app-shell-bubble-inset"),
    ).toBe("");
  });
});

describe("AppShell — viewport switch", () => {
  it("asks for Tailwind's own lg boundary", () => {
    stubViewport(true);
    renderShell();
    // `--breakpoint-md: 48rem` in Tailwind's theme — the boundary the `lg:`
    // utilities in this library use.
    expect(askedQueries).toContain("(min-width: 48rem)");
  });

  it("falls back to the desktop arrangement where matchMedia does not exist", () => {
    vi.stubGlobal("matchMedia", undefined);
    renderShell();
    expect(
      screen.getByRole("complementary", { name: "Navigationsspalte" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Quellen" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
  });

  it("renders the desktop arrangement on a server, without touching the DOM", () => {
    // The third argument of `useSyncExternalStore` is the server snapshot and
    // only runs during SSR/hydration, so a `render()` cannot reach it. Oracle:
    // React's documented SSR contract for the hook, plus the requirement that
    // a shared library not crash while rendered on a server.
    const html = renderToString(
      <AppShell
        topBar={<span>Anwendung</span>}
        left={leftPanel()}
        right={rightPanel()}
        mobileTabs={TABS}
        activeMobileTab="page"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
      >
        <p>Inhalt</p>
      </AppShell>,
    );
    expect(html).toContain('aria-label="Navigationsspalte"');
    expect(html).toContain('aria-label="Quellen"');
    expect(html).toContain("<main");
    // …and not the narrow-screen arrangement, whose bar is the tell.
    expect(html).not.toContain('aria-label="Bereichswechsel"');
  });
});

/**
 * Native shell (KI-998). The oracle is the card's acceptance plus the owner's
 * review of the first build: with the title bar hidden (`<html
 * data-titlebar>`) the frame's first row is the window's title bar — window
 * controls, then the sidebar toggle, then the brand, in one row — nothing may
 * sit under the controls, and without the attribute nothing changes. jsdom
 * applies no CSS; the geometry is measured in Chromium by
 * `Templates/AppShellLayout` › NativeShell.
 */
describe("AppShell — native shell", () => {
  const hideTitlebar = (mode: "inset" | "hidden" = "inset") => {
    document.documentElement.dataset.titlebar = mode;
  };
  afterEach(() => {
    delete document.documentElement.dataset.titlebar;
  });

  const insetOwners = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("[data-titlebar-inset]"));

  it("changes nothing on the web: no inset owner, the toggle after the brand, the notice first", () => {
    stubViewport(true);
    const { container } = renderShell({ notice: <p>Wartung</p> });
    expect(insetOwners(container)).toEqual([]);
    expect(
      precedes(screen.getByText("Marke"), screen.getByRole("button", { name: "Navigation einklappen" })),
    ).toBe(true);
    expect(container.firstElementChild?.firstElementChild).toBe(
      screen.getByRole("region", { name: "Systemmeldung" }),
    );
  });

  it.each(["inset", "hidden"] as const)(
    "keeps the brand at the start of the left column's header row, the toggle after it (%s)",
    (mode) => {
      hideTitlebar(mode);
      stubViewport(true);
      const { container } = renderShell();
      const owners = insetOwners(container);
      expect(owners).toHaveLength(1);
      expect(owners[0]).toHaveAttribute("data-titlebar-inset", "start");
      const toggle = screen.getByRole("button", { name: "Navigation einklappen" });
      expect(owners[0]).toContainElement(toggle);
      expect(owners[0].firstElementChild).toContainElement(screen.getByText("Marke"));
      expect(precedes(screen.getByText("Marke"), toggle)).toBe(true);
    },
  );

  describe("right column", () => {
    it("floats over the main area instead of standing beside it, with its toggle in the bar", async () => {
      hideTitlebar();
      stubViewport(true);
      const onOpenChange = vi.fn();
      const { container } = renderShell({ right: rightPanel({ onOpenChange, resize: rightResize() }) });
      const pane = screen.getByRole("complementary", { name: "Quellen" });
      // Inside the main column's box, after the page: over it, not beside it.
      const content = container.querySelector("[data-slot='app-shell-content']")!;
      expect(content).toContainElement(pane);
      expect(precedes(screen.getByRole("main"), pane)).toBe(true);
      expect(pane).toHaveTextContent("Quellen-Inhalt");
      // No width of its own in the row: no separator.
      expect(screen.queryByRole("separator", { name: "Breite der Quellen ändern" })).toBeNull();
      // Its one toggle is the bar's last control and names the pane.
      const toggle = within(screen.getByRole("banner")).getByRole("button", { name: "Quellen einklappen" });
      expect(precedes(screen.getByText("Anwendung"), toggle)).toBe(true);
      expect(pane).not.toContainElement(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toBe(pane);
      await userEvent.click(toggle);
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    });

    it("hides the closed pane without unmounting it, and leaves no rail", async () => {
      hideTitlebar();
      stubViewport(true);
      const onOpenChange = vi.fn();
      renderShell({ right: rightPanel({ isOpen: false, onOpenChange }) });
      expect(screen.queryByRole("complementary", { name: "Quellen" })).toBeNull();
      expect(screen.getByText("Quellen-Inhalt")).not.toBeVisible();
      const toggle = within(screen.getByRole("banner")).getByRole("button", { name: "Quellen ausklappen" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(toggle);
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    });

    it("marks the shown pane on its toggle and takes the toggle's icon from the panel", () => {
      hideTitlebar();
      stubViewport(true);
      const open = renderShell({ right: rightPanel({ toggleIcon: <svg data-testid="quellen-icon" /> }) });
      const toggle = within(screen.getByRole("banner")).getByRole("button", { name: "Quellen einklappen" });
      expect(toggle).toHaveAttribute("data-state", "open");
      expect(toggle).toContainElement(screen.getByTestId("quellen-icon"));
      open.unmount();
      renderShell({ right: rightPanel({ isOpen: false }) });
      const closed = within(screen.getByRole("banner")).getByRole("button", { name: "Quellen ausklappen" });
      expect(closed).toHaveAttribute("data-state", "closed");
      expect(closed.querySelector("svg")).not.toBeNull();
    });

    it("keeps a locked pane's toggle in the bar, disabled and described, and renders no card", async () => {
      stubViewport(true);
      const onOpenChange = vi.fn();
      const { container } = renderShell({
        right: rightPanel({ isOpen: true, onOpenChange, locked: { description: "Für deine Rolle nicht freigegeben" } }),
      });
      expect(screen.queryByRole("complementary", { name: "Quellen" })).toBeNull();
      expect(screen.queryByText("Quellen-Inhalt")).toBeNull();
      const toggle = within(screen.getByRole("banner")).getByRole("button", { name: "Quellen ausklappen" });
      expect(toggle).toHaveAttribute("aria-disabled", "true");
      expect(toggle).not.toHaveAttribute("aria-expanded");
      expect(toggle).not.toHaveAttribute("aria-controls");
      expect(toggle).toHaveAccessibleDescription("Für deine Rolle nicht freigegeben");
      expect(toggle.querySelector("[data-slot='app-shell-right-toggle-lock']")).not.toBeNull();
      await userEvent.click(toggle);
      expect(onOpenChange).not.toHaveBeenCalled();
      // Nothing is covered, so nothing is published.
      expect(
        container.querySelector<HTMLElement>("[data-slot='app-shell-content']")!.style.getPropertyValue("--app-shell-bubble-inset"),
      ).toBe("");
    });

    it("shows the main area, not a locked pane's content, when a narrow tab points at it", () => {
      stubViewport(false);
      renderShell({
        activeMobileTab: "sources",
        right: rightPanel({ locked: { description: "Für deine Rolle nicht freigegeben" } }),
      });
      expect(screen.queryByText("Quellen-Inhalt")).toBeNull();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("shows the toggle's tooltip on keyboard focus", async () => {
      stubViewport(true);
      renderShell({ right: rightPanel({ toggleTooltip: "Quellen des Themas" }) });
      await userEvent.tab();
      const toggle = within(screen.getByRole("banner")).getByRole("button", { name: "Quellen einklappen" });
      toggle.focus();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Quellen des Themas");
    });

    it("publishes what the open pane covers, on the web too, and nothing while it is closed", () => {
      const inset = (container: HTMLElement) =>
        container
          .querySelector<HTMLElement>("[data-slot='app-shell-content']")!
          .style.getPropertyValue("--app-shell-bubble-inset");
      hideTitlebar();
      stubViewport(true);
      const open = renderShell({ right: rightPanel({ width: 300 }) });
      expect(inset(open.container)).toBe("calc(300px + 1rem)");
      open.unmount();
      const closed = renderShell({ right: rightPanel({ isOpen: false, width: 300 }) });
      expect(inset(closed.container)).toBe("");
      closed.unmount();
      delete document.documentElement.dataset.titlebar;
      const web = renderShell({ right: rightPanel({ width: 300 }) });
      expect(inset(web.container)).toBe("calc(300px + 1rem)");
    });

    it("has neither pane nor toggle while showRight is false", () => {
      hideTitlebar();
      stubViewport(true);
      renderShell({ showRight: false });
      expect(screen.queryByText("Quellen-Inhalt")).toBeNull();
      expect(screen.queryByRole("button", { name: /Quellen/ })).toBeNull();
    });

    it("floats on the web too, with its toggle in the bar", () => {
      stubViewport(true);
      const { container } = renderShell();
      const pane = screen.getByRole("complementary", { name: "Quellen" });
      expect(container.querySelector("[data-slot='app-shell-content']")).toContainElement(pane);
      const toggle = within(screen.getByRole("banner")).getByRole("button", { name: "Quellen einklappen" });
      expect(pane).not.toContainElement(toggle);
    });
  });

  it("keeps a collapsed column out of the title bar: the bar carries its toggle", async () => {
    hideTitlebar();
    stubViewport(true);
    const onOpenChange = vi.fn();
    const { container } = renderShell({ left: leftPanel({ isOpen: false, onOpenChange }) });
    const banner = screen.getByRole("banner");
    const toggle = await within(banner).findByRole("button", { name: "Navigation ausklappen" });
    // In the bar, before the bar's own content, and no longer in the rail.
    expect(precedes(toggle, screen.getByText("Anwendung"))).toBe(true);
    // The brand stays: first in the bar, before the toggle, mounted once.
    const brand = within(banner).getByText("Marke");
    expect(banner.firstElementChild).toContainElement(brand);
    expect(precedes(brand, toggle)).toBe(true);
    expect(screen.getAllByText("Marke")).toHaveLength(1);
    const rail = screen.getByRole("complementary", { name: "Navigationsspalte" });
    expect(rail).not.toContainElement(toggle);
    expect(insetOwners(container)).toEqual([banner]);
    // Still the column's own control: it names the body it opens, and opens it.
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).not.toBeNull();
    expect(rail).toContainElement(document.getElementById(toggle.getAttribute("aria-controls")!));
    await userEvent.click(toggle);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("carries the toggle in the empty title-bar row when the shell has no bar", async () => {
    hideTitlebar();
    stubViewport(true);
    const { container } = renderShell({ topBar: undefined, left: leftPanel({ isOpen: false }) });
    const strip = container.querySelector("[data-slot='app-shell-titlebar']") as HTMLElement;
    expect(await within(strip).findByRole("button", { name: "Navigation ausklappen" })).toBeVisible();
  });

  it("does not remount the bar's content when the column collapses", () => {
    hideTitlebar();
    stubViewport(true);
    const { rerender } = renderShell();
    const content = screen.getByText("Anwendung");
    rerender(
      <AppShell
        topBar={<span>Anwendung</span>}
        left={leftPanel({ isOpen: false })}
        right={rightPanel()}
        mobileTabs={TABS}
        activeMobileTab="page"
        onMobileTabChange={() => {}}
        mobileTabBarLabel="Bereichswechsel"
      >
        <p>Inhalt</p>
      </AppShell>,
    );
    expect(screen.getByText("Anwendung")).toBe(content);
  });

  it.each([
    ["a shell without a left column", true, { left: undefined }],
    ["below lg", false, {}],
  ] as const)("gives the corner to the bar in %s", (_name, isDesktop, props) => {
    hideTitlebar();
    stubViewport(isDesktop);
    const { container } = renderShell(props);
    expect(insetOwners(container)).toEqual([screen.getByRole("banner")]);
  });

  it("makes the notice the frame's last row on a wide screen, across the side columns", () => {
    hideTitlebar();
    stubViewport(true);
    const { container } = renderShell({ notice: <p>Wartung</p> });
    const region = screen.getByRole("region", { name: "Systemmeldung" });
    const frame = container.firstElementChild!;
    expect(frame.lastElementChild).toBe(region);
    for (const area of [
      screen.getByRole("banner"),
      screen.getByRole("main"),
      screen.getByRole("complementary", { name: "Navigationsspalte" }),
      screen.getByRole("complementary", { name: "Quellen" }),
    ]) {
      expect(precedes(area, region)).toBe(true);
      expect(area.contains(region)).toBe(false);
    }
    expect(insetOwners(container)).not.toContain(region);
  });

  it.each([
    ["nothing open", "page"],
    ["the drawer open", "nav"],
  ] as const)("makes the notice the frame's last row below lg (%s)", (_name, activeMobileTab) => {
    hideTitlebar();
    stubViewport(false);
    const { container } = renderShell({ notice: <p>Wartung</p>, activeMobileTab });
    const region = screen.getByRole("region", { name: "Systemmeldung", hidden: true });
    expect(precedes(screen.getByRole("main", { hidden: true }), region)).toBe(true);
    expect(container.firstElementChild!.lastElementChild).toBe(region);
  });

  it("does not remount the page when the title bar mode changes", () => {
    stubViewport(true);
    const { container } = renderShell({ notice: <p>Wartung</p> });
    const page = screen.getByText("Inhalt");
    act(() => hideTitlebar());
    return waitFor(() => {
      expect(container.firstElementChild!.lastElementChild).toBe(
        screen.getByRole("region", { name: "Systemmeldung" }),
      );
      expect(screen.getByText("Inhalt")).toBe(page);
    });
  });

  it.each([
    ["a shell without a left column", true, { left: undefined }],
    ["a collapsed left column", true, { left: leftPanel({ isOpen: false }) }],
    ["below lg, main area", false, {}],
    ["below lg, the drawer open", false, { activeMobileTab: "nav" }],
  ] as const)("keeps the area clear with an empty title-bar row when there is no bar (%s)", (_name, isDesktop, props) => {
    hideTitlebar();
    stubViewport(isDesktop);
    const { container } = renderShell({ topBar: undefined, ...props });
    const strip = container.querySelector("[data-slot='app-shell-titlebar']");
    expect(strip).toHaveAttribute("data-app-region", "drag");
    expect(precedes(strip!, screen.getByRole("main", { hidden: true }))).toBe(true);
  });

  it("renders no empty row on the web, or when there is nothing for it to carry", () => {
    stubViewport(true);
    const web = renderShell({ topBar: undefined, left: undefined, right: undefined });
    expect(web.container.querySelector("[data-slot='app-shell-titlebar']")).toBeNull();
    web.unmount();
    hideTitlebar();
    // Nothing for a title row to carry: the left column holds the corner
    // and there is no floating right pane whose toggle it would hold.
    const expanded = renderShell({ topBar: undefined, right: undefined });
    expect(expanded.container.querySelector("[data-slot='app-shell-titlebar']")).toBeNull();
  });

  describe("titlebarControls", () => {
    const controls = <button type="button">Zurück</button>;

    it("renders nothing on the web", () => {
      stubViewport(true);
      renderShell({ titlebarControls: controls });
      expect(screen.queryByRole("button", { name: "Zurück" })).toBeNull();
    });

    it("stands in the open left column's header row, after the brand and before the toggle", () => {
      hideTitlebar();
      stubViewport(true);
      renderShell({ titlebarControls: controls });
      const column = screen.getByRole("complementary", { name: "Navigationsspalte" });
      const back = within(column).getByRole("button", { name: "Zurück" });
      expect(precedes(screen.getByText("Marke"), back)).toBe(true);
      expect(precedes(back, screen.getByRole("button", { name: "Navigation einklappen" }))).toBe(true);
      expect(screen.getAllByRole("button", { name: "Zurück" })).toHaveLength(1);
    });

    // Oracle: the APG window splitter — `aria-valuenow` lies within
    // `aria-valuemin`…`aria-valuemax` and is what the column measures.
    it("keeps a resizable column's separator on the widened width and within its bounds", () => {
      hideTitlebar();
      stubViewport(true);
      renderShell({
        left: leftPanel({ width: 233, resize: leftResize({ minWidth: 150, maxWidth: 260 }) }),
        titlebarControls: controls,
      });
      const column = screen.getByRole("complementary", { name: "Navigationsspalte" });
      const separator = screen.getByRole("separator", { name: "Breite der Navigation ändern" });
      const now = Number(separator.getAttribute("aria-valuenow"));
      expect(now).toBe(parseFloat(column.style.width));
      expect(now).toBeGreaterThanOrEqual(Number(separator.getAttribute("aria-valuemin")));
      expect(now).toBeLessThanOrEqual(Number(separator.getAttribute("aria-valuemax")));
      expect(Number(separator.getAttribute("aria-valuemin"))).toBe(now);
    });

    it("widens a narrow left column so the row fits, and only while it holds the controls", () => {
      hideTitlebar();
      stubViewport(true);
      const narrow = leftPanel({ width: 233 });
      const withControls = renderShell({ left: narrow, titlebarControls: controls });
      const widened = parseFloat(screen.getByRole("complementary", { name: "Navigationsspalte" }).style.width);
      expect(widened).toBeGreaterThan(233);
      withControls.unmount();
      renderShell({ left: narrow });
      expect(screen.getByRole("complementary", { name: "Navigationsspalte" }).style.width).toBe("233px");
    });

    it.each([
      ["a collapsed left column", true, { left: leftPanel({ isOpen: false }) }],
      ["a shell without a left column", true, { left: undefined }],
      ["below lg", false, {}],
    ] as const)("sits at the start of the bar with %s", async (_name, isDesktop, props) => {
      hideTitlebar();
      stubViewport(isDesktop);
      renderShell({ titlebarControls: controls, ...props });
      const banner = screen.getByRole("banner");
      const back = within(banner).getByRole("button", { name: "Zurück" });
      expect(precedes(back, screen.getByText("Anwendung"))).toBe(true);
      if ("left" in props && props.left) {
        const toggle = await within(banner).findByRole("button", { name: "Navigation ausklappen" });
        expect(precedes(toggle, back)).toBe(true);
      }
      expect(screen.getAllByRole("button", { name: "Zurück" })).toHaveLength(1);
    });
  });

  it("marks the frame's top row as the window's drag region", () => {
    hideTitlebar();
    stubViewport(true);
    renderShell();
    const drag = (el: Element | null) => el?.closest("[data-app-region='drag']");
    expect(drag(screen.getByText("Marke"))).not.toBeNull();
    expect(drag(screen.getByText("Anwendung"))).toBe(screen.getByRole("banner"));
    // The pages themselves do not drag the window.
    expect(drag(screen.getByText("Inhalt"))).toBeNull();
    expect(drag(screen.getByText("Bereich A"))).toBeNull();
  });
});

/**
 * `AppShellSidePanel`: a tabbed column at the frame's end edge that the page
 * declares. The oracle is the reported defect — a panel the page put at the
 * main area's end lay under the floating `right` card — plus the owner's
 * brief: a panel like a browser's, with tabs, a toggle that hides it and
 * keeps them, and a shell without one being the shell it was.
 */
describe("AppShell — side panel", () => {
  const PANEL_WIDTH = 417;
  const TWO_TABS = [
    { id: "a", title: "Quelle 3", closeLabel: "Quelle 3 schließen" },
    { id: "b", title: "Handbuch", closeLabel: "Handbuch schließen" },
  ];
  const panel = (overrides: Partial<AppShellSidePanelProps> = {}) => (
    <AppShellSidePanel
      label="Seitenbereich"
      isOpen
      onOpenChange={() => {}}
      expandLabel="Seitenbereich einblenden"
      collapseLabel="Seitenbereich ausblenden"
      tabs={TWO_TABS}
      activeTabId="a"
      onTabChange={() => {}}
      onTabClose={() => {}}
      tabListLabel="Geöffnete Inhalte"
      width={PANEL_WIDTH}
      empty={<p>Nichts geöffnet</p>}
      {...overrides}
    >
      <p>Zitat-Inhalt</p>
    </AppShellSidePanel>
  );
  const shell = (child: React.ReactNode, props: Partial<React.ComponentProps<typeof AppShell>> = {}) => (
    <AppShell
      topBar={<span>Anwendung</span>}
      left={leftPanel()}
      right={rightPanel()}
      mobileTabs={TABS}
      activeMobileTab="page"
      onMobileTabChange={() => {}}
      mobileTabBarLabel="Bereichswechsel"
      {...props}
    >
      <p>Inhalt</p>
      {child}
    </AppShell>
  );
  afterEach(() => {
    delete document.documentElement.dataset.titlebar;
  });

  it("stands after the main column, outside the box the floating card covers", () => {
    stubViewport(true);
    const { container } = render(shell(panel()));
    const column = screen.getByRole("complementary", { name: "Seitenbereich" });
    const content = container.querySelector("[data-slot='app-shell-content']")!;
    expect(container.querySelector("[data-slot='app-shell-row']")).toContainElement(column);
    expect(content).not.toContainElement(column);
    expect(precedes(content, column)).toBe(true);
    // The card stays in the main column's box, so it floats beside the panel.
    expect(content).toContainElement(screen.getByRole("complementary", { name: "Quellen" }));
    expect(column).toHaveStyle({ width: `${PANEL_WIDTH}px` });
    // Mounted once: not also where the page declared it.
    expect(screen.getByRole("main")).not.toContainElement(column);
    expect(screen.getAllByText("Zitat-Inhalt")).toHaveLength(1);
  });

  it("shows the tabs in a strip above the active tab's content, wired as a tablist", () => {
    stubViewport(true);
    const { container } = render(shell(panel()));
    const strip = container.querySelector("[data-slot='app-shell-side-panel-strip']")!;
    expect(strip.className).toContain("h-14");
    const list = within(strip as HTMLElement).getByRole("tablist", { name: "Geöffnete Inhalte" });
    const tabs = within(list).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Quelle 3", "Handbuch"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    // One tab stop for the strip.
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);
    const content = screen.getByRole("tabpanel", { name: "Quelle 3" });
    expect(content).toHaveTextContent("Zitat-Inhalt");
    expect(document.getElementById(tabs[0].getAttribute("aria-controls")!)).toBe(content);
    expect(precedes(strip, content)).toBe(true);
  });

  it("reports a chosen tab, by click and by arrow key, and decides nothing itself", async () => {
    stubViewport(true);
    const onTabChange = vi.fn();
    render(shell(panel({ onTabChange })));
    await userEvent.click(screen.getByRole("tab", { name: "Handbuch" }));
    expect(onTabChange).toHaveBeenLastCalledWith("b");
    screen.getByRole("tab", { name: "Quelle 3" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onTabChange).toHaveBeenLastCalledWith("b");
    expect(screen.getByRole("tab", { name: "Handbuch" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    // Wraps from the last tab to the first.
    expect(onTabChange).toHaveBeenLastCalledWith("a");
    // Controlled: nothing was selected by the component.
    expect(screen.getByRole("tab", { name: "Quelle 3" })).toHaveAttribute("aria-selected", "true");
  });

  it("gives each tab a close button of its own, outside the tab", async () => {
    stubViewport(true);
    const onTabClose = vi.fn();
    const onTabChange = vi.fn();
    render(shell(panel({ onTabClose, onTabChange })));
    const close = screen.getByRole("button", { name: "Handbuch schließen" });
    expect(screen.getByRole("tab", { name: "Handbuch" })).not.toContainElement(close);
    await userEvent.click(close);
    expect(onTabClose).toHaveBeenCalledExactlyOnceWith("b");
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("shows `empty` and no tabpanel while no tab is open, the toggle still there", () => {
    stubViewport(true);
    render(shell(panel({ tabs: [], activeTabId: null })));
    const column = screen.getByRole("complementary", { name: "Seitenbereich" });
    expect(column).toHaveTextContent("Nichts geöffnet");
    expect(column).not.toHaveTextContent("Zitat-Inhalt");
    expect(screen.queryByRole("tabpanel")).toBeNull();
    expect(within(column).getByRole("button", { name: "Seitenbereich ausblenden" })).toBeInTheDocument();
  });

  const LAUNCHERS = [
    { id: "sources", label: "Quellen" },
    { id: "browser", label: "Browser", disabled: true },
  ];

  it("lists what it can open in the empty panel, and reports the chosen kind", async () => {
    stubViewport(true);
    const onLaunch = vi.fn();
    render(shell(panel({
      tabs: [], activeTabId: null, empty: undefined,
      launchers: LAUNCHERS, onLaunch, addLabel: "Inhalt öffnen", launcherTitle: "Was möchtest du öffnen?",
    })));
    const column = screen.getByRole("complementary", { name: "Seitenbereich" });
    expect(column).toHaveTextContent("Was möchtest du öffnen?");
    expect(within(column).getByRole("button", { name: "Browser" })).toBeDisabled();
    await userEvent.click(within(column).getByRole("button", { name: "Quellen" }));
    expect(onLaunch).toHaveBeenCalledExactlyOnceWith("sources");
  });

  it("offers the same kinds from a + after the tabs, which is no tab", async () => {
    stubViewport(true);
    const onLaunch = vi.fn();
    render(shell(panel({ launchers: LAUNCHERS, onLaunch, addLabel: "Inhalt öffnen" })));
    const add = screen.getByRole("button", { name: "Inhalt öffnen" });
    const list = screen.getByRole("tablist");
    expect(list).not.toContainElement(add);
    expect(precedes(list, add)).toBe(true);
    expect(precedes(add, screen.getByRole("button", { name: "Seitenbereich ausblenden" }))).toBe(true);
    // With a tab open the content is the tab's, not the list.
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Zitat-Inhalt");
    await userEvent.click(add);
    await userEvent.click(await screen.findByRole("menuitem", { name: "Quellen" }));
    expect(onLaunch).toHaveBeenCalledExactlyOnceWith("sources");
  });

  it("has no + and no list without launchers", () => {
    stubViewport(true);
    render(shell(panel({ tabs: [], activeTabId: null, empty: undefined, addLabel: "Inhalt öffnen" })));
    expect(screen.queryByRole("button", { name: "Inhalt öffnen" })).toBeNull();
    expect(document.querySelector("[data-slot='app-shell-side-panel-launcher']")).toBeNull();
  });

  it("keeps its toggle at the end of the strip while shown, pointing at the panel", async () => {
    stubViewport(true);
    const onOpenChange = vi.fn();
    render(shell(panel({ onOpenChange })));
    const column = screen.getByRole("complementary", { name: "Seitenbereich" });
    const toggle = within(column).getByRole("button", { name: "Seitenbereich ausblenden" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toBe(column);
    expect(precedes(screen.getByRole("tablist"), toggle)).toBe(true);
    expect(within(screen.getByRole("banner")).queryByRole("button", { name: /Seitenbereich/ })).toBeNull();
    await userEvent.click(toggle);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("hidden, leaves only its toggle: the bar's last control, after the card's", async () => {
    stubViewport(true);
    const onOpenChange = vi.fn();
    render(shell(panel({ isOpen: false, onOpenChange })));
    expect(screen.queryByRole("complementary", { name: "Seitenbereich" })).toBeNull();
    expect(screen.queryByText("Zitat-Inhalt")).toBeNull();
    const toggle = within(screen.getByRole("banner")).getByRole("button", { name: "Seitenbereich einblenden" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).not.toHaveAttribute("aria-controls");
    expect(precedes(screen.getByRole("button", { name: "Quellen einklappen" }), toggle)).toBe(true);
    await userEvent.click(toggle);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("keeps the focus on the toggle when it moves between bar and strip", async () => {
    stubViewport(true);
    const Harness = () => {
      const [isOpen, setOpen] = React.useState(false);
      return shell(panel({ isOpen, onOpenChange: setOpen }));
    };
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Seitenbereich einblenden" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Seitenbereich ausblenden" })).toHaveFocus());
    await userEvent.click(screen.getByRole("button", { name: "Seitenbereich ausblenden" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Seitenbereich einblenden" })).toHaveFocus());
  });

  it("gets a separator on its content-facing edge only with a resize contract", async () => {
    stubViewport(true);
    const onWidthChange = vi.fn();
    const { rerender } = render(shell(panel()));
    expect(screen.queryByRole("separator", { name: "Breite des Seitenbereichs ändern" })).toBeNull();
    rerender(shell(panel({
      resize: { minWidth: 300, maxWidth: 700, onWidthChange, label: "Breite des Seitenbereichs ändern" },
    })));
    const handle = screen.getByRole("separator", { name: "Breite des Seitenbereichs ändern" });
    const column = screen.getByRole("complementary", { name: "Seitenbereich" });
    expect(precedes(handle, column)).toBe(true);
    expect(handle).toHaveAttribute("aria-valuenow", String(PANEL_WIDTH));
    expect(document.getElementById(handle.getAttribute("aria-controls")!)).toBe(column);
    handle.focus();
    // A pane on the right grows towards the left.
    await userEvent.keyboard("{ArrowLeft}");
    expect(onWidthChange).toHaveBeenCalledExactlyOnceWith(PANEL_WIDTH + STEP);
  });

  it("leaves a shell without one as it was: two empty slots that are no boxes", () => {
    stubViewport(true);
    const { container } = render(shell(null));
    const row = container.querySelector("[data-slot='app-shell-row']")!;
    const slot = container.querySelector("[data-slot='app-shell-panel-slot']")!;
    expect(row.lastElementChild).toBe(slot);
    expect(slot).toBeEmptyDOMElement();
    expect(slot.className).toBe("contents");
    const toggleSlot = container.querySelector("[data-slot='app-shell-panel-toggle-slot']")!;
    expect(toggleSlot).toBeEmptyDOMElement();
    expect(toggleSlot.className).toBe("contents");
    // The card's toggle is still the bar's last control.
    const buttons = within(screen.getByRole("banner")).getAllByRole("button");
    expect(buttons[buttons.length - 1]).toHaveAccessibleName("Quellen einklappen");
  });

  it("comes and goes without remounting the page", () => {
    stubViewport(true);
    const { rerender } = render(shell(null));
    const page = screen.getByText("Inhalt");
    rerender(shell(panel()));
    expect(screen.getByRole("complementary", { name: "Seitenbereich" })).toBeInTheDocument();
    expect(screen.getByText("Inhalt")).toBe(page);
    rerender(shell(panel({ isOpen: false })));
    expect(screen.queryByRole("complementary", { name: "Seitenbereich" })).toBeNull();
    expect(screen.getByText("Inhalt")).toBe(page);
  });

  it("is the same panel under a hidden title bar, its strip dragging the window", () => {
    document.documentElement.dataset.titlebar = "inset";
    stubViewport(true);
    const { container } = render(shell(panel()));
    const column = screen.getByRole("complementary", { name: "Seitenbereich" });
    expect(container.querySelector("[data-slot='app-shell-content']")).not.toContainElement(column);
    expect(container.querySelector("[data-slot='app-shell-side-panel-strip']")).toHaveAttribute("data-app-region", "drag");
    // The window controls are at the start: the panel owns no inset.
    expect(column.querySelector("[data-titlebar-inset]")).toBeNull();
    expect(container.querySelectorAll("[data-titlebar-inset]")).toHaveLength(1);
  });

  /**
   * The frame's shrinking rules. Oracle: the owner's brief — the left column
   * collapses by itself rather than squeeze the chat beside the panel, the
   * card lies over a narrow page instead of pushing it — with the reference
   * app's numbers: the main area keeps 360px, the panel takes at most 70%.
   * jsdom has no layout, so the frame's width is stubbed.
   */
  describe("shrinking rules", () => {
    const frameIs = (width: number) => {
      vi.stubGlobal("ResizeObserver", class {
        observe() {}
        disconnect() {}
      });
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
        return this.dataset.slot === "app-shell-row" ? width : 0;
      });
    };
    afterEach(() => {
      vi.restoreAllMocks();
    });
    const resize = { minWidth: 360, maxWidth: 900, onWidthChange: vi.fn(), label: "Breite des Seitenbereichs ändern" };

    it("shows the left column as its rail while it would crowd the main area, and never tells the consumer", async () => {
      stubViewport(true);
      // 895 − 311 leaves 584 for main area and panel: less than 360 + 360.
      frameIs(895);
      const onOpenChange = vi.fn();
      render(shell(panel({ resize }), { left: leftPanel({ onOpenChange }) }));
      const expand = await screen.findByRole("button", { name: "Navigation ausklappen" });
      expect(screen.queryByRole("button", { name: "Navigation einklappen" })).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
      // Expanding by hand is the user's call and holds.
      await userEvent.click(expand);
      expect(await screen.findByRole("button", { name: "Navigation einklappen" })).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("leaves the left column expanded while there is room, and without a shown panel", () => {
      stubViewport(true);
      frameIs(1400);
      const { rerender } = render(shell(panel({ resize })));
      expect(screen.getByRole("button", { name: "Navigation einklappen" })).toBeInTheDocument();
      vi.restoreAllMocks();
      frameIs(895);
      rerender(shell(panel({ resize, isOpen: false })));
      expect(screen.getByRole("button", { name: "Navigation einklappen" })).toBeInTheDocument();
    });

    it("caps the panel so the main area keeps 360px, down to the panel's minimum, and keeps the consumer's width", () => {
      stubViewport(true);
      // 1200 − 311 − 360 = 529 is less than 70% of 1200.
      frameIs(1200);
      render(shell(panel({ width: 800, resize })));
      const column = screen.getByRole("complementary", { name: "Seitenbereich" });
      expect(column).toHaveStyle({ width: "529px" });
      const handle = screen.getByRole("separator", { name: "Breite des Seitenbereichs ändern" });
      expect(handle).toHaveAttribute("aria-valuenow", "529");
      expect(handle).toHaveAttribute("aria-valuemax", "529");
      expect(resize.onWidthChange).not.toHaveBeenCalled();
    });

    it("caps the panel at 70% of a wide frame", () => {
      stubViewport(true);
      frameIs(2000);
      // The rail leaves 2000 − 60 − 360 = 1580, so the share is what binds.
      render(shell(panel({ width: 1600, resize: { ...resize, maxWidth: 1800 } }), { left: leftPanel({ isOpen: false }) }));
      expect(screen.getByRole("complementary", { name: "Seitenbereich" })).toHaveStyle({ width: "1400px" });
    });

    it("stops publishing the card's inset once the page would keep less than 360px beside it", () => {
      stubViewport(true);
      const inset = (container: HTMLElement) =>
        container.querySelector<HTMLElement>("[data-slot='app-shell-content']")!.style.getPropertyValue("--app-shell-bubble-inset");
      // Main area 1400 − 311 = 1089: the 233px card plus 16 leaves 840.
      frameIs(1400);
      const wide = render(shell(null));
      expect(inset(wide.container)).not.toBe("");
      wide.unmount();
      vi.restoreAllMocks();
      // Main area 900 − 311 = 589: 589 − 249 = 340, under 360.
      frameIs(900);
      const narrow = render(shell(null));
      expect(inset(narrow.container)).toBe("");
      // The card itself is still shown, over the page.
      expect(screen.getByRole("complementary", { name: "Quellen" })).toBeVisible();
    });

    /**
     * Rule 4, with a frame that changes width: the stub keeps the observers'
     * callbacks so a new width can be delivered as a resize would.
     */
    describe("the card where it stops fitting beside the page", () => {
      let width = 0;
      let notify: (() => void)[] = [];
      const frameStartsAt = (start: number) => {
        width = start;
        notify = [];
        vi.stubGlobal("ResizeObserver", class {
          constructor(callback: () => void) { notify.push(callback); }
          observe() {}
          disconnect() {}
        });
        vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
          return this.dataset.slot === "app-shell-row" ? width : 0;
        });
      };
      const frameBecomes = (next: number) => {
        width = next;
        act(() => notify.forEach((callback) => callback()));
      };

      it("closes an open card when the frame narrows past that width, once", () => {
        stubViewport(true);
        frameStartsAt(1400);
        const right = rightPanel();
        render(shell(null, { right }));
        expect(right.onOpenChange).not.toHaveBeenCalled();
        frameBecomes(800);
        expect(right.onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
        frameBecomes(780);
        expect(right.onOpenChange).toHaveBeenCalledTimes(1);
      });

      it("leaves a card alone that is opened by hand below that width, and does not reopen one on widening", () => {
        stubViewport(true);
        frameStartsAt(800);
        const onOpenChange = vi.fn();
        const { rerender } = render(shell(null, { right: rightPanel({ isOpen: false, onOpenChange }) }));
        rerender(shell(null, { right: rightPanel({ isOpen: true, onOpenChange }) }));
        expect(onOpenChange).not.toHaveBeenCalled();
        frameBecomes(1400);
        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it("closes the card when a side panel takes the room", () => {
        stubViewport(true);
        frameStartsAt(1200);
        const right = rightPanel();
        const { rerender } = render(shell(panel({ isOpen: false }), { right }));
        expect(right.onOpenChange).not.toHaveBeenCalled();
        rerender(shell(panel({ isOpen: true }), { right }));
        expect(right.onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
      });

      it("never closes it in the narrow frame, where the card is a sheet", () => {
        stubViewport(false);
        frameStartsAt(500);
        const right = rightPanel();
        render(shell(null, { right, activeMobileTab: "sources" }));
        expect(right.onOpenChange).not.toHaveBeenCalled();
      });
    });
  });

  describe("maximise", () => {
    const labels = { maximizeLabel: "Seitenbereich maximieren", restoreLabel: "Seitenbereich verkleinern" };
    const resize = { minWidth: 360, maxWidth: 900, onWidthChange: vi.fn(), label: "Breite ändern" };

    it("has no maximise button without both labels", () => {
      stubViewport(true);
      render(shell(panel({ maximizeLabel: "Seitenbereich maximieren" })));
      expect(screen.queryByRole("button", { name: "Seitenbereich maximieren" })).toBeNull();
    });

    it("covers the main area and comes back, keeping its own state", async () => {
      stubViewport(true);
      const { container } = render(shell(panel({ ...labels, resize })));
      const content = container.querySelector("[data-slot='app-shell-content']")!;
      const column = screen.getByRole("complementary", { name: "Seitenbereich" });
      expect(screen.getByRole("separator", { name: "Breite ändern" })).toBeInTheDocument();

      await userEvent.click(within(column).getByRole("button", { name: "Seitenbereich maximieren" }));
      expect(column).toHaveAttribute("data-maximized");
      expect(column).toHaveClass("absolute");
      // The covered page is out of reach, and there is no edge left to drag.
      expect(content).toHaveAttribute("inert");
      expect(screen.queryByRole("separator", { name: "Breite ändern" })).toBeNull();
      const restore = within(column).getByRole("button", { name: "Seitenbereich verkleinern" });
      expect(restore).toHaveAttribute("aria-pressed", "true");

      await userEvent.click(restore);
      expect(column).not.toHaveAttribute("data-maximized");
      expect(column).toHaveStyle({ width: `${PANEL_WIDTH}px` });
      expect(content).not.toHaveAttribute("inert");
    });

    it("follows the consumer's state when given, and reports the requested one", async () => {
      stubViewport(true);
      const onMaximizedChange = vi.fn();
      const { rerender } = render(shell(panel({ ...labels, isMaximized: false, onMaximizedChange })));
      await userEvent.click(screen.getByRole("button", { name: "Seitenbereich maximieren" }));
      expect(onMaximizedChange).toHaveBeenCalledExactlyOnceWith(true);
      expect(screen.getByRole("complementary", { name: "Seitenbereich" })).not.toHaveAttribute("data-maximized");
      rerender(shell(panel({ ...labels, isMaximized: true, onMaximizedChange })));
      expect(screen.getByRole("complementary", { name: "Seitenbereich" })).toHaveAttribute("data-maximized");
    });

    it("gives the page back when a maximised panel is hidden", () => {
      stubViewport(true);
      const { container, rerender } = render(shell(panel({ ...labels, isMaximized: true })));
      expect(container.querySelector("[data-slot='app-shell-content']")).toHaveAttribute("inert");
      rerender(shell(panel({ ...labels, isMaximized: true, isOpen: false })));
      expect(container.querySelector("[data-slot='app-shell-content']")).not.toHaveAttribute("inert");
    });
  });

  describe("launcher shortcuts", () => {
    const launchers = [
      { id: "citations", label: "Quellenangaben", shortcut: "Q" },
      { id: "browser", label: "Browser", shortcut: "B", disabled: true },
    ];
    const emptyPanel = (overrides: Partial<AppShellSidePanelProps> = {}) =>
      panel({ tabs: [], activeTabId: null, empty: undefined, launchers, addLabel: "Inhalt öffnen", ...overrides });

    it("lists the launchers in the empty panel with their keys", () => {
      stubViewport(true);
      render(shell(emptyPanel()));
      const row = screen.getByRole("button", { name: "Quellenangaben" });
      expect(row).toHaveAttribute("aria-keyshortcuts", "Q");
      expect(row).toHaveTextContent("Q");
    });

    it("opens a launcher on its key, in either case, with the focus nowhere or in the panel", async () => {
      stubViewport(true);
      const onLaunch = vi.fn();
      render(shell(emptyPanel({ onLaunch })));
      await userEvent.keyboard("q");
      expect(onLaunch).toHaveBeenLastCalledWith("citations");
      screen.getByRole("button", { name: "Seitenbereich ausblenden" }).focus();
      await userEvent.keyboard("Q");
      expect(onLaunch).toHaveBeenCalledTimes(2);
    });

    it("does not fire while the user types, with a modifier, for a disabled launcher, or outside the panel", async () => {
      stubViewport(true);
      const onLaunch = vi.fn();
      render(
        <>
          {shell(emptyPanel({ onLaunch }))}
        </>,
      );
      const field = document.createElement("input");
      screen.getByRole("main").append(field);
      field.focus();
      await userEvent.keyboard("q");
      field.blur();
      await userEvent.keyboard("{Control>}q{/Control}");
      await userEvent.keyboard("b");
      screen.getByRole("button", { name: "Navigation einklappen" }).focus();
      await userEvent.keyboard("q");
      expect(onLaunch).not.toHaveBeenCalled();
    });

    it("is off once a tab is open, and while the panel is hidden", async () => {
      stubViewport(true);
      const onLaunch = vi.fn();
      const { rerender } = render(shell(panel({ launchers, onLaunch, empty: undefined })));
      await userEvent.keyboard("q");
      rerender(shell(emptyPanel({ onLaunch, isOpen: false })));
      await userEvent.keyboard("q");
      expect(onLaunch).not.toHaveBeenCalled();
    });
  });

  describe("tooltips", () => {
    it("names the toggle on hover, with its shortcut as keys", async () => {
      stubViewport(true);
      render(shell(panel({ toggleKeyShortcuts: "Meta+Alt+B" })));
      const toggle = screen.getByRole("button", { name: "Seitenbereich ausblenden" });
      expect(toggle).toHaveAttribute("aria-keyshortcuts", "Meta+Alt+B");
      await userEvent.hover(toggle);
      const tip = await screen.findByRole("tooltip");
      expect(tip).toHaveTextContent("Seitenbereich ausblenden");
      expect(tip).toHaveTextContent("⌘");
      expect(tip).toHaveTextContent("⌥");
    });
  });

  describe("the card's close button", () => {
    it("is there only with closeLabel", () => {
      stubViewport(true);
      render(shell(null, { right: rightPanel() }));
      expect(screen.queryByRole("button", { name: "Quellen schließen" })).toBeNull();
    });

    it("closes the card and hands the focus to its toggle", async () => {
      stubViewport(true);
      const right = rightPanel({ closeLabel: "Quellen schließen" });
      render(shell(null, { right }));
      const card = screen.getByRole("complementary", { name: "Quellen" });
      await userEvent.click(within(card).getByRole("button", { name: "Quellen schließen" }));
      expect(right.onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
      expect(screen.getByRole("button", { name: "Quellen einklappen" })).toHaveFocus();
    });
  });

  it("fills the narrow frame when shown: over the page, without resize or maximise", () => {
    stubViewport(false);
    const { container } = render(shell(panel({
      maximizeLabel: "Maximieren", restoreLabel: "Verkleinern",
      resize: { minWidth: 360, maxWidth: 900, onWidthChange: () => {}, label: "Breite" },
    })));
    const column = screen.getByRole("complementary", { name: "Seitenbereich" });
    expect(column).toHaveClass("absolute");
    expect(column).toHaveStyle({ left: "0px" });
    expect(within(column).getByRole("button", { name: "Seitenbereich ausblenden" })).toBeInTheDocument();
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.queryByRole("button", { name: "Maximieren" })).toBeNull();
    // The covered page is out of reach until the panel is hidden.
    expect(container.querySelector("[data-slot='app-shell-content']")).toHaveAttribute("inert");
  });

  it("keeps a first row for the hidden panel's toggle in a frame with no bar of its own", () => {
    stubViewport(true);
    render(shell(panel({ isOpen: false }), { topBar: undefined, right: undefined }));
    expect(screen.getByRole("button", { name: "Seitenbereich einblenden" })).toBeInTheDocument();
  });

  it("hidden in the narrow frame, leaves its toggle at the end of the bar", () => {
    stubViewport(false);
    const { container } = render(shell(panel({ isOpen: false })));
    expect(screen.queryByRole("complementary", { name: "Seitenbereich" })).toBeNull();
    const toggle = screen.getByRole("button", { name: "Seitenbereich einblenden" });
    expect(container.querySelector("[data-slot='app-shell-bar-end']")).toContainElement(toggle);
    expect(container.querySelector("[data-slot='app-shell-content']")).not.toHaveAttribute("inert");
  });

  it("renders nothing outside a shell", () => {
    const { container } = render(panel());
    expect(container).toBeEmptyDOMElement();
  });
});
