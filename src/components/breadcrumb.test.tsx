import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Breadcrumb,
  BreadcrumbBack,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

// ORACLES: what assistive tech is given — landmark and link roles, accessible
// names (computed by testing-library from the DOM), aria-current — and the
// fixture's own strings and handlers. Nothing the component returns is fed
// back into an expectation.
describe("Breadcrumb", () => {
  it("is a named navigation landmark with an ordered trail and the current page", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/themen">Themen</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Tetris</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const nav = screen.getByRole("navigation", { name: "Navigationspfad" });
    expect(nav.querySelector("ol")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Themen" })).toHaveAttribute("href", "/themen");
    expect(screen.getByText("Tetris")).toHaveAttribute("aria-current", "page");
  });

  it("hides separators from assistive tech", () => {
    render(
      <BreadcrumbList>
        <BreadcrumbSeparator data-testid="sep" />
      </BreadcrumbList>,
    );
    expect(screen.getByTestId("sep")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("BreadcrumbEllipsis", () => {
  // ORACLE: aria-hidden hides a whole subtree from assistive tech; the label
  // must not sit inside one, only the icon may.
  it("keeps its screen-reader label exposed and hides only the icon", () => {
    render(<BreadcrumbEllipsis />);
    const label = screen.getByText("Weitere");
    expect(label.closest('[aria-hidden="true"]')).toBeNull();
    expect(document.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("BreadcrumbBack", () => {
  // A plain element ref per rendering mode compiles (tsc --noEmit covers this
  // file) and receives the element that was rendered.
  it("forwards a button ref, and an anchor ref with href", () => {
    const buttonRef = createRef<HTMLButtonElement>();
    const { unmount } = render(<BreadcrumbBack ref={buttonRef} trail={["Tetris"]} onClick={() => {}} />);
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    unmount();
    const anchorRef = createRef<HTMLAnchorElement>();
    render(<BreadcrumbBack ref={anchorRef} trail={["Themen"]} href="/themen" />);
    expect(anchorRef.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("is one button named 'Zurück zu' plus the trail", () => {
    render(<BreadcrumbBack trail={["Tetris", "Mitglieder"]} onClick={() => {}} />);
    expect(screen.getByRole("navigation", { name: "Navigationspfad" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zurück zu Tetris, Mitglieder" })).toBeInTheDocument();
  });

  it("calls onClick and does not submit an enclosing form", async () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <BreadcrumbBack trail={["Tetris", "Mitglieder"]} onClick={onClick} />
      </form>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders a link with href instead of a button", () => {
    render(<BreadcrumbBack trail={["Themen"]} href="/themen" />);
    expect(screen.getByRole("link", { name: "Zurück zu Themen" })).toHaveAttribute("href", "/themen");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("takes overridden labels", () => {
    render(<BreadcrumbBack trail={["Tetris"]} labels={{ nav: "Breadcrumb", back: "Back to" }} onClick={() => {}} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Tetris" })).toBeInTheDocument();
  });
});
