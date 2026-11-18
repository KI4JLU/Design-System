import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("has no stops until its content is measured longer than half the screen", () => {
    render(<BottomSheet open onOpenChange={() => {}} label="Quellen"><p>Inhalt</p></BottomSheet>);
    expect(screen.getByRole("dialog")).not.toHaveAttribute("data-snap");
  });
});
