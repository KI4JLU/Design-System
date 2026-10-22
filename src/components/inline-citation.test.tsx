import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationText,
} from "./inline-citation";

// Oracles: the KI-923 brief (§3.5, §4) and the APG disclosure/dialog pattern,
// independent of the implementation — hover opens after ~300 ms intent and
// the pointer may travel chip → card; click / Enter pins the card and moves
// focus into it; Esc closes and returns focus to the chip; the chip is a real
// <button> with aria-expanded and an overridable name; the card is a dialog.
function Subject() {
  return (
    <p>
      <InlineCitation>
        <InlineCitationText>Zuständig sind Sten und Steffen.</InlineCitationText>
        <InlineCitationCard>
          <InlineCitationCardTrigger aria-label="Quelle 1: Anforderungen JLU RAG">
            1
          </InlineCitationCardTrigger>
          <InlineCitationCardBody aria-label="Quelle 1: Anforderungen JLU RAG">
            <p>Auszug</p>
            <button type="button">In Quelle öffnen</button>
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
    </p>
  );
}

const chip = () => screen.getByRole("button", { name: "Quelle 1: Anforderungen JLU RAG" });
const mouse = { pointerType: "mouse" };

describe("InlineCitation card", () => {
  afterEach(() => vi.useRealTimers());

  it("is a real button showing only the number, collapsed", () => {
    render(<Subject />);
    expect(chip().tagName).toBe("BUTTON");
    expect(chip()).toHaveTextContent(/^1$/);
    expect(chip()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on hover only after the intent delay, without taking focus", () => {
    vi.useFakeTimers();
    render(<Subject />);
    fireEvent.pointerOver(chip(), mouse);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByRole("dialog", { name: "Quelle 1: Anforderungen JLU RAG" })).toBeInTheDocument();
    expect(chip()).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement).toBe(document.body);
  });

  it("stays open while the pointer travels chip → card, closes after leaving the card", () => {
    vi.useFakeTimers();
    render(<Subject />);
    fireEvent.pointerOver(chip(), mouse);
    act(() => vi.advanceTimersByTime(350));
    fireEvent.pointerOut(chip(), mouse);
    act(() => vi.advanceTimersByTime(50));
    fireEvent.pointerOver(screen.getByRole("dialog"), mouse);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.pointerOut(screen.getByRole("dialog"), mouse);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("a click after hover pins it: focus moves in and leaving no longer closes", () => {
    vi.useFakeTimers();
    render(<Subject />);
    fireEvent.pointerOver(chip(), mouse);
    act(() => vi.advanceTimersByTime(350));
    fireEvent.click(chip());
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.pointerOut(chip(), mouse);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Enter opens it pinned with focus inside; Esc closes and returns focus to the chip", async () => {
    render(<Subject />);
    await userEvent.tab();
    expect(chip()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(chip()).toHaveFocus();
  });
});
