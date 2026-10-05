import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Prose } from "./prose";
import { proseVariants } from "./prose-variants";

describe("Prose", () => {
  it("renders a div with the default prose classes", () => {
    render(
      <Prose data-testid="prose">
        <p>Text</p>
      </Prose>,
    );
    const root = screen.getByTestId("prose");
    expect(root.tagName).toBe("DIV");
    expect(root).toHaveClass("text-body-base", "text-on-surface", "[&_ul]:list-disc");
  });

  it("switches the type scale with size", () => {
    render(<Prose size="compact" data-testid="prose" />);
    const root = screen.getByTestId("prose");
    expect(root).toHaveClass("text-sm", "[&_h1]:text-headline-md-mobile");
    expect(root).not.toHaveClass("text-body-base");
  });

  it("puts the classes on the child with asChild", () => {
    const { container } = render(
      <Prose asChild>
        <article aria-label="Zusammenfassung">
          <p>Text</p>
        </article>
      </Prose>,
    );
    const article = screen.getByRole("article", { name: "Zusammenfassung" });
    expect(article).toHaveClass("text-body-base");
    expect(container.firstElementChild).toBe(article);
  });

  it("lets layout classes through", () => {
    render(<Prose className="max-w-2xl" data-testid="prose" />);
    expect(screen.getByTestId("prose")).toHaveClass("max-w-2xl", "text-on-surface");
  });

  it("exports the class string for editors that own their root", () => {
    expect(proseVariants()).toContain("[&_blockquote]:border-s-4");
    expect(proseVariants({ size: "compact" })).toContain("text-sm");
  });
});
