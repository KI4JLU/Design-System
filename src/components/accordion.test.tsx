import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

// Oracle for this file: the registry source of shadcn/ui's `accordion`
// (https://ui.shadcn.com/r/styles/new-york-v4/accordion.json) — each part adds
// a `data-slot`, the trigger sits in a heading and ends in a chevron — and
// Radix Accordion's documented behaviour (`single` closes the other item,
// `multiple` keeps several open, closed content is not mounted, the trigger
// carries aria-expanded). Neither is derived from this repo.
function renderAccordion(props: React.ComponentProps<typeof Accordion>) {
  return render(
    <Accordion data-testid="root" {...props}>
      <AccordionItem value="stil" data-testid="item">
        <AccordionTrigger>Antwortstil</AccordionTrigger>
        <AccordionContent>Kurz und prägnant</AccordionContent>
      </AccordionItem>
      <AccordionItem value="quellen">
        <AccordionTrigger>Quellen</AccordionTrigger>
        <AccordionContent>Seitenzahlen angeben</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
}

describe("Accordion", () => {
  it("marks every part with its data-slot and puts the trigger in a heading", () => {
    renderAccordion({ type: "single", defaultValue: "stil" });
    expect(screen.getByTestId("root")).toHaveAttribute("data-slot", "accordion");
    expect(screen.getByTestId("item")).toHaveAttribute("data-slot", "accordion-item");
    const trigger = screen.getByRole("button", { name: "Antwortstil" });
    expect(trigger).toHaveAttribute("data-slot", "accordion-trigger");
    expect(trigger.closest("h3")).not.toBeNull();
    expect(screen.getByText("Kurz und prägnant").closest("[data-slot=accordion-content]")).not.toBeNull();
  });

  it("single: opening one item closes the other; closed content is not mounted", () => {
    renderAccordion({ type: "single", collapsible: true, defaultValue: "stil" });
    expect(screen.getByRole("button", { name: "Antwortstil" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Seitenzahlen angeben")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Quellen" }));
    expect(screen.getByRole("button", { name: "Antwortstil" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Kurz und prägnant")).toBeNull();
    expect(screen.getByText("Seitenzahlen angeben")).toBeInTheDocument();
  });

  it("multiple: keeps several items open", () => {
    renderAccordion({ type: "multiple" });
    fireEvent.click(screen.getByRole("button", { name: "Antwortstil" }));
    fireEvent.click(screen.getByRole("button", { name: "Quellen" }));
    expect(screen.getByText("Kurz und prägnant")).toBeInTheDocument();
    expect(screen.getByText("Seitenzahlen angeben")).toBeInTheDocument();
  });
});
