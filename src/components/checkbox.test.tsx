import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

describe("Checkbox", () => {
  it("toggles via click and reports state accessibly", async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Regel aktiv" onCheckedChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "Regel aktiv" });
    expect(box).toHaveAttribute("aria-checked", "false");
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("toggles with the keyboard", async () => {
    render(<Checkbox aria-label="Test" />);
    const box = screen.getByRole("checkbox");
    box.focus();
    await userEvent.keyboard(" ");
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("cannot be toggled when disabled", async () => {
    render(<Checkbox aria-label="Test" disabled />);
    const box = screen.getByRole("checkbox");
    await userEvent.click(box);
    expect(box).toHaveAttribute("aria-checked", "false");
    expect(box).toBeDisabled();
  });

  it("supports the indeterminate state", () => {
    render(<Checkbox aria-label="Alle" checked="indeterminate" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
  });

  it("gets its accessible name from a Label htmlFor", async () => {
    render(
      <div>
        <Checkbox id="newsletter" />
        <Label htmlFor="newsletter">Newsletter</Label>
      </div>,
    );
    const box = screen.getByRole("checkbox", { name: "Newsletter" });
    await userEvent.click(screen.getByText("Newsletter"));
    expect(box).toHaveAttribute("aria-checked", "true");
  });
});

/**
 * ORACLE — the `locked` contract in checkbox.tsx's JSDoc: a fixed value that
 * is shown but cannot be changed, announced as disabled (ARIA: a disabled
 * native button maps to `disabled`), marked with `data-locked`, and — unlike
 * `disabled` — not faded.
 */
describe("Checkbox — tone", () => {
  // Oracle: the class names that carry the colour; the computed colour is
  // checked in SidebarCard's DeleteSelection story.
  it("destructive ticks in the error colour, default in primary", () => {
    const { rerender } = render(<Checkbox aria-label="Box" tone="destructive" checked />);
    expect(screen.getByRole("checkbox").className).toContain("data-[state=checked]:bg-error");
    rerender(<Checkbox aria-label="Box" checked />);
    expect(screen.getByRole("checkbox").className).not.toContain("bg-error");
  });

  it("locked wins over destructive", () => {
    render(<Checkbox aria-label="Box" tone="destructive" locked checked />);
    expect(screen.getByRole("checkbox").className).not.toContain("bg-error");
  });
});

describe("Checkbox — locked", () => {
  it("is disabled, carries data-locked and keeps its checked state", async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Fest: an" locked checked onCheckedChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "Fest: an" });
    expect(box).toBeDisabled();
    expect(box).toHaveAttribute("data-locked");
    expect(box).toHaveAttribute("aria-checked", "true");
    await userEvent.click(box);
    expect(onChange).not.toHaveBeenCalled();
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("keeps an unchecked locked value unchecked", async () => {
    render(<Checkbox aria-label="Fest: aus" locked defaultChecked={false} />);
    const box = screen.getByRole("checkbox");
    await userEvent.click(box);
    expect(box).toHaveAttribute("aria-checked", "false");
    expect(box).toBeDisabled();
  });

  it("is not faded like disabled", () => {
    render(<Checkbox aria-label="Fest" locked />);
    expect(screen.getByRole("checkbox")).toHaveClass("disabled:opacity-100");
  });

  it("gives a locked indeterminate value the neutral look, not the primary fill", () => {
    render(<Checkbox aria-label="Fest: teilweise" locked checked="indeterminate" />);
    const box = screen.getByRole("checkbox", { name: "Fest: teilweise" });
    expect(box).toHaveAttribute("data-state", "indeterminate");
    expect(box.className).toContain("data-[state=indeterminate]:bg-surface-container-high");
  });

  it("stays locked even when disabled={false} is passed", () => {
    render(<Checkbox aria-label="Fest" locked disabled={false} />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("has no data-locked when not locked", () => {
    render(<Checkbox aria-label="Frei" />);
    expect(screen.getByRole("checkbox")).not.toHaveAttribute("data-locked");
  });
});
