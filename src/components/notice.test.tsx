import { describe, expect, it } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { Info } from "lucide-react";
import { Notice } from "./notice";

/**
 * ORACLE — the deprecation note in notice.tsx: `Notice` renders an `Alert`
 * with the same tone, no role of its own, and no icon unless one is given
 * (Alert would otherwise add its tone icon). The tone → token pairs are
 * `alertVariants`', tested in alert.test.tsx.
 */
describe("Notice (deprecated wrapper over Alert)", () => {
  it("renders its children with no role of its own", () => {
    render(<Notice>Eigentümer und Admin haben immer alle Rechte.</Notice>);
    const box = screen
      .getByText("Eigentümer und Admin haben immer alle Rechte.")
      .closest('[data-slot="notice"]') as HTMLElement;
    expect(box).not.toBeNull();
    expect(box).not.toHaveAttribute("role");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([
    ["neutral", "bg-surface-container-high"],
    ["info", "bg-info-container"],
    ["warning", "bg-warning-container"],
  ] as const)("tone=%s takes Alert's %s surface", (tone, bg) => {
    render(<Notice tone={tone}>x</Notice>);
    const box = screen.getByText("x").closest('[data-slot="notice"]') as HTMLElement;
    expect(box).toHaveAttribute("data-tone", tone);
    expect(box).toHaveClass(bg);
  });

  it("shows no icon unless one is given, even on a status tone", () => {
    const { container } = render(<Notice tone="warning">Hinweis</Notice>);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("shows the given icon, hidden from assistive technology", () => {
    const { container } = render(<Notice icon={<Info data-testid="i" />}>Hinweis</Notice>);
    const icon = screen.getByTestId("i");
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("keeps text and an inline link in one block", () => {
    render(
      <Notice>
        Lies erst die <a href="/hilfe">Anleitung</a>.
      </Notice>,
    );
    const link = screen.getByRole("link", { name: "Anleitung" });
    // Its parent is one block holding the whole sentence, not Alert's
    // flex column (where text and link would stack as separate items).
    expect(link.parentElement).toHaveTextContent("Lies erst die Anleitung.");
    expect(link.parentElement).not.toHaveClass("flex-col");
  });

  it("forwards ref, role and other props to the box", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Notice ref={ref} role="status" id="n1" className="mt-4">
        Gespeichert
      </Notice>,
    );
    const box = screen.getByRole("status");
    expect(box).toBe(ref.current);
    expect(box).toHaveAttribute("id", "n1");
    expect(box).toHaveClass("mt-4");
  });
});
