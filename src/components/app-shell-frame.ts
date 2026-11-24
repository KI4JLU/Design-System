/**
 * The frame's shrinking rules as pure functions: `frameLayout` decides every
 * width and mode of `AppShell`'s desktop row from its inputs, and `cardStep`
 * is the one piece of memory the rules need — whether the frame itself closed
 * the floating card, and so owes it back. `AppShell` measures, calls these,
 * and renders what they return; it holds no layout rule of its own.
 *
 * The rules weigh the page (the main area) against what competes with it —
 * no fixed width — so they hold at any frame size and aspect ratio. As the
 * frame narrows or the side panel widens:
 *
 *  1. The side panel gives way first: at most 70% of the frame, and at most
 *     what leaves the page as wide as the expanded left column — never below
 *     its own minimum.
 *  2. Then the left column folds to its rail while, expanded, it would leave
 *     the page narrower than the side panel or than itself. The consumer's
 *     `isOpen` is not touched. Expanded by hand in that state, the column lies
 *     over the page as a drawer; the row keeps the rail.
 *  3. The floating card stands beside the page only while the page beside it
 *     is at least twice the card and as wide as a side panel, and never while
 *     the left column is folded. Where that stops, an open card closes; one
 *     the frame closed opens again with the room (`cardStep`).
 */

/** Default expanded width of a column, in px (the `--width-sidebar` token at 16px). */
export const DEFAULT_COLUMN_WIDTH = 256;
import { SIDE_PANEL_RAIL_WIDTH as RAIL_WIDTH } from "./side-panel-variants";
/**
 * Smallest width of the left column while its header row is the window's
 * title bar and holds the app's `titlebarControls`: window controls, brand,
 * two icon buttons and the toggle.
 */
export const TITLEBAR_LEFT_MIN_WIDTH = 296;
/** Largest share of the frame's width a side panel takes. */
export const SIDE_PANEL_MAX_FRACTION = 0.7;

export interface FrameInput {
  /** From `md` up: columns beside the page. Below it nothing here applies. */
  isDesktop: boolean;
  /** The row's width in px; `null` while unmeasured (then no rule applies). */
  rowWidth: number | null;
  /** 1rem in px: the card's gap beside the page. */
  remPx: number;
  /** A native title bar (`useTitlebar()`), whatever it holds. */
  titlebar: boolean;
  /** The app put controls in it (`titlebarControls`), so the left header row holds them. */
  titlebarControls: boolean;
  left: null | {
    /** The consumer's width; `undefined` = the default. */
    width: number | undefined;
    /** The consumer's `isOpen`. */
    open: boolean;
    /** The user expanded the column by hand while the frame had folded it. */
    heldOpen: boolean;
    resize?: { minWidth: number; maxWidth: number };
  };
  sidePanel: null | {
    /** Its smallest width. */
    min: number;
    /** The consumer's width (what it asks for). */
    wanted: number;
    /** What it last reported showing, used while the row is unmeasured. */
    width: number;
    maximized: boolean;
  };
  card: null | {
    /** The card's width; `undefined` = the default. */
    width: number | undefined;
  };
}

export interface FrameLayout {
  /** What the expanded left column measures. */
  leftWidth: number;
  /** The frame has no room for the expanded left column (rule 2). */
  leftCrowds: boolean;
  /** The open state the column is rendered with. */
  leftShownOpen: boolean;
  /** The column the user has open shows as a rail or a drawer — not beside the page. */
  leftFolded: boolean;
  /** Expanded by hand while crowded: a drawer over the page. */
  leftOverlay: boolean;
  /** The held-open override no longer applies and should be dropped. */
  releaseHeldOpen: boolean;
  /** What the left column takes of the row. */
  leftTaken: number;
  /**
   * The left handle's maximum: `null` when no width in its range fits (no
   * handle); `undefined` without a `resize` contract.
   */
  leftHandleMax: number | null | undefined;
  /** Most the side panel may measure now (rule 1); `null` while unmeasured. */
  sidePanelMax: number | null;
  /** Most its handle may ask for: what folding the column would free. */
  sidePanelDragMax: number | null;
  /** The page's width; `null` while unmeasured. */
  mainWidth: number | null;
  /** The card, open, would stand beside the page (rule 3); else it lies over it. */
  cardRoom: boolean;
}

export function frameLayout(input: FrameInput): FrameLayout {
  const { isDesktop, rowWidth: row, remPx, titlebar, titlebarControls, left, sidePanel, card } = input;

  // The expanded column as rendered: its width, never below the title bar's
  // floor while its header row holds the window's controls.
  const floor = titlebar && titlebarControls && isDesktop && left ? TITLEBAR_LEFT_MIN_WIDTH : 0;
  const leftWidth = Math.max(left?.width ?? DEFAULT_COLUMN_WIDTH, floor);
  // Rule 1's floor: the page stays as wide as the expanded left column.
  const mainFloor = left ? leftWidth : 0;

  // The panel as it would render beside the expanded column — its own width
  // under the frame's share, the share never below its minimum. Not rule 1's
  // cap: that grows with the frame and would fold the column as it widens.
  const panelBeside =
    sidePanel === null || row === null
      ? 0
      : Math.min(sidePanel.wanted, Math.max(sidePanel.min, Math.floor(row * SIDE_PANEL_MAX_FRACTION)));

  // Rule 2. Weighed with the panel beside the page even while it is
  // maximised, so maximising gives the panel more room — except under a
  // native title bar, where a folded column's toggle would sit in the covered
  // page bar, unless the expanded column would leave the panel less than its
  // minimum.
  const leftCrowds =
    isDesktop &&
    left !== null &&
    sidePanel !== null &&
    row !== null &&
    !(titlebar && sidePanel.maximized && row - leftWidth >= sidePanel.min) &&
    row - leftWidth - panelBeside < Math.max(panelBeside, mainFloor);

  const heldOpen = left?.heldOpen ?? false;
  const releaseHeldOpen = !leftCrowds && heldOpen && !sidePanel?.maximized;
  const leftOpen = left?.open ?? false;
  const leftShownOpen = leftCrowds ? leftOpen && heldOpen : leftOpen;
  const leftFolded = leftCrowds && leftOpen;
  const leftOverlay = leftCrowds && leftOpen && heldOpen;
  const leftTaken = !left ? 0 : leftShownOpen && !leftOverlay ? leftWidth : RAIL_WIDTH;

  const share = row === null ? 0 : Math.floor(row * SIDE_PANEL_MAX_FRACTION);
  const sidePanelMax = row === null ? null : Math.min(share, row - leftTaken - mainFloor);
  // The handle may ask past today's cap, up to what the panel gets once the
  // column folds (the request itself folds it) — not for a column held open.
  const sidePanelDragMax =
    row === null ? null : Math.min(share, row - (!left ? 0 : heldOpen ? leftTaken : RAIL_WIDTH) - mainFloor);

  // The panel as this render shows it, so a folding column's freed room is
  // never mistaken for room for the card.
  const sidePanelShown =
    sidePanel === null
      ? 0
      : sidePanelMax === null
        ? sidePanel.width
        : Math.min(sidePanel.wanted, Math.max(sidePanel.min, sidePanelMax));
  const mainWidth = row === null ? null : row - leftTaken - sidePanelShown;

  // Rule 3.
  const cardWidth = card?.width ?? DEFAULT_COLUMN_WIDTH;
  const cardRoom =
    isDesktop &&
    !leftFolded &&
    (mainWidth === null ||
      mainWidth - (cardWidth + remPx) >=
        Math.max(2 * cardWidth, sidePanel && !sidePanel.maximized ? sidePanelShown : 0));

  // The left handle never folds the column it drags.
  let leftHandleMax: number | null | undefined;
  const resize = left?.resize;
  if (resize) {
    const low = Math.max(resize.minWidth, floor);
    const own = Math.max(resize.maxWidth, floor);
    if (!sidePanel || row === null || leftCrowds) {
      leftHandleMax = own;
    } else {
      // Under a native title bar a maximised panel folds the column only
      // where it would get less than its minimum; otherwise rule 2.
      const fits =
        titlebar && sidePanel.maximized
          ? row - sidePanel.min
          : Math.min(row - 2 * panelBeside, Math.floor((row - panelBeside) / 2));
      leftHandleMax = fits < low ? null : Math.max(low, Math.min(own, Math.max(leftWidth, fits)));
    }
  }

  return {
    leftWidth,
    leftCrowds,
    leftShownOpen,
    leftFolded,
    leftOverlay,
    releaseHeldOpen,
    leftTaken,
    leftHandleMax,
    sidePanelMax,
    sidePanelDragMax,
    mainWidth,
    cardRoom,
  };
}

/** What the frame remembers about the card: the one state its rules need. */
export interface CardState {
  /** The card had room beside the page at the last decision. */
  hadRoom: boolean;
  /** The frame closed it, and owes it back once the room returns. */
  closedByFrame: boolean;
}

export const CARD_START: CardState = { hadRoom: true, closedByFrame: false };

export type CardEvent =
  /** There is no `right` panel any more: nothing is owed. */
  | { type: "removed" }
  /** The consumer's own state opened the card: the user's choice ends the claim. */
  | { type: "opened" }
  /**
   * The frame changed. `live` = shown on the desktop, not locked, not behind a
   * maximised panel; `measured` = the row has a width. A card that is not
   * live, or a frame not measured, decides nothing — a pending return waits.
   */
  | { type: "frame"; desktop: boolean; live: boolean; measured: boolean; room: boolean; open: boolean };

/** The next state, and what the frame asks of the consumer, if anything. */
export function cardStep(state: CardState, event: CardEvent): { state: CardState; command: "close" | "open" | null } {
  switch (event.type) {
    case "removed":
      return { state: CARD_START, command: null };
    case "opened":
      return { state: { ...state, closedByFrame: false }, command: null };
    case "frame": {
      if (!event.desktop || !event.live || !event.measured) return { state, command: null };
      if (state.hadRoom && !event.room && event.open) {
        return { state: { hadRoom: false, closedByFrame: true }, command: "close" };
      }
      if (!state.hadRoom && event.room && state.closedByFrame) {
        return { state: { hadRoom: true, closedByFrame: false }, command: event.open ? null : "open" };
      }
      return { state: { ...state, hadRoom: event.room }, command: null };
    }
  }
}
