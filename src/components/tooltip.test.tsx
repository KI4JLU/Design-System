import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Button } from "./button";

/**
 * Oracles are the WAI-ARIA APG tooltip pattern, independent of the
 * implementation: the trigger is described by (`aria-describedby`) an element
 * with `role="tooltip"` that carries the hint text; hover AND focus open;
 * Escape dismisses; the tooltip itself never receives focus.
 */
const renderTooltip = () =>
  render(
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Aktualisieren">
          ↻
        </Button>
      </TooltipTrigger>
      <TooltipContent>Daten neu laden</TooltipContent>
    </Tooltip>,
  );

/** The APG wiring: aria-describedby must resolve to the role="tooltip"
 * element, and that element must contain the hint text. */
const expectDescribedByTooltip = (trigger: HTMLElement, text: string) => {
  const describedBy = trigger.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  const tooltip = document.getElementById(describedBy as string);
  expect(tooltip).not.toBeNull();
  expect(tooltip).toHaveAttribute("role", "tooltip");
  expect(tooltip).toHaveTextContent(text);
  return tooltip as HTMLElement;
};

describe("Tooltip", () => {
  it("opens on hover and describes the trigger via aria-describedby → role=tooltip", async () => {
    renderTooltip();
    const trigger = screen.getByRole("button", { name: "Aktualisieren" });
    await userEvent.hover(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-describedby"));
    expectDescribedByTooltip(trigger, "Daten neu laden");
  });

  it("opens on keyboard focus alone (no pointer)", async () => {
    renderTooltip();
    const trigger = screen.getByRole("button", { name: "Aktualisieren" });
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await waitFor(() => expect(trigger).toHaveAttribute("aria-describedby"));
    expectDescribedByTooltip(trigger, "Daten neu laden");
  });

  it("dismisses on Escape while focus stays on the trigger", async () => {
    renderTooltip();
    const trigger = screen.getByRole("button", { name: "Aktualisieren" });
    await userEvent.tab();
    await waitFor(() => expect(trigger).toHaveAttribute("aria-describedby"));
    const tooltipId = trigger.getAttribute("aria-describedby") as string;
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).not.toHaveAttribute("aria-describedby"));
    // The tooltip element is gone, not merely unhooked.
    expect(document.getElementById(tooltipId)).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("never takes focus itself — Tab moves past the trigger, not into the tooltip", async () => {
    renderTooltip();
    const trigger = screen.getByRole("button", { name: "Aktualisieren" });
    await userEvent.tab();
    await waitFor(() => expect(trigger).toHaveAttribute("aria-describedby"));
    const tooltip = expectDescribedByTooltip(trigger, "Daten neu laden");
    // Not focusable: no tabindex, and tabbing away must not land inside it.
    expect(tooltip).not.toHaveAttribute("tabindex");
    await userEvent.tab();
    expect(tooltip.contains(document.activeElement)).toBe(false);
  });

  it("keeps the trigger's own accessible name — the tooltip only describes", async () => {
    renderTooltip();
    const trigger = screen.getByRole("button", { name: "Aktualisieren" });
    await userEvent.hover(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-describedby"));
    // Name still the aria-label, not the hint text.
    expect(screen.getByRole("button", { name: "Aktualisieren" })).toBe(trigger);
  });

  it("portals into a given container (e.g. a fullscreen element)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Ziel</TooltipTrigger>
          <TooltipContent container={host}>Im Container</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(host.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent("Im Container");
    host.remove();
  });
});
