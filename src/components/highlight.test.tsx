import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Highlight } from "./highlight";
import { highlightVariants } from "./highlight-variants";

describe("Highlight", () => {
  it("renders a <mark> with the warning container by default, without a label", () => {
    const { container } = render(<Highlight>Glossar</Highlight>);
    const mark = container.querySelector("mark")!;
    expect(mark).toHaveTextContent(/^Glossar$/);
    expect(mark).toHaveClass("bg-warning-container", "text-on-warning-container");
    expect(mark.querySelector(".sr-only")).toBeNull();
  });

  it("renders <ins> underlined with a hidden German label", () => {
    const { container } = render(<Highlight kind="insert">senden</Highlight>);
    const ins = container.querySelector("ins")!;
    expect(ins).toHaveClass("underline", "bg-success-container");
    expect(ins).toHaveTextContent("eingefügt: senden");
    expect(ins.querySelector(".sr-only")).toHaveTextContent("eingefügt:");
  });

  it("renders <del> struck through with a hidden German label", () => {
    const { container } = render(<Highlight kind="delete">schicken</Highlight>);
    const del = container.querySelector("del")!;
    expect(del).toHaveClass("line-through", "bg-error-container");
    expect(del).toHaveTextContent("gelöscht: schicken");
  });

  it("overrides or drops the label", () => {
    const { container, rerender } = render(
      <Highlight kind="insert" label="inserted:">
        send
      </Highlight>,
    );
    expect(container.querySelector("ins")).toHaveTextContent("inserted: send");
    rerender(
      <Highlight kind="insert" label="">
        send
      </Highlight>,
    );
    expect(container.querySelector("ins")).toHaveTextContent(/^send$/);
  });

  it("uses the solid tone when active", () => {
    const { container } = render(
      <>
        <Highlight active>a</Highlight>
        <Highlight kind="insert" active>
          b
        </Highlight>
        <Highlight kind="delete" active>
          c
        </Highlight>
      </>,
    );
    expect(container.querySelector("mark")).toHaveClass("bg-warning", "text-on-warning");
    expect(container.querySelector("mark")).not.toHaveClass("bg-warning-container");
    expect(container.querySelector("ins")).toHaveClass("bg-success", "text-on-success");
    expect(container.querySelector("del")).toHaveClass("bg-error", "text-on-error");
  });

  it("renders the child element with asChild and keeps the label inside it", () => {
    render(
      <Highlight kind="delete" asChild>
        <span data-testid="piece">alt</span>
      </Highlight>,
    );
    const piece = screen.getByTestId("piece");
    expect(piece.tagName).toBe("SPAN");
    expect(piece).toHaveClass("line-through");
    expect(piece).toHaveTextContent("gelöscht: alt");
  });

  it("passes className and attributes through", () => {
    const { container } = render(
      <Highlight className="scroll-mt-4" data-index="2">
        x
      </Highlight>,
    );
    const mark = container.querySelector("mark")!;
    expect(mark).toHaveClass("scroll-mt-4", "rounded");
    expect(mark).toHaveAttribute("data-index", "2");
  });

  it("exports the classes for HTML strings and decorations", () => {
    expect(highlightVariants({ kind: "delete" })).toContain("line-through");
    expect(highlightVariants()).toContain("bg-warning-container");
  });
});
