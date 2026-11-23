import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./item";

describe("Item", () => {
  it("renders its parts with data-slot and the variant as data attributes", () => {
    const { container } = render(
      <Item variant="muted">
        <ItemMedia variant="icon">i</ItemMedia>
        <ItemContent>
          <ItemTitle>Titel</ItemTitle>
          <ItemDescription>Text</ItemDescription>
        </ItemContent>
      </Item>,
    );
    const item = container.querySelector('[data-slot="item"]')!;
    expect(item).toHaveAttribute("data-variant", "muted");
    expect(item).toHaveClass("bg-surface-container/50");
    expect(screen.getByText("Text")).toHaveAttribute("data-slot", "item-description");
    expect(screen.getByText("Text")).toHaveClass("text-on-surface-variant");
  });

  it("renders onto a link with asChild", () => {
    render(<Item asChild><a href="#x">Link</a></Item>);
    expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("data-slot", "item");
  });
});
