import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Progress } from "./progress";

const indicatorOf = (bar: HTMLElement) =>
  bar.firstElementChild!.firstElementChild as HTMLElement;

describe("Progress", () => {
  it("is a named progressbar with min, max and now", () => {
    render(<Progress value={42} label="bericht.pdf" />);
    const bar = screen.getByRole("progressbar", { name: "bericht.pdf" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(indicatorOf(bar).style.width).toBe("42%");
  });

  it("can be named by aria-labelledby instead of label", () => {
    render(
      <>
        <span id="file">vorlesung.mp3</span>
        <Progress value={10} aria-labelledby="file" />
      </>,
    );
    expect(screen.getByRole("progressbar", { name: "vorlesung.mp3" })).toBeInTheDocument();
  });

  it("is indeterminate without a value: no aria-valuenow, pulsing bar", () => {
    render(<Progress label="Wird übersetzt" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    const indicator = indicatorOf(bar);
    expect(indicator).toHaveClass("w-full", "animate-pulse", "motion-reduce:animate-none");
    expect(indicator.style.width).toBe("");
  });

  it("treats null and NaN as indeterminate", () => {
    const { rerender } = render(<Progress value={null} label="x" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    rerender(<Progress value={Number.NaN} label="x" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });

  it("clamps the value into 0–max and scales by max", () => {
    const { rerender } = render(<Progress value={150} label="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    rerender(<Progress value={-5} label="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    rerender(<Progress value={3} max={12} label="x" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemax", "12");
    expect(indicatorOf(bar).style.width).toBe("25%");
  });

  it("passes aria-valuetext through", () => {
    render(<Progress value={3} max={12} label="Seiten" aria-valuetext="Seite 3 von 12" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "Seite 3 von 12",
    );
  });

  it("shows a German percentage with showValue, hidden from assistive tech", () => {
    render(<Progress value={42.4} label="x" showValue />);
    const text = screen.getByRole("progressbar").lastElementChild!;
    expect(text.textContent).toBe("42\u00a0%");
    expect(text).toHaveAttribute("aria-hidden", "true");
    expect(text).toHaveClass("tabular-nums", "text-on-surface-variant");
  });

  it("formats the percentage via formatValue and hides it while indeterminate", () => {
    const { rerender } = render(
      <Progress value={50} label="x" showValue formatValue={(p) => `${p}%`} />,
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
    rerender(<Progress label="x" showValue formatValue={(p) => `${p}%`} />);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("maps tone and size onto tokens", () => {
    render(<Progress value={100} label="x" tone="success" size="sm" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.firstElementChild).toHaveClass("h-1", "bg-surface-container-high");
    expect(indicatorOf(bar)).toHaveClass("bg-success");
  });

  it("passes className through and forwards the ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Progress ref={ref} value={1} label="x" className="w-24" />);
    expect(ref.current).toBe(screen.getByRole("progressbar"));
    expect(ref.current).toHaveClass("w-24");
  });
});
