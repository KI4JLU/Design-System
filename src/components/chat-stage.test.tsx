import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatStage } from "./chat-stage";

// Oracle: the order of the three regions and the `empty` flag handed in —
// centring itself is layout jsdom cannot measure, so the test pins the
// structure it rests on (content before composer before footer, auto margins
// only while empty).
describe("ChatStage", () => {
  it("orders content, composer and footer, and gives the footer its id", () => {
    render(
      <ChatStage empty composer={<textarea aria-label="Nachricht" />} footer="KI kann Fehler machen." footerId="chat-disclaimer">
        <h1>Willkommen</h1>
      </ChatStage>,
    );
    const stage = screen.getByRole("heading").closest("[data-slot=chat-stage]") as HTMLElement;
    expect(Array.from(stage.children, (c) => (c as HTMLElement).dataset.slot)).toEqual([
      "chat-stage-content",
      "chat-stage-composer",
      "chat-stage-footer",
    ]);
    expect(stage.dataset.empty).toBe("true");
    expect(screen.getByText("KI kann Fehler machen.")).toHaveAttribute("id", "chat-disclaimer");
  });

  it("centres only while empty", () => {
    const { container, rerender } = render(<ChatStage empty composer="c">x</ChatStage>);
    const composer = () => container.querySelector("[data-slot=chat-stage-composer]") as HTMLElement;
    expect(composer()).toHaveClass("mb-auto");
    rerender(<ChatStage composer="c">x</ChatStage>);
    expect(composer()).not.toHaveClass("mb-auto");
    expect(container.querySelector("[data-slot=chat-stage]")).not.toHaveAttribute("data-empty");
  });

  // Oracle: the header is the first thing in the content region (so an empty
  // chat centres it with the content) and carries the axis shift; without the
  // prop nothing renders.
  it("puts the header row first in the content and moves it with the centre axis", () => {
    const { container, rerender } = render(<ChatStage header={<span>Rolle</span>}><p>x</p></ChatStage>);
    const content = container.querySelector("[data-slot=chat-stage-content]") as HTMLElement;
    const header = content.firstElementChild as HTMLElement;
    expect(header.dataset.slot).toBe("chat-stage-header");
    expect(header).toHaveTextContent("Rolle");
    expect(header.className).toContain("var(--chat-axis-shift,0px)");
    rerender(<ChatStage><p>x</p></ChatStage>);
    expect(container.querySelector("[data-slot=chat-stage-header]")).toBeNull();
  });
});
