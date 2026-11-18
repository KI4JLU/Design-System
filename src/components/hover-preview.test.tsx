import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { HoverPreview, HoverPreviewGroup } from "./hover-preview";

/**
 * Oracle: the behaviour the component documents. A preview opens when the
 * pointer RESTS on an item (400 ms without travel), never while it passes;
 * while one is open, and for 300 ms after, the next item shows at once; the
 * group renders one card; a press, Escape and scrolling close it.
 */
const REST = 400;
const WARM = 300;
const CLOSE = 100;

const renderList = () =>
  render(
    <HoverPreviewGroup>
      {["A", "B", "C"].map((n) => (
        <HoverPreview key={n} content={<p>{`Vorschau ${n}`}</p>}>
          <button type="button">{`Zeile ${n}`}</button>
        </HoverPreview>
      ))}
    </HoverPreviewGroup>,
  );

const row = (n: string) => screen.getByRole("button", { name: `Zeile ${n}` });
const preview = (n: string) => screen.queryByText(`Vorschau ${n}`);
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const enter = (el: HTMLElement, x = 0, y = 0) => fireEvent.pointerEnter(el, { clientX: x, clientY: y, pointerType: "mouse" });
const move = (el: HTMLElement, x: number, y = 0) => fireEvent.pointerMove(el, { clientX: x, clientY: y, pointerType: "mouse" });
const cards = () => document.querySelectorAll('[data-slot="hover-preview"]');

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("HoverPreview", () => {
  it("opens once the pointer has rested, not before", () => {
    renderList();
    enter(row("A"));
    wait(REST - 1);
    expect(preview("A")).not.toBeInTheDocument();
    wait(1);
    expect(preview("A")).toBeInTheDocument();
  });

  it("opens nothing while the pointer keeps moving across the items", () => {
    renderList();
    let x = 0;
    for (const n of ["A", "B", "C"]) {
      enter(row(n), x);
      for (let i = 0; i < 4; i++) {
        wait(REST / 2);
        move(row(n), (x += 20));
      }
      fireEvent.pointerLeave(row(n));
    }
    wait(REST * 2);
    expect(cards()).toHaveLength(0);
  });

  it("ignores travel within the slop: a hand at rest still trembles", () => {
    renderList();
    enter(row("A"), 100, 100);
    wait(REST / 2);
    move(row("A"), 102, 101);
    wait(REST / 2);
    expect(preview("A")).toBeInTheDocument();
  });

  it("switches at once while a preview is open, in the same single card", () => {
    renderList();
    enter(row("A"));
    wait(REST);
    const card = cards()[0];
    fireEvent.pointerLeave(row("A"));
    enter(row("B"));
    expect(preview("B")).toBeInTheDocument();
    expect(preview("A")).not.toBeInTheDocument();
    expect(cards()).toHaveLength(1);
    expect(cards()[0]).toBe(card);
  });

  it("stays warm briefly after closing, then needs a rest again", () => {
    renderList();
    enter(row("A"));
    wait(REST);
    fireEvent.pointerLeave(row("A"));
    wait(CLOSE);
    expect(cards()).toHaveLength(0);

    wait(WARM - 1);
    enter(row("B"));
    expect(preview("B")).toBeInTheDocument();

    fireEvent.pointerLeave(row("B"));
    wait(CLOSE + WARM);
    enter(row("C"));
    expect(preview("C")).not.toBeInTheDocument();
    wait(REST);
    expect(preview("C")).toBeInTheDocument();
  });

  it("stays open while the pointer is on the card", () => {
    renderList();
    enter(row("A"));
    wait(REST);
    fireEvent.pointerLeave(row("A"));
    fireEvent.pointerEnter(cards()[0]);
    wait(CLOSE * 5);
    expect(cards()).toHaveLength(1);
    fireEvent.pointerLeave(cards()[0]);
    wait(CLOSE);
    expect(cards()).toHaveLength(0);
  });

  it("closes on a press and stays closed until the pointer has left", () => {
    renderList();
    enter(row("A"));
    wait(REST);
    fireEvent.pointerDown(row("A"));
    expect(cards()).toHaveLength(0);
    move(row("A"), 50);
    wait(REST * 2);
    expect(cards()).toHaveLength(0);

    // A press ends the warm phase too: the neighbour waits for a rest.
    fireEvent.pointerLeave(row("A"));
    enter(row("B"));
    expect(preview("B")).not.toBeInTheDocument();
  });

  it("closes on Escape and on scroll", () => {
    renderList();
    enter(row("A"));
    wait(REST);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(cards()).toHaveLength(0);

    fireEvent.pointerLeave(row("A"));
    enter(row("B"));
    wait(REST);
    expect(cards()).toHaveLength(1);
    fireEvent.scroll(window);
    expect(cards()).toHaveLength(0);
  });

  it("opens nothing when the list scrolls during the rest delay", () => {
    renderList();
    enter(row("A"));
    wait(REST / 2);
    fireEvent.scroll(window);
    wait(REST);
    expect(cards()).toHaveLength(0);
  });

  it("opens for keyboard focus on a control inside the trigger", () => {
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, sel: string) {
      return sel === ":focus-visible" ? this === document.activeElement : matches.call(this, sel);
    });
    render(
      <HoverPreview content={<p>Vorschau</p>}>
        <div>
          Datei <button type="button">Entfernen</button>
        </div>
      </HoverPreview>,
    );
    act(() => screen.getByRole("button", { name: "Entfernen" }).focus());
    wait(REST);
    expect(screen.getByText("Vorschau")).toBeInTheDocument();
  });

  it("opens for keyboard focus after the rest delay and closes on blur", () => {
    // jsdom has no input modality: answer `:focus-visible` as a browser would
    // after Tab (true) — and after a click (false) in the test below.
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, sel: string) {
      return sel === ":focus-visible" ? this === document.activeElement : matches.call(this, sel);
    });
    renderList();
    act(() => row("A").focus());
    wait(REST);
    expect(preview("A")).toBeInTheDocument();
    // Focus stays on the trigger: the card never takes it.
    expect(row("A")).toHaveFocus();
    act(() => row("A").blur());
    wait(CLOSE);
    expect(cards()).toHaveLength(0);
  });

  it("stays open while either the pointer or keyboard focus is still on the item", () => {
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, sel: string) {
      return sel === ":focus-visible" ? this === document.activeElement : matches.call(this, sel);
    });
    renderList();
    act(() => row("A").focus());
    enter(row("A"));
    wait(REST);
    fireEvent.pointerLeave(row("A"));
    wait(CLOSE * 3);
    expect(cards()).toHaveLength(1);

    enter(row("A"));
    act(() => row("A").blur());
    wait(CLOSE * 3);
    expect(cards()).toHaveLength(1);
    fireEvent.pointerLeave(row("A"));
    wait(CLOSE);
    expect(cards()).toHaveLength(0);
  });

  it("does not open for focus that came from a click", () => {
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, sel: string) {
      return sel === ":focus-visible" ? false : matches.call(this, sel);
    });
    renderList();
    act(() => row("A").focus());
    wait(REST * 2);
    expect(cards()).toHaveLength(0);
  });

  it("ignores touch", () => {
    renderList();
    fireEvent.pointerEnter(row("A"), { pointerType: "touch" });
    wait(REST * 2);
    expect(cards()).toHaveLength(0);
  });

  it("works without a group and keeps the trigger's own handlers", () => {
    const onPointerEnter = vi.fn();
    render(
      <HoverPreview content={<p>Vorschau</p>}>
        <button type="button" onPointerEnter={onPointerEnter}>
          Datei
        </button>
      </HoverPreview>,
    );
    enter(screen.getByRole("button", { name: "Datei" }));
    wait(REST);
    expect(screen.getByText("Vorschau")).toBeInTheDocument();
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
  });

  it("shows nothing when disabled", () => {
    render(
      <HoverPreview disabled content={<p>Vorschau</p>}>
        <button type="button">Datei</button>
      </HoverPreview>,
    );
    enter(screen.getByRole("button", { name: "Datei" }));
    wait(REST * 2);
    expect(screen.queryByText("Vorschau")).not.toBeInTheDocument();
  });
});
