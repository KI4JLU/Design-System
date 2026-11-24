import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatStage, ChatStageColumn } from "./chat-stage";

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
    // …and wraps within the box on that axis, the full stage when unset.
    expect(header.className).toContain("max-w-[var(--chat-axis-width,100%)]");
    // A badge in it wraps its text: no item is wider than the row.
    expect(header.className).toContain("[:where(&>*)]:max-w-full");
    expect(header.className).toContain("[&>[data-slot=badge]]:whitespace-normal");
    expect(header.className).toContain("[&>[data-slot=badge]]:wrap-anywhere");
    rerender(<ChatStage><p>x</p></ChatStage>);
    expect(container.querySelector("[data-slot=chat-stage-header]")).toBeNull();
  });

  // Oracle: the owner's brief and the setting's own text — the chat width
  // only caps the column on a large screen, it never keeps margins below
  // that. jsdom resolves no cqw, so the test pins the declarations.
  it("publishes the column width as the stage, capped by the chat width setting", () => {
    const { container, rerender } = render(<ChatStage><p>x</p></ChatStage>);
    const stage = () => container.querySelector("[data-slot=chat-stage]") as HTMLElement;
    expect(stage()).toHaveAttribute("data-width", "comfortable");
    expect(stage().className).toContain("@container");
    expect(stage().className).toContain("[--chat-width-cap:60rem]");
    expect(stage().className).toContain("[--chat-column-width:min(var(--chat-width-cap),var(--chat-room))]");
    expect(stage().className).not.toContain("cqw_+");
    // Beside the shell's card: exactly the room it leaves, no floor.
    expect(stage().className).toContain("[--chat-room:calc(100cqw_-_var(--chat-clear))]");
    rerender(<ChatStage width="wide"><p>x</p></ChatStage>);
    expect(stage().className).toContain("[--chat-width-cap:80rem]");
    rerender(<ChatStage width="full"><p>x</p></ChatStage>);
    expect(stage().className).toContain("[--chat-width-cap:100cqw]");
  });

  // Oracle: the owner's brief (KI-1046) — every box of the column moves with
  // one axis. jsdom resolves no cqw, so the test pins that the stage works the
  // shift out from the shell's inset and that each box reads the same values.
  it("works the centre axis out itself and puts composer and footer on it", () => {
    const { container, rerender } = render(<ChatStage composer="c" footer="f"><p>x</p></ChatStage>);
    const stage = () => container.querySelector("[data-slot=chat-stage]") as HTMLElement;
    const slot = (name: string) => container.querySelector(`[data-slot=${name}]`) as HTMLElement;
    expect(stage().className).toContain("[--chat-box:var(--chat-column-width)]");
    expect(stage().className).toContain("[--chat-axis-shift:clamp(0px,var(--chat-clear)_-_(100cqw_-_var(--chat-box))_/_2,(100cqw_-_var(--chat-box))_/_2)]");
    expect(stage().className).toContain("[--chat-axis-width:var(--chat-box)]");
    expect(slot("chat-stage-composer").className).toContain("left-[calc(-1_*_var(--chat-axis-shift,0px))]");
    expect(slot("chat-stage-composer").className).toContain("max-w-[var(--chat-box,100%)]");
    expect(slot("chat-stage-composer").className).toContain("px-[var(--chat-column-inset)]");
    expect(slot("chat-stage-footer").className).toContain("left-[calc(-1_*_var(--chat-axis-shift,0px))]");
    // Two lines reserved whatever the width, so the composer never jumps.
    expect(slot("chat-stage-footer").className).toContain("min-h-[calc(2lh_+_1rem)]");
    // Empty: the start page's narrower box, and a wider gap above the composer.
    rerender(<ChatStage empty composer="c" footer="f"><p>x</p></ChatStage>);
    expect(stage().className).toContain("[--chat-box:min(42rem,var(--chat-column-width))]");
    expect(stage().className).not.toContain("[--chat-box:var(--chat-column-width)]");
    expect(slot("chat-stage-composer")).toHaveClass("px-4", "pt-8");
  });

  it("pins the footer to the bottom of an empty chat without a composer", () => {
    const { container, rerender } = render(<ChatStage empty align="start" footer="f"><p>x</p></ChatStage>);
    const footer = () => container.querySelector("[data-slot=chat-stage-footer]")!;
    expect(footer().className).toContain("mt-auto");
    rerender(<ChatStage empty align="start" composer="c" footer="f"><p>x</p></ChatStage>);
    expect(footer().className).not.toContain("mt-auto");
  });

  it("anchors an empty chat at the top with align=start, footer still last", () => {
    const { container } = render(<ChatStage empty align="start" composer="c" footer="f"><p>x</p></ChatStage>);
    const content = container.querySelector("[data-slot=chat-stage-content]") as HTMLElement;
    expect(content).not.toHaveClass("mt-auto");
    expect(container.querySelector("[data-slot=chat-stage-composer]")).toHaveClass("mb-auto");
    expect(container.querySelector("[data-slot=chat-stage]")).toHaveAttribute("data-align", "start");
  });

  it("ChatStageColumn puts its box — or its child, asChild — on the axis", () => {
    const { container } = render(
      <ChatStage>
        <ChatStageColumn asChild className="gap-0">
          <section aria-label="Verlauf">x</section>
        </ChatStageColumn>
      </ChatStage>,
    );
    const column = screen.getByRole("region", { name: "Verlauf" });
    expect(column.tagName).toBe("SECTION");
    expect(column).toHaveAttribute("data-slot", "chat-stage-column");
    expect(column.className).toContain("left-[calc(-1_*_var(--chat-axis-shift,0px))]");
    expect(column.className).toContain("px-[var(--chat-column-inset)]");
    expect(column).toHaveClass("gap-0");
    expect(container.querySelector("[data-slot=chat-stage-content]")).toContainElement(column);
  });
});
