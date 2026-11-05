import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "./message-scroller";

function Transcript({ label }: { label?: string }) {
  return (
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <MessageScrollerItem messageId="m1" scrollAnchor>
              Frage
            </MessageScrollerItem>
            <MessageScrollerItem messageId="m2">Antwort</MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton label={label} />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

describe("MessageScroller", () => {
  it("renders every row inside the slotted frame", () => {
    const { container } = render(<Transcript />);
    for (const slot of ["message-scroller", "message-scroller-viewport", "message-scroller-content"]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    const items = container.querySelectorAll('[data-slot="message-scroller-item"]');
    expect([...items].map((i) => i.textContent)).toEqual(["Frage", "Antwort"]);
  });

  it("renders the jump button as the library Button with a German default label", () => {
    const { container } = render(<Transcript />);
    const button = container.querySelector('[data-slot="message-scroller-button"]');
    expect(button?.tagName).toBe("BUTTON");
    expect(button).toHaveTextContent("Zum Ende springen");
    expect(button).toHaveAttribute("data-direction", "end");
  });

  it("labels the scroll region in German by default", () => {
    render(<Transcript />);
    expect(screen.getByRole("region", { name: "Nachrichten" })).toBeInTheDocument();
  });

  // Oracle: the registry's scroll-fade-b, as a mask gated on the primitive's
  // own "more content below" state (jsdom applies no mask, so the class is
  // what can be checked).
  it("fades the viewport out at its lower edge only while more content lies below", () => {
    const { container } = render(<Transcript />);
    const viewport = container.querySelector('[data-slot="message-scroller-viewport"]');
    expect(viewport?.className).toContain(
      "[&[data-scrollable~=end]]:[mask-image:linear-gradient(to_bottom,#000_calc(100%_-_3rem),transparent)]",
    );
  });

  it("accepts a custom label", () => {
    render(<Transcript label="Zur neuesten Antwort" />);
    expect(screen.getByText("Zur neuesten Antwort")).toBeInTheDocument();
  });
});
