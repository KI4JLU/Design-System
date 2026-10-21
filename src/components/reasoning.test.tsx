import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";
import { useReasoning } from "./reasoning-context";

// Oracles: the behaviour spec on card KI-916 and the AI Elements `Reasoning`
// README (auto-open while streaming, auto-close 1 s after it ends, duration
// in seconds rounded up), plus hand-computed values — elapsed times below are
// chosen so the rounding is checkable by hand (3.2 s → 4).

const TEXT = "Zuerst prüfe ich die Quellen.";

function renderReasoning(props: React.ComponentProps<typeof Reasoning> = {}) {
  return render(
    <Reasoning {...props}>
      <ReasoningTrigger />
      <ReasoningContent>{TEXT}</ReasoningContent>
    </Reasoning>,
  );
}

const trigger = () => screen.getByRole("button");

describe("Reasoning — streaming lifecycle (fake timers)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens when streaming starts, even with defaultOpen={false}", () => {
    const { rerender } = renderReasoning({ defaultOpen: false });
    expect(screen.queryByText(TEXT)).not.toBeInTheDocument();
    rerender(
      <Reasoning defaultOpen={false} isStreaming>
        <ReasoningTrigger />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>,
    );
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("shimmers „Denke nach …“ while streaming, then shows the rounded-up duration and folds 1 s later", () => {
    const { rerender } = renderReasoning({ isStreaming: true });
    expect(trigger()).toHaveAccessibleName("Denke nach …");
    const shimmer = screen.getByText("Denke nach …");
    expect(shimmer.tagName).toBe("SPAN");
    expect(shimmer).toHaveClass("animate-shimmer", "motion-reduce:animate-none");

    act(() => vi.advanceTimersByTime(3200));
    rerender(
      <Reasoning isStreaming={false}>
        <ReasoningTrigger />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>,
    );
    // ceil(3.2) = 4
    expect(trigger()).toHaveAccessibleName("Nachgedacht für 4 Sekunden");
    expect(screen.getByText(TEXT)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(999));
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText(TEXT)).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    // The label keeps the measured time after folding.
    expect(trigger()).toHaveAccessibleName("Nachgedacht für 4 Sekunden");
  });

  it("uses the singular for one second", () => {
    const { rerender } = renderReasoning({ isStreaming: true });
    act(() => vi.advanceTimersByTime(400));
    rerender(
      <Reasoning>
        <ReasoningTrigger />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>,
    );
    expect(trigger()).toHaveAccessibleName("Nachgedacht für 1 Sekunde");
  });

  it("does not fold by itself when it was never streamed (a message from history)", () => {
    renderReasoning();
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(trigger()).toHaveAccessibleName("Nachgedacht für einige Sekunden");
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText(TEXT)).toBeInTheDocument();
  });

  it("a toggle by the user in the second after the stream cancels the auto-close", () => {
    const { rerender } = renderReasoning({ isStreaming: true });
    act(() => vi.advanceTimersByTime(2000));
    rerender(
      <Reasoning>
        <ReasoningTrigger />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>,
    );
    fireEvent.click(trigger()); // close
    fireEvent.click(trigger()); // and open again
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(TEXT)).toBeInTheDocument();
  });

  // Review finding KI-916 r1: useReasoning()'s setter must cancel the pending
  // auto-close like the built-in trigger does, or a custom trigger's toggle
  // in that second is overridden by the fold.
  it("a custom trigger built on useReasoning cancels the auto-close too", () => {
    function CustomTrigger() {
      const { isOpen, setIsOpen } = useReasoning();
      return (
        <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
          Gedanken
        </button>
      );
    }
    const tree = (streaming: boolean) => (
      <Reasoning isStreaming={streaming}>
        <CustomTrigger />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>
    );
    const { rerender } = render(tree(true));
    act(() => vi.advanceTimersByTime(2000));
    rerender(tree(false));
    act(() => vi.advanceTimersByTime(500));
    const custom = screen.getByRole("button", { name: "Gedanken" });
    fireEvent.click(custom); // close
    fireEvent.click(custom); // and open again, inside the window
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(custom).toHaveAttribute("aria-expanded", "true");
  });

  // Controlled: the auto-open and auto-close must arrive as onOpenChange
  // calls, and the parent below applies every change it is told about.
  it("drives a controlled parent through onOpenChange: open on start, closed 1 s after the end", () => {
    const changes: boolean[] = [];
    function Parent({ streaming }: { streaming: boolean }) {
      const [open, setOpen] = React.useState(false);
      return (
        <Reasoning
          open={open}
          onOpenChange={(next) => {
            changes.push(next);
            setOpen(next);
          }}
          isStreaming={streaming}
        >
          <ReasoningTrigger />
          <ReasoningContent>{TEXT}</ReasoningContent>
        </Reasoning>
      );
    }
    const { rerender } = render(<Parent streaming />);
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1500));
    rerender(<Parent streaming={false} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText(TEXT)).not.toBeInTheDocument();
    expect(changes).toEqual([true, false]);
  });

  it("prefers the duration prop over the measured time", () => {
    renderReasoning({ duration: 12 });
    expect(trigger()).toHaveAccessibleName("Nachgedacht für 12 Sekunden");
  });
});

describe("Reasoning — trigger and content", () => {
  it("the trigger is a button with aria-expanded, toggled from the keyboard", async () => {
    renderReasoning({ duration: 3 });
    const button = trigger();
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(TEXT)).not.toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("getThinkingMessage replaces the label and receives (isStreaming, duration)", () => {
    const getThinkingMessage = vi.fn((streaming: boolean, duration?: number) =>
      streaming ? "Thinking…" : `Thought for ${duration} seconds`,
    );
    render(
      <Reasoning duration={7}>
        <ReasoningTrigger getThinkingMessage={getThinkingMessage} />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>,
    );
    expect(trigger()).toHaveAccessibleName("Thought for 7 seconds");
    expect(getThinkingMessage).toHaveBeenLastCalledWith(false, 7);
  });

  it("ReasoningContent renders children as given and passes props such as lang", () => {
    render(
      <Reasoning>
        <ReasoningTrigger />
        <ReasoningContent lang="en" data-testid="content">
          <p>First, check the sources.</p>
        </ReasoningContent>
      </Reasoning>,
    );
    const content = screen.getByTestId("content");
    expect(content).toHaveAttribute("lang", "en");
    expect(content.querySelector("p")).toHaveTextContent("First, check the sources.");
  });

  // asChild is not offered (a Slot needs one child, the trigger renders
  // three). Oracle: the type rejects it, and an untyped caller passing it
  // anyway still gets the button rather than a Slot error.
  it("ReasoningTrigger has no asChild and stays a button if it is passed anyway", () => {
    render(
      <Reasoning duration={2}>
        {/* @ts-expect-error asChild is not part of ReasoningTriggerProps */}
        <ReasoningTrigger asChild />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>,
    );
    expect(trigger().tagName).toBe("BUTTON");
    expect(trigger()).toHaveAccessibleName("Nachgedacht für 2 Sekunden");
  });

  it("useReasoning throws outside a Reasoning", () => {
    function Probe() {
      useReasoning();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("Reasoning components must be used within Reasoning");
    spy.mockRestore();
  });
});
