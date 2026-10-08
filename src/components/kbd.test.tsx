import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kbd, KbdGroup } from "./kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

describe("Kbd", () => {
  it("renders a <kbd> key inside a <kbd> group", () => {
    render(
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    const key = screen.getByText("K");
    expect(key.tagName).toBe("KBD");
    expect(key).toHaveAttribute("data-slot", "kbd");
    expect(key.parentElement).toHaveAttribute("data-slot", "kbd-group");
  });

  it("marks tooltip content so a nested Kbd can restyle itself", () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Suche</TooltipTrigger>
          <TooltipContent>
            Suchen <Kbd>K</Kbd>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const key = screen.getAllByText("K")[0];
    expect(key.closest('[data-slot="tooltip-content"]')).not.toBeNull();
  });
});
