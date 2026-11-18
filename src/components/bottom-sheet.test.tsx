import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./bottom-sheet";

describe("BottomSheet", () => {
  it("is a dialog named by its label, with header, content and footer", () => {
    render(
      <BottomSheet open onOpenChange={() => {}} label="Quellen" header={<h2>Quellen hinzufügen</h2>} footer={<p>Fuß</p>}>
        <p>Inhalt</p>
      </BottomSheet>,
    );
    const sheet = screen.getByRole("dialog", { name: "Quellen" });
    expect(sheet).toHaveAttribute("data-direction", "bottom");
    expect(within(sheet).getByRole("heading", { name: "Quellen hinzufügen" })).toBeInTheDocument();
    expect(sheet).toHaveTextContent("Inhalt");
    expect(sheet).toHaveTextContent("Fuß");
  });

  it("renders nothing while closed", () => {
    render(<BottomSheet open={false} onOpenChange={() => {}} label="Quellen"><p>Inhalt</p></BottomSheet>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks to close on Escape", async () => {
    const onOpenChange = vi.fn();
    render(<BottomSheet open onOpenChange={onOpenChange} label="Quellen"><p>Inhalt</p></BottomSheet>);
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /**
   * The height rule. jsdom has no layout, so every box is given one height:
   * the sheet then measures grip + fixed rows + content against half of the
   * 768px window.
   */
  describe("stops by content height", () => {
    const boxesAre = (height: number) =>
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(height);
    afterEach(() => {
      vi.restoreAllMocks();
    });
    const sheet = (
      <BottomSheet open onOpenChange={() => {}} label="Quellen" header={<h2>Quellen</h2>}>
        <p>Inhalt</p>
      </BottomSheet>
    );

    it("is its content's height, capped at half the screen, while the content is short", () => {
      boxesAre(100);
      render(sheet);
      const dialog = screen.getByRole("dialog");
      expect(dialog).not.toHaveAttribute("data-snap");
      expect(dialog).toHaveClass("max-h-[50dvh]");
    });

    it("gets its stops, and the screen's height to slide in, once the content is longer", () => {
      boxesAre(600);
      render(sheet);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("data-snap");
      expect(dialog).toHaveClass("max-h-[calc(100dvh-1.5rem)]");
      expect(dialog).not.toHaveClass("max-h-[50dvh]");
    });

    it("re-reads the height when the window changes", () => {
      const height = boxesAre(600);
      render(sheet);
      expect(screen.getByRole("dialog")).toHaveAttribute("data-snap");
      height.mockReturnValue(100);
      act(() => { window.dispatchEvent(new Event("resize")); });
      expect(screen.getByRole("dialog")).not.toHaveAttribute("data-snap");
    });
  });

  it("has no stops until its content is measured longer than half the screen", () => {
    render(<BottomSheet open onOpenChange={() => {}} label="Quellen"><p>Inhalt</p></BottomSheet>);
    expect(screen.getByRole("dialog")).not.toHaveAttribute("data-snap");
  });
});
