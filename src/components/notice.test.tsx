import { describe, expect, it } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { Info } from "lucide-react";
import { Notice } from "./notice";

/**
 * ORACLE — the props handed in and the `Notice` contract in notice.tsx's
 * JSDoc: tone → the documented token pair (`noticeVariants`), the icon slot is
 * hidden from assistive technology, and the box mints no role or live region
 * of its own (Testing Library's role resolution, i.e. aria-query, decides
 * that — nothing in notice.tsx names a role). Rendered colours in both themes
 * are Storybook's / Chromatic's to show.
 */
describe("Notice", () => {
  it("renders its children as text and has no role of its own", () => {
    render(<Notice>Eigentümer und Admin haben immer alle Rechte.</Notice>);
    const text = screen.getByText("Eigentümer und Admin haben immer alle Rechte.");
    const box = text.closest('[data-slot="notice"]') as HTMLElement;
    expect(box).not.toBeNull();
    expect(box).not.toHaveAttribute("role");
    expect(box).not.toHaveAttribute("aria-live");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("defaults to the neutral tone", () => {
    render(<Notice>x</Notice>);
    const box = screen.getByText("x").closest('[data-slot="notice"]') as HTMLElement;
    expect(box).toHaveAttribute("data-tone", "neutral");
    expect(box).toHaveClass("bg-surface-container", "text-on-surface");
  });

  it.each([
    ["info", "bg-info-container", "text-on-info-container"],
    ["warning", "bg-warning-container", "text-on-warning-container"],
  ] as const)("tone=%s uses its status container pair", (tone, bg, fg) => {
    render(<Notice tone={tone}>x</Notice>);
    const box = screen.getByText("x").closest('[data-slot="notice"]') as HTMLElement;
    expect(box).toHaveAttribute("data-tone", tone);
    expect(box).toHaveClass(bg, fg);
    expect(box).not.toHaveClass("bg-surface-container");
  });

  it("puts the icon in a leading slot hidden from assistive technology", () => {
    const { container } = render(<Notice icon={<Info />}>Hinweis</Notice>);
    const slot = container.querySelector('[data-slot="notice-icon"]') as HTMLElement;
    expect(slot).toHaveAttribute("aria-hidden", "true");
    expect(slot.querySelector("svg")).not.toBeNull();
    // Leading: the icon slot comes before the text in the DOM.
    const box = container.querySelector('[data-slot="notice"]') as HTMLElement;
    expect(box.firstElementChild).toBe(slot);
  });

  it("renders no icon slot without an icon", () => {
    const { container } = render(<Notice>Hinweis</Notice>);
    expect(container.querySelector('[data-slot="notice-icon"]')).toBeNull();
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
    expect(box).toHaveTextContent("Gespeichert");
  });
});
