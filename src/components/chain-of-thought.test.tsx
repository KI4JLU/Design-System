import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchIcon } from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./chain-of-thought";

// Oracles: the WAI-ARIA APG disclosure pattern (button + aria-expanded +
// aria-controls naming the region), the ARIA spec's `aria-current="step"`
// for the current step of a process, and the token names from
// COMPONENT_GUIDELINES.md's shadcn → JLU mapping (muted-foreground →
// on-surface-variant, foreground → on-surface, secondary → secondary-container).

function renderChain(props: React.ComponentProps<typeof ChainOfThought> = {}) {
  return render(
    <ChainOfThought {...props}>
      <ChainOfThoughtHeader />
      <ChainOfThoughtContent>
        <ChainOfThoughtStep label="Anfrage verstanden" status="complete" />
        <ChainOfThoughtStep icon={SearchIcon} label="Suche in den Quellen" status="active">
          <ChainOfThoughtSearchResults>
            <ChainOfThoughtSearchResult>uni-giessen.de</ChainOfThoughtSearchResult>
          </ChainOfThoughtSearchResults>
        </ChainOfThoughtStep>
        <ChainOfThoughtStep label="Antwort formulieren" description="Noch nicht begonnen" status="pending" />
        <ChainOfThoughtImage caption="Belegung je Semester">
          <img alt="Diagramm" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
        </ChainOfThoughtImage>
      </ChainOfThoughtContent>
    </ChainOfThought>,
  );
}

const step = (label: string) => screen.getByText(label).closest("[data-status]") as HTMLElement;

describe("ChainOfThought", () => {
  it("is closed by default; the header is a button whose aria-controls names the content", async () => {
    renderChain();
    const header = screen.getByRole("button", { name: "Gedankengang" });
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Anfrage verstanden")).not.toBeInTheDocument();

    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    const content = screen.getByText("Anfrage verstanden").closest("[data-state]") as HTMLElement;
    // AI Elements renders header and content in two separate Collapsibles,
    // so there the id would not resolve. One root here.
    expect(header.getAttribute("aria-controls")).toBe(content.id);
    expect(document.getElementById(content.id)).toBe(content);
  });

  it("toggles from the keyboard and takes a custom header label", async () => {
    render(
      <ChainOfThought>
        <ChainOfThoughtHeader>Recherche</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Schritt" />
        </ChainOfThoughtContent>
      </ChainOfThought>,
    );
    const header = screen.getByRole("button", { name: "Recherche" });
    await userEvent.tab();
    expect(header).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByText("Schritt")).toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(screen.queryByText("Schritt")).not.toBeInTheDocument();
  });

  // Review finding KI-916 r1: the header renders icon + label + chevron, so a
  // Radix Slot (asChild) would throw on three children. Oracle: the type
  // rejects asChild, and an untyped caller passing it still gets the button.
  it("the header has no asChild and stays a button if it is passed anyway", async () => {
    render(
      <ChainOfThought>
        {/* @ts-expect-error asChild is not part of ChainOfThoughtHeaderProps */}
        <ChainOfThoughtHeader asChild>Recherche</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Schritt" />
        </ChainOfThoughtContent>
      </ChainOfThought>,
    );
    const header = screen.getByRole("button", { name: "Recherche" });
    expect(header.tagName).toBe("BUTTON");
    await userEvent.click(header);
    expect(screen.getByText("Schritt")).toBeInTheDocument();
  });

  it("styles each step by status and marks only the active one aria-current=step", () => {
    renderChain({ defaultOpen: true });

    const complete = step("Anfrage verstanden");
    const active = step("Suche in den Quellen");
    const pending = step("Antwort formulieren");

    expect(complete).toHaveAttribute("data-status", "complete");
    expect(complete).toHaveClass("text-on-surface-variant");
    expect(complete).not.toHaveAttribute("aria-current");

    expect(active).toHaveAttribute("data-status", "active");
    expect(active).toHaveClass("text-on-surface");
    expect(active).toHaveAttribute("aria-current", "step");

    expect(pending).toHaveAttribute("data-status", "pending");
    expect(pending).not.toHaveAttribute("aria-current");
    // Pending dims its icon, not its label (the label stays AA-readable).
    expect(pending).toHaveClass("text-on-surface-variant");
    expect(pending.querySelector("svg")).toHaveClass("text-outline");
    expect(complete.querySelector("svg")).not.toHaveClass("text-outline");
    expect(screen.getByText("Noch nicht begonnen")).toHaveClass("text-xs", "text-on-surface-variant");
  });

  it("renders search results as secondary badges and decorative icons", () => {
    renderChain({ defaultOpen: true });
    expect(screen.getByText("uni-giessen.de")).toHaveClass(
      "bg-secondary-container",
      "text-on-secondary-container",
    );
    for (const svg of document.querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("renders an image step as a figure with its caption", () => {
    renderChain({ defaultOpen: true });
    const figure = screen.getByRole("figure");
    expect(figure.querySelector("figcaption")).toHaveTextContent("Belegung je Semester");
    expect(figure).toContainElement(screen.getByAltText("Diagramm"));
  });
});
