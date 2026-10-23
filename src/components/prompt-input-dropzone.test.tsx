import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PromptInput, PromptInputTextarea } from "./prompt-input";

const files = { dataTransfer: { types: ["Files"], files: [] } };

// Oracle: the drop zone's documented signals — `data-dragging` on the frame
// and the visible label — for dragenter / dragleave / drop with files, and
// nothing for a drag without files (text, a link).
describe("PromptInput drop zone", () => {
  it("shows the drop zone while files are dragged over it, across children", () => {
    const { container } = render(
      <PromptInput onSubmit={() => {}} dropLabel="Ablegen">
        <PromptInputTextarea aria-label="Nachricht" />
      </PromptInput>,
    );
    const form = container.querySelector("form")!;
    const frame = container.querySelector("[data-slot=input-group]")!;
    const field = screen.getByRole("textbox", { name: "Nachricht" });

    fireEvent.dragEnter(form, files);
    // Crossing into a child: enter on the child, leave on the form — still inside.
    fireEvent.dragEnter(field, files);
    fireEvent.dragLeave(form, files);
    expect(frame).toHaveAttribute("data-dragging", "over");
    expect(screen.getByText("Ablegen")).toBeInTheDocument();

    fireEvent.dragLeave(field, files);
    expect(frame).not.toHaveAttribute("data-dragging");
    expect(screen.queryByText("Ablegen")).toBeNull();

    fireEvent.dragEnter(form, files);
    fireEvent.drop(form, files);
    expect(frame).not.toHaveAttribute("data-dragging");
  });

  it("with dropZoneScope=page lights up for a file drag anywhere in the document", () => {
    const { container } = render(
      <>
        <div data-testid="elsewhere" />
        <PromptInput onSubmit={() => {}} dropZoneScope="page"><PromptInputTextarea /></PromptInput>
      </>,
    );
    const frame = container.querySelector("[data-slot=input-group]")!;
    fireEvent.dragEnter(screen.getByTestId("elsewhere"), files);
    expect(frame).toHaveAttribute("data-dragging", "armed");
    // Directly over the composer: the stronger state.
    fireEvent.dragEnter(container.querySelector("form")!, files);
    expect(frame).toHaveAttribute("data-dragging", "over");
    fireEvent.dragLeave(container.querySelector("form")!, files);
    expect(frame).toHaveAttribute("data-dragging", "armed");
    fireEvent.dragLeave(screen.getByTestId("elsewhere"), files);
    fireEvent.dragLeave(screen.getByTestId("elsewhere"), files);
    expect(frame).not.toHaveAttribute("data-dragging");
  });

  it("ignores a drag without files", () => {
    const { container } = render(<PromptInput onSubmit={() => {}}><PromptInputTextarea /></PromptInput>);
    fireEvent.dragEnter(container.querySelector("form")!, { dataTransfer: { types: ["text/plain"] } });
    expect(container.querySelector("[data-slot=input-group]")).not.toHaveAttribute("data-dragging");
  });
});
