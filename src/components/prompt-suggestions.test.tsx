import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromptSuggestions } from "./prompt-suggestions";

const shown = () => screen.getAllByRole("listitem").map((li) => li.textContent);

// Oracle: the suggestion strings handed in, and WAI-ARIA roles
// as testing-library resolves them.
describe("PromptSuggestions", () => {
  it("names the list by its headline and hands back the trimmed text", async () => {
    const onSelect = vi.fn();
    render(<PromptSuggestions title="Vorschläge" suggestions={[" Fasse zusammen ", "", "Was steht drin?"]} onSelect={onSelect} />);
    expect(screen.getByRole("heading", { name: "Vorschläge" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Vorschläge" }).querySelectorAll("button")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Fasse zusammen" }));
    expect(onSelect).toHaveBeenCalledWith("Fasse zusammen");
  });

  it("renders every suggestion and steps the row one suggestion at a time", async () => {
    // Oracle: a 500px row showing 200px, items starting at 0/150/300px — next
    // scrolls to the next item's start minus the 24px fade, previous back.
    const sw = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(500);
    const cw = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    render(<PromptSuggestions title="Vorschläge" suggestions={["A", "B", "C"]} onSelect={() => {}} previousLabel="Zurück" nextLabel="Weiter" />);
    expect(shown()).toEqual(["A", "B", "C"]);
    const list = screen.getByRole("list", { name: "Vorschläge" });
    Array.from(list.children).forEach((li, i) => Object.defineProperty(li, "offsetLeft", { value: i * 150 }));
    const scrollTo = vi.fn();
    list.scrollTo = scrollTo as typeof list.scrollTo;
    expect(screen.getByRole("button", { name: "Zurück" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 126 }));
    list.scrollLeft = 126;
    list.dispatchEvent(new Event("scroll"));
    await userEvent.click(screen.getByRole("button", { name: "Zurück" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 0 }));
    sw.mockRestore();
    cw.mockRestore();
  });

  it("shows no stepping while everything fits, a close button only with onDismiss", async () => {
    const onDismiss = vi.fn();
    render(<PromptSuggestions suggestions={["A"]} onSelect={() => {}} onDismiss={onDismiss} dismissLabel="Schließen" />);
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    const root = screen.getByRole("list").parentElement as HTMLElement;
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(onDismiss).toHaveBeenCalled();
    // Oracle: closing hides by visibility (space kept), it does not unmount.
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass("invisible");
    // …and is out of reach at once, focus included.
    expect(root).toHaveAttribute("inert");
  });

  it("keeps its space without suggestions when asked to, and fills the same element once they arrive", () => {
    // Oracle: reserveSpace with nothing to show = one hidden element with nothing
    // to reach; the suggestions then appear in that element, not a new one.
    const { container, rerender } = render(<PromptSuggestions title="Vorschläge" suggestions={[]} reserveSpace onSelect={() => {}} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("invisible");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<PromptSuggestions title="Vorschläge" suggestions={["A"]} reserveSpace onSelect={() => {}} />);
    expect(container.firstElementChild).toBe(root);
    expect(root).not.toHaveClass("invisible");
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
    // Not asked to and none: nothing is rendered.
    rerender(<PromptSuggestions title="Vorschläge" suggestions={[]} onSelect={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows placeholder chips while loading, and the suggestions in their place once there", () => {
    // Oracle: loading with none yet = a busy list of placeholders with nothing
    // to press; with suggestions the placeholders are gone.
    const { container, rerender } = render(<PromptSuggestions title="Vorschläge" suggestions={[]} loading onSelect={() => {}} />);
    const list = screen.getByRole("list", { name: "Vorschläge" });
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll('[data-slot="prompt-suggestion-placeholder"]')).toHaveLength(3);
    expect(list.querySelectorAll("button")).toHaveLength(0);
    expect(list).toHaveClass("overflow-hidden");
    rerender(<PromptSuggestions title="Vorschläge" suggestions={["A"]} loading onSelect={() => {}} />);
    expect(screen.getByRole("list", { name: "Vorschläge" })).toBe(list);
    expect(list).not.toHaveAttribute("aria-busy");
    expect(container.querySelectorAll('[data-slot="prompt-suggestion-placeholder"]')).toHaveLength(0);
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
  });

  it("announces the load once the placeholders show, and only when given a label", () => {
    // Oracle: the status region is there empty from the start, takes the label
    // when the placeholders are revealed, and is empty again with suggestions.
    vi.useFakeTimers();
    try {
      const { rerender } = render(<PromptSuggestions suggestions={[]} loading revealDelay={1000} onSelect={() => {}} />);
      expect(screen.queryByRole("status")).toBeNull();
      rerender(<PromptSuggestions suggestions={[]} loading loadingLabel="Vorschläge werden geladen" revealDelay={1000} onSelect={() => {}} />);
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      act(() => { vi.advanceTimersByTime(1000); });
      expect(screen.getByRole("status")).toHaveTextContent("Vorschläge werden geladen");
      rerender(<PromptSuggestions suggestions={["A"]} loading loadingLabel="Vorschläge werden geladen" revealDelay={1000} onSelect={() => {}} />);
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
  });

  it("offers no stepping through placeholders that overflow", () => {
    // Oracle: the same overflowing row as in the stepping test, but loading.
    const sw = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(500);
    const cw = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    render(<PromptSuggestions title="Vorschläge" suggestions={[]} loading onSelect={() => {}} nextLabel="Weiter" />);
    expect(screen.queryByRole("button", { name: "Weiter" })).toBeNull();
    sw.mockRestore();
    cw.mockRestore();
  });

  it("keeps the reveal pause across loading and arrival: one deadline from mount", () => {
    // Oracle: revealDelay 1000 from mount. Hidden at 600ms while loading;
    // suggestions arrive then and stay hidden until the same 1000ms mark.
    vi.useFakeTimers();
    try {
      const { container, rerender } = render(<PromptSuggestions suggestions={[]} loading revealDelay={1000} onSelect={() => {}} />);
      const root = container.firstElementChild as HTMLElement;
      act(() => { vi.advanceTimersByTime(600); });
      expect(root).toHaveClass("invisible");
      rerender(<PromptSuggestions suggestions={["A"]} revealDelay={1000} onSelect={() => {}} />);
      expect(container.firstElementChild).toBe(root);
      act(() => { vi.advanceTimersByTime(300); });
      expect(root).toHaveClass("invisible");
      act(() => { vi.advanceTimersByTime(100); });
      expect(root).not.toHaveClass("invisible");
    } finally {
      vi.useRealTimers();
    }
  });

  it("disables every suggestion and renders nothing without suggestions", () => {
    const { container, rerender } = render(<PromptSuggestions suggestions={["A", "B"]} onSelect={() => {}} disabled />);
    for (const b of screen.getAllByRole("button")) expect(b).toBeDisabled();
    rerender(<PromptSuggestions suggestions={["  "]} onSelect={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps one row and fades the right edge while more suggestions lie beyond it", () => {
    // Oracle: a row 500px wide showing 200px must report a right fade only.
    const sw = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(500);
    const cw = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    render(<PromptSuggestions title="Vorschläge" suggestions={["A", "B", "C"]} onSelect={() => {}} />);
    const list = screen.getByRole("list", { name: "Vorschläge" });
    expect(list.className).toContain("flex-nowrap");
    expect(list.dataset.scrollFade).toBe("right");
    sw.mockRestore();
    cw.mockRestore();
  });

  it("stays hidden until revealDelay has passed, then shows", () => {
    vi.useFakeTimers();
    const { container } = render(<PromptSuggestions suggestions={["A"]} onSelect={() => {}} revealDelay={2000} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("invisible");
    act(() => { vi.advanceTimersByTime(1999); });
    expect(root).toHaveClass("invisible");
    act(() => { vi.advanceTimersByTime(1); });
    expect(root).toHaveClass("visible");
    vi.useRealTimers();
  });
});
