import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { FolderOpen, Home, MessageSquare } from "lucide-react";
import {
  AppShell,
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

function renderShell(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return render(
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
    </AppShell>,
  );
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
 * - **„Hidden is not collapsed"**, the rule documented for workspace screens
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

    expect(screen.getByRole("complementary", { name: "Quellen" })).toBeInTheDocument();
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
    ["narrow, the nav tab", false, true, "nav", 1],
    ["narrow, the main tab", false, true, "page", 0],
  ] as const)(
    "%s: the consumer's id occurs %i×",
    (_name, isDesktop, isOpen, activeMobileTab, expected) => {
      stubViewport(isDesktop);
      const { container } = renderShell({
        left: leftPanel({ isOpen }),
        activeMobileTab,
      });
      expect(container.querySelectorAll("#nav-bereich-a")).toHaveLength(expected);
    },
  );

  it.each([true, false])("puts no dialog in the tree (desktop: %s)", (isDesktop) => {
    stubViewport(isDesktop);
    const { container } = renderShell();
    // Nothing modal survives: neither an open dialog nor a trigger for one.
    // Queried over the whole document, because a Radix drawer portalled itself
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
    ["below lg, a side column", false, "nav"],
  ] as const)("comes first, above the bar and the area on screen (%s)", (_name, isDesktop, activeMobileTab) => {
    stubViewport(isDesktop);
    const { container } = renderShell({ notice: <p>Wartung am Freitag</p>, activeMobileTab });

    const region = screen.getByRole("region", { name: "Systemmeldung" });
    expect(region).toHaveTextContent("Wartung am Freitag");
    expect(precedes(region, screen.getByRole("banner"))).toBe(true);
    const area =
      activeMobileTab === "page"
        ? screen.getByRole("main")
        : screen.getByRole("complementary", { name: "Navigationsspalte" });
    expect(precedes(region, area)).toBe(true);
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

  it("stays above the tab bar below lg, and only with the main area", () => {
    stubViewport(false);
    const { rerender } = renderShell({ status: <p>Wartung</p>, statusPosition: "bottom-end" });
    const layer = screen.getByText("Wartung").closest<HTMLElement>("[data-slot=app-shell-status]")!;
    expect(precedes(screen.getByRole("main"), layer)).toBe(true);
    expect(precedes(layer, screen.getByRole("navigation", { name: "Bereichswechsel" }))).toBe(true);

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
    expect(screen.queryByText("Wartung")).toBeNull();
  });
});

describe("AppShell — narrow-screen arrangement", () => {
  it.each([
    ["nav", "Navigationsspalte"],
    ["page", null],
    ["sources", "Quellen"],
  ] as const)("shows exactly the one area tab %s declares", (activeMobileTab, paneName) => {
    stubViewport(false);
    const { container } = renderShell({ activeMobileTab });

    const complementary = screen.queryAllByRole("complementary");
    if (paneName === null) {
      expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
      expect(complementary).toHaveLength(0);
    } else {
      expect(complementary).toHaveLength(1);
      expect(complementary[0]).toHaveAccessibleName(paneName);
      // No `main` at all while a side column is the area on screen — the main
      // column is not in the tree, and wrapping a `complementary` in `main`
      // would misname it. Counted as elements, so an unnamed second one would
      // fail too.
      expect(container.querySelectorAll("main")).toHaveLength(0);
    }
  });

  it("keeps the top bar, with no menu button to open anything", () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "page" });
    expect(screen.getByRole("banner")).toHaveTextContent("Anwendung");
    // The three tab buttons are the only buttons of the chrome; the burger is
    // gone, so nothing here can open a navigation surface.
    const chromeButtons = within(
      screen.getByRole("navigation", { name: "Bereichswechsel" }),
    )
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(chromeButtons).toEqual(["Navigation", "Seite", "Quellen"]);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("marks exactly one tab as the current one", () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "sources" });
    const current = document.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Quellen");
  });

  it("shows a collapsed column in full, with no collapse control", () => {
    stubViewport(false);
    const left = leftPanel({ isOpen: false });
    renderShell({ left, activeMobileTab: "nav" });

    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeVisible();
    for (const name of ["Navigation einklappen", "Navigation ausklappen"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    // A control that collapses the only visible area would leave an empty
    // screen and destroy the desktop preference on the way.
    expect(left.onOpenChange).not.toHaveBeenCalled();
    // The column's footer stays reachable — it is typically the only route to
    // sign-out.
    expect(screen.getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
  });

  it("falls back to the main area for a tab whose column this shell lacks", () => {
    stubViewport(false);
    renderShell({ right: undefined, activeMobileTab: "sources" });
    expect(screen.getByRole("main")).toHaveTextContent("Inhalt");
    expect(screen.queryAllByRole("complementary")).toHaveLength(0);
  });

  it("reserves the tab bar's height so the area's last row is not covered", () => {
    stubViewport(false);
    renderShell({ activeMobileTab: "page" });
    // The bar is `fixed` and one chrome unit tall — the same exported constant
    // the collapsed rail uses, which is why the reservation is that constant
    // and not a second literal 60. Only the px part is asserted: jsdom's CSS
    // parser garbles the nested `env()`.
    expect(screen.getByRole("main").getAttribute("style")).toContain(
      `${SIDE_PANEL_RAIL_WIDTH}px`,
    );
  });

  it("reports a tab change without deciding anything about it", async () => {
    stubViewport(false);
    const onMobileTabChange = vi.fn();
    renderShell({ onMobileTabChange });
    await userEvent.click(screen.getByRole("button", { name: "Quellen" }));
    expect(onMobileTabChange).toHaveBeenCalledWith("sources");
  });
});

describe("AppShell — viewport switch", () => {
  it("asks for Tailwind's own lg boundary", () => {
    stubViewport(true);
    renderShell();
    // `--breakpoint-lg: 64rem` in Tailwind's theme — the boundary the `lg:`
    // utilities in this library use.
    expect(askedQueries).toContain("(min-width: 64rem)");
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
    ["main area", "page"],
    ["a side column", "nav"],
  ] as const)("puts the notice between the area and the tab bar below lg (%s)", (_name, activeMobileTab) => {
    hideTitlebar();
    stubViewport(false);
    renderShell({ notice: <p>Wartung</p>, activeMobileTab });
    const region = screen.getByRole("region", { name: "Systemmeldung" });
    const area =
      activeMobileTab === "page"
        ? screen.getByRole("main")
        : screen.getByRole("complementary", { name: "Navigationsspalte" });
    expect(precedes(area, region)).toBe(true);
    expect(precedes(region, screen.getByRole("navigation", { name: "Bereichswechsel" }))).toBe(true);
    // The room for the tab bar is reserved once: by the notice's row, not also by the area.
    expect(area.style.paddingBottom).toBe("");
    expect(region.parentElement!.style.paddingBottom).not.toBe("");
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
    ["below lg, a side column", false, { activeMobileTab: "nav" }],
  ] as const)("keeps the area clear with an empty title-bar row when there is no bar (%s)", (_name, isDesktop, props) => {
    hideTitlebar();
    stubViewport(isDesktop);
    const { container } = renderShell({ topBar: undefined, ...props });
    const strip = container.querySelector("[data-slot='app-shell-titlebar']");
    expect(strip).toHaveAttribute("data-app-region", "drag");
    const area =
      "activeMobileTab" in props
        ? screen.getByRole("complementary", { name: "Navigationsspalte" })
        : screen.getByRole("main");
    expect(precedes(strip!, area)).toBe(true);
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
