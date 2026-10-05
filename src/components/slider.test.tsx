import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Slider } from "./slider";
import { Label } from "./label";

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

describe("Slider", () => {
  it("renders one named thumb per value", () => {
    render(<Slider defaultValue={[10, 40]} max={250} thumbLabels={["Start", "Ende"]} />);
    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(screen.getByRole("slider", { name: "Start" })).toHaveAttribute("aria-valuenow", "10");
    expect(screen.getByRole("slider", { name: "Ende" })).toHaveAttribute("aria-valuenow", "40");
  });

  it("names the group when every thumb has its own label", () => {
    render(
      <Slider
        defaultValue={[10, 40]}
        aria-label="Probefenster"
        thumbLabels={["Start", "Ende"]}
      />,
    );
    expect(screen.getByRole("group", { name: "Probefenster" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Start" })).toBeInTheDocument();
  });

  it("forwards aria-label / aria-labelledby to a single thumb", () => {
    const { rerender } = render(<Slider defaultValue={[50]} aria-label="Lautstärke" />);
    expect(screen.getByRole("slider", { name: "Lautstärke" })).toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();

    rerender(
      <>
        <Label id="volume-label">Lautstärke</Label>
        <Slider defaultValue={[50]} aria-labelledby="volume-label" />
      </>,
    );
    expect(screen.getByRole("slider", { name: "Lautstärke" })).toBeInTheDocument();
  });

  it("reports aria-valuetext from getValueText and keeps it current", async () => {
    const user = userEvent.setup();
    render(
      <Slider
        defaultValue={[83]}
        max={250}
        aria-label="Wiedergabeposition"
        getValueText={(v) => `${formatTime(v)} von ${formatTime(250)}`}
      />,
    );
    const thumb = screen.getByRole("slider", { name: "Wiedergabeposition" });
    expect(thumb).toHaveAttribute("aria-valuetext", "1:23 von 4:10");

    thumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(thumb).toHaveAttribute("aria-valuetext", "1:24 von 4:10");
  });

  it("steps with the keyboard and reports changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider
        defaultValue={[50]}
        step={5}
        aria-label="Lautstärke"
        onValueChange={onValueChange}
      />,
    );
    const thumb = screen.getByRole("slider", { name: "Lautstärke" });
    thumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith([55]);
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(thumb).toHaveAttribute("aria-valuenow", "45");
    await user.keyboard("{End}");
    expect(thumb).toHaveAttribute("aria-valuenow", "100");
  });

  it("follows a controlled value", () => {
    const { rerender } = render(
      <Slider value={[20]} aria-label="Lautstärke" getValueText={(v) => `${v} %`} />,
    );
    const thumb = screen.getByRole("slider", { name: "Lautstärke" });
    expect(thumb).toHaveAttribute("aria-valuetext", "20 %");
    rerender(<Slider value={[70]} aria-label="Lautstärke" getValueText={(v) => `${v} %`} />);
    expect(thumb).toHaveAttribute("aria-valuetext", "70 %");
  });

  it("ignores the keyboard when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider defaultValue={[50]} disabled aria-label="Lautstärke" onValueChange={onValueChange} />,
    );
    const thumb = screen.getByRole("slider", { name: "Lautstärke" });
    expect(thumb).toHaveAttribute("data-disabled");
    thumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
