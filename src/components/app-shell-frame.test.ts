import { describe, expect, it } from "vitest";
import { CARD_START, cardStep, frameLayout, type CardState, type FrameInput } from "./app-shell-frame";

/**
 * The frame's rules as one table. Oracle: the owner's brief for the frame —
 * no fixed width for the page; the side panel gives way first, then the left
 * column folds while the page would be narrower than the panel or than the
 * column; the card stands beside the page only while the page beside it is
 * twice the card and as wide as a side panel; a card the frame closed comes
 * back with the room, unless the user chose otherwise. Every expected number
 * is worked out by hand in the row's comment.
 */
const base: FrameInput = {
  isDesktop: true,
  rowWidth: 1400,
  remPx: 16,
  titlebar: false,
  titlebarControls: false,
  left: { width: 300, open: true, heldOpen: false },
  sidePanel: null,
  card: { width: 300 },
};
const panel = (wanted: number, min = 360, maximized = false) => ({ min, wanted, width: wanted, maximized });
const left = (width: number, more: Partial<NonNullable<FrameInput["left"]>> = {}) => ({ width, open: true, heldOpen: false, ...more });

describe("frameLayout", () => {
  const rows: [string, Partial<FrameInput>, Partial<ReturnType<typeof frameLayout>>][] = [
    // 1400 − 300 = 1100 for the page; beside the card 1100 − 316 = 784 ≥ 600.
    ["no side panel: the column stays, the card stands beside the page", {}, { leftCrowds: false, leftTaken: 300, mainWidth: 1100, cardRoom: true }],
    // Panel 500: page 1400 − 300 − 500 = 600 ≥ max(500, 300). Beside the card 600 − 316 = 284 < 600.
    ["a panel that leaves the page wider than both: nothing folds, the card lies over", { sidePanel: panel(500) }, { leftCrowds: false, leftTaken: 300, sidePanelMax: 800, mainWidth: 600, cardRoom: false }],
    // Panel 700: page 400 < 700 → fold. Rail 60: cap min(⌊1400 × 0.7⌋, 1400 − 60 − 300) — 979, as
    // 1400 × 0.7 is 979.99… in floating point — and the page 1400 − 60 − 700 = 640.
    ["a page narrower than the panel folds the column", { sidePanel: panel(700) }, { leftCrowds: true, leftFolded: true, leftShownOpen: false, leftTaken: 60, sidePanelMax: 979, mainWidth: 640, cardRoom: false }],
    // Column 500, panel 300 (min 200), row 1000: page 200 < max(300, 500) → fold.
    ["a page narrower than the column folds it", { rowWidth: 1000, left: left(500), sidePanel: panel(300, 200) }, { leftCrowds: true }],
    // A panel under its handle's minimum renders at its own width: 1060 − 300 − 250 = 510 ≥ 300.
    ["the panel is weighed as it renders, below its handle's minimum", { rowWidth: 1060, sidePanel: panel(250, 400) }, { leftCrowds: false }],
    // Expanded by hand while crowded: a drawer, the row keeps the rail.
    ["a column held open while crowded is a drawer over the page", { sidePanel: panel(700), left: left(300, { heldOpen: true }) }, { leftOverlay: true, leftShownOpen: true, leftTaken: 60, leftFolded: true }],
    ["the held-open override ends with the room", { left: left(300, { heldOpen: true }) }, { releaseHeldOpen: true }],
    ["…but not while a maximised panel covers the page", { left: left(300, { heldOpen: true }), sidePanel: panel(300, 300, true) }, { releaseHeldOpen: false }],
    ["the user's folded column is not the frame's", { sidePanel: panel(700), left: left(300, { open: false }) }, { leftCrowds: true, leftFolded: false, leftTaken: 60 }],
    // A maximised panel keeps a folded column folded, so it gets more room.
    ["a maximised panel keeps the column folded", { sidePanel: panel(700, 360, true) }, { leftCrowds: true }],
    // Native title bar: 1200 − 296 = 904 ≥ 320 → the maximised panel does not fold it.
    ["…not under a native title bar", { titlebar: true, titlebarControls: true, rowWidth: 1200, left: left(296), sidePanel: panel(600, 320, true) }, { leftCrowds: false }],
    // …unless the panel would get less than its minimum: 800 − 600 = 200 < 360.
    ["…unless the maximised panel would get less than its minimum", { titlebar: true, titlebarControls: true, rowWidth: 800, left: left(600), sidePanel: panel(400, 360, true) }, { leftCrowds: true }],
    ["the title bar's floor holds the column at 296", { titlebar: true, titlebarControls: true, left: left(256) }, { leftWidth: 296 }],
    // Row 1000, column 350, panel 250: cap min(700, 1000 − 350 − 350) = 300; the handle may reach min(700, 1000 − 60 − 350) = 590.
    ["the panel's handle may ask for what folding the column frees", { rowWidth: 1000, left: left(350), sidePanel: panel(250, 200) }, { leftCrowds: false, sidePanelMax: 300, sidePanelDragMax: 590 }],
    // 1027 − 311 = 716; beside the card: 716 − 249 = 467 ≥ 466 at 16px…
    ["the card's gap at a 16px root", { rowWidth: 1027, left: left(311), card: { width: 233 } }, { cardRoom: true }],
    // …716 − 253 = 463 < 466 at 20px.
    ["the card's gap at a 20px root", { rowWidth: 1027, left: left(311), card: { width: 233 }, remPx: 20 }, { cardRoom: false }],
    ["unmeasured: no rule applies", { rowWidth: null, sidePanel: panel(700) }, { leftCrowds: false, mainWidth: null, sidePanelMax: null, cardRoom: true }],
    ["the narrow frame: no rule applies, no card beside the page", { isDesktop: false, sidePanel: panel(700) }, { leftCrowds: false, cardRoom: false }],
  ];
  it.each(rows)("%s", (_name, input, expected) => {
    expect(frameLayout({ ...base, ...input })).toMatchObject(expected);
  });

  it("never folds the column because the frame widened", () => {
    const folded = [800, 900, 1100, 1300, 1500, 1700, 1900, 2400].map(
      (rowWidth) => frameLayout({ ...base, rowWidth, left: left(400), sidePanel: panel(600, 200) }).leftCrowds,
    );
    expect(folded).toEqual([...folded].sort((a, b) => Number(b) - Number(a)));
    expect(folded.at(-1)).toBe(false);
  });

  describe("the left handle never folds the column it drags", () => {
    const resize = { minWidth: 200, maxWidth: 600 };
    // Row 1280, panel 450: the column fits up to min(1280 − 900, (1280 − 450) / 2) = 380.
    it("stops at the fold", () => {
      expect(frameLayout({ ...base, rowWidth: 1280, left: left(380, { resize }), sidePanel: panel(450) }).leftHandleMax).toBe(380);
    });
    it("has no handle when nothing in its range fits", () => {
      expect(frameLayout({ ...base, rowWidth: 1280, left: left(256, { resize: { minWidth: 400, maxWidth: 600 } }), sidePanel: panel(450) }).leftHandleMax).toBeNull();
    });
    it("keeps the consumer's maximum without a panel", () => {
      expect(frameLayout({ ...base, left: left(500, { resize: { minWidth: 200, maxWidth: 400 } }) }).leftHandleMax).toBe(400);
    });
    // Native, maximised: 800 − 360 = 440.
    it("stops before a maximised panel under a native title bar drops below its minimum", () => {
      expect(
        frameLayout({ ...base, titlebar: true, titlebarControls: true, rowWidth: 800, left: left(300, { resize: { minWidth: 150, maxWidth: 600 } }), sidePanel: panel(400, 360, true) }).leftHandleMax,
      ).toBe(440);
    });
  });
});

describe("cardStep", () => {
  const frame = (room: boolean, open: boolean, more: Partial<{ desktop: boolean; live: boolean; measured: boolean }> = {}) => ({
    type: "frame" as const,
    desktop: true,
    live: true,
    measured: true,
    room,
    open,
    ...more,
  });
  const owed: CardState = { hadRoom: false, closedByFrame: true };
  const rows: [string, CardState, Parameters<typeof cardStep>[1], ReturnType<typeof cardStep>][] = [
    ["an open card that loses its room closes, and is owed", CARD_START, frame(false, true), { state: owed, command: "close" }],
    ["a closed card that loses its room is not owed", CARD_START, frame(false, false), { state: { hadRoom: false, closedByFrame: false }, command: null }],
    ["an owed card opens with the room", owed, frame(true, false), { state: CARD_START, command: "open" }],
    ["…unless it is open already", owed, frame(true, true), { state: CARD_START, command: null }],
    ["a card not owed stays closed with the room", { hadRoom: false, closedByFrame: false }, frame(true, false), { state: CARD_START, command: null }],
    ["the user opening it ends the claim", owed, { type: "opened" }, { state: { hadRoom: false, closedByFrame: false }, command: null }],
    ["hidden, locked or covered: the claim waits", owed, frame(true, false, { live: false }), { state: owed, command: null }],
    ["below md: the claim waits", owed, frame(true, false, { desktop: false }), { state: owed, command: null }],
    ["unmeasured: the claim waits", owed, frame(true, false, { measured: false }), { state: owed, command: null }],
    ["no right panel any more: nothing is owed", owed, { type: "removed" }, { state: CARD_START, command: null }],
  ];
  it.each(rows)("%s", (_name, state, event, expected) => {
    expect(cardStep(state, event)).toEqual(expected);
  });
});
