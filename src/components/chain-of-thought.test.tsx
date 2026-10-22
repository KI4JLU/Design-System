import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./chain-of-thought";

// Oracle for this file: the AI Elements registry source of `chain-of-thought`
// (https://elements.ai-sdk.dev/api/registry/chain-of-thought.json, the
// revision the AI Elements CLI installed): `defaultOpen = false`, header and
// content each in their own Collapsible driven by one shared open state,
// the header's fallback label "Chain of Thought" (here its German
// translation „Gedankengang"), the step's label/description/children
// layout, the image's optional caption, and the context-guard message.
describe("ChainOfThought", () => {
  function Subject(props: { defaultOpen?: boolean; open?: boolean; onOpenChange?: (o: boolean) => void }) {
    return (
      <ChainOfThought {...props}>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Suche" description="Zwei Treffer">
            <ChainOfThoughtSearchResults>
              <ChainOfThoughtSearchResult>PO Informatik</ChainOfThoughtSearchResult>
            </ChainOfThoughtSearchResults>
          </ChainOfThoughtStep>
        </ChainOfThoughtContent>
      </ChainOfThought>
    );
  }

  it("is closed by default with the default header label", () => {
    render(<Subject />);
    const header = screen.getByRole("button", { name: "Gedankengang" });
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Suche")).not.toBeInTheDocument();
  });

  it("opens the content from the header (shared open state across both Collapsibles)", () => {
    render(<Subject />);
    fireEvent.click(screen.getByRole("button", { name: "Gedankengang" }));
    expect(screen.getByRole("button", { name: "Gedankengang" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Suche")).toBeInTheDocument();
    expect(screen.getByText("Zwei Treffer")).toBeInTheDocument();
    expect(screen.getByText("PO Informatik")).toBeInTheDocument();
  });

  it("reports toggles through onOpenChange when controlled", () => {
    const onOpenChange = vi.fn();
    render(<Subject open={false} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Gedankengang" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Controlled and still `open={false}`: stays closed.
    expect(screen.queryByText("Suche")).not.toBeInTheDocument();
  });

  it("uses header children instead of the default label", () => {
    render(
      <ChainOfThought>
        <ChainOfThoughtHeader>Recherche</ChainOfThoughtHeader>
      </ChainOfThought>,
    );
    expect(screen.getByRole("button", { name: "Recherche" })).toBeInTheDocument();
  });

  it("renders an image with its caption", () => {
    render(
      <ChainOfThoughtImage caption="Fristen">
        <span>Bild</span>
      </ChainOfThoughtImage>,
    );
    expect(screen.getByText("Bild")).toBeInTheDocument();
    expect(screen.getByText("Fristen")).toBeInTheDocument();
  });

  it("throws when a part is used outside ChainOfThought", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ChainOfThoughtHeader />)).toThrow(
      "ChainOfThought components must be used within ChainOfThought",
    );
    spy.mockRestore();
  });
});
