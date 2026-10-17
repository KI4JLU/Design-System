import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PromptInput } from "./prompt-input";
import { PromptInputAdaptiveTextarea } from "./prompt-input-adaptive-textarea";

// jsdom does no layout, so the probe's inputs are stubbed: `box` is what the
// textarea reports while laid out at the one-line paddings. A wrapping
// placeholder shows up exactly like wrapping text (scrollHeight > clientHeight),
// which is what both Chromium and WebKit report for an empty field whose
// placeholder is longer than the gap between the controls.
function stubBox(box: { clientWidth: number; clientHeight: number; scrollHeight: number }) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(box.clientWidth);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(box.clientHeight);
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(box.scrollHeight);
}

function Composer({ value, placeholder = "Stelle eine Frage zu einem sehr langen Thema…" }: { value: string; placeholder?: string }) {
  return (
    <PromptInput onSubmit={() => {}}>
      <PromptInputAdaptiveTextarea
        aria-label="Nachricht"
        placeholder={placeholder}
        rows={1}
        value={value}
        onChange={() => {}}
        inlineLeft={60}
        inlineRight={160}
      />
    </PromptInput>
  );
}

const field = () => screen.getByRole("textbox", { name: "Nachricht" });

afterEach(() => vi.restoreAllMocks());

describe("PromptInputAdaptiveTextarea", () => {
  it("keeps an empty field on one line when only the placeholder would wrap", () => {
    stubBox({ clientWidth: 414, clientHeight: 48, scrollHeight: 72 });
    render(<Composer value="" />);
    expect(field()).not.toHaveAttribute("data-multiline");
    expect(document.querySelector("[data-slot=prompt-input-lane]")).toBeNull();
  });

  it("moves wrapping text above the controls", () => {
    stubBox({ clientWidth: 414, clientHeight: 48, scrollHeight: 72 });
    render(<Composer value="Eine Frage, die nicht zwischen die Bedienelemente passt" />);
    expect(field()).toHaveAttribute("data-multiline");
    expect(document.querySelector("[data-slot=prompt-input-lane]")).not.toBeNull();
  });

  it("returns to one line when the draft is cleared", () => {
    stubBox({ clientWidth: 414, clientHeight: 48, scrollHeight: 72 });
    const { rerender } = render(<Composer value="Eine lange Frage, die umbricht" />);
    expect(field()).toHaveAttribute("data-multiline");
    rerender(<Composer value="" />);
    expect(field()).not.toHaveAttribute("data-multiline");
  });

  it("moves an empty field up when the gap is too narrow to show the placeholder", () => {
    // 270 - 60 - 160 = 50px between the controls: below 6em (96px at 16px).
    stubBox({ clientWidth: 270, clientHeight: 48, scrollHeight: 72 });
    render(<Composer value="" />);
    expect(field()).toHaveAttribute("data-multiline");
  });

  it("does not decide for a field that is not laid out yet", () => {
    stubBox({ clientWidth: 0, clientHeight: 0, scrollHeight: 0 });
    render(<Composer value="" />);
    expect(field()).not.toHaveAttribute("data-multiline");
  });

  it("never scrolls horizontally and wraps unbroken runs", () => {
    stubBox({ clientWidth: 414, clientHeight: 48, scrollHeight: 48 });
    render(<Composer value="" />);
    // Class contract (jsdom has no Tailwind CSS); the computed values are
    // asserted in the LongPlaceholder story in a real browser.
    expect(field()).toHaveClass("overflow-x-hidden", "wrap-anywhere");
    expect(field().className).toContain("[&:not([data-multiline])]:placeholder:truncate");
  });
});
