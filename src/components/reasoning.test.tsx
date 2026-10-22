import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";
import { useReasoning } from "./reasoning-context";

// Oracle for this file: the AI Elements registry source of `reasoning`
// (https://elements.ai-sdk.dev/api/registry/reasoning.json, the revision the
// AI Elements CLI installed) — `defaultOpen ?? isStreaming`, the auto-open
// effect skipped only for `defaultOpen === false`, the duration
// `Math.ceil(ms / 1000)`, the 1000 ms AUTO_CLOSE_DELAY gated on "ever
// streamed", and defaultGetThinkingMessage's three branches. The German
// strings are the translations of upstream's literals ("Thinking...",
// "Thought for a few seconds", "Thought for N seconds").
const TEXT = "Ich vergleiche beide Prüfungsordnungen.";

function Subject(props: { isStreaming?: boolean; defaultOpen?: boolean; duration?: number }) {
  return (
    <Reasoning {...props}>
      <ReasoningTrigger />
      <ReasoningContent>{TEXT}</ReasoningContent>
    </Reasoning>
  );
}

const trigger = () => screen.getByRole("button");

describe("Reasoning", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens while streaming and shows the thinking label", () => {
    render(<Subject isStreaming />);
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveTextContent("Denke nach …");
    expect(screen.getByText(TEXT)).toBeInTheDocument();
  });

  it("measures the stream in whole seconds, rounded up, and folds 1000 ms after it ends", () => {
    const { rerender } = render(<Subject isStreaming />);
    act(() => vi.advanceTimersByTime(2500));
    rerender(<Subject isStreaming={false} />);
    // ceil(2.5 s) = 3
    expect(trigger()).toHaveTextContent("Nachgedacht für 3 Sekunden");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    act(() => vi.advanceTimersByTime(999));
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("is closed for a never-streamed (history) block and labels a missing duration", () => {
    render(<Subject />);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveTextContent("Nachgedacht für ein paar Sekunden");
    expect(screen.queryByText(TEXT)).not.toBeInTheDocument();
  });

  it("uses the duration prop for the label", () => {
    render(<Subject duration={7} />);
    expect(trigger()).toHaveTextContent("Nachgedacht für 7 Sekunden");
  });

  it("does not fold by itself when it never streamed", () => {
    render(<Subject defaultOpen duration={4} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("opens when a stream starts on a closed block", () => {
    const { rerender } = render(<Subject />);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    rerender(<Subject isStreaming />);
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("stays closed while streaming when defaultOpen is explicitly false", () => {
    render(<Subject isStreaming defaultOpen={false} />);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles from the trigger and reports it through onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(
      <Reasoning onOpenChange={onOpenChange}>
        <ReasoningTrigger />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>,
    );
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("replaces the label through getThinkingMessage", () => {
    render(
      <Reasoning duration={5}>
        <ReasoningTrigger
          getThinkingMessage={(isStreaming, duration) =>
            isStreaming ? "thinking" : `thought ${duration}s`
          }
        />
        <ReasoningContent>{TEXT}</ReasoningContent>
      </Reasoning>,
    );
    expect(trigger()).toHaveTextContent("thought 5s");
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
