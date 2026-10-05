import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  it("renders the initials", () => {
    render(<Avatar initials="SK" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toHaveTextContent("SK");
  });

  it("announces online state to screen readers only when online", () => {
    const { rerender } = render(<Avatar initials="SK" data-testid="avatar" />);
    expect(screen.queryByText("online")).not.toBeInTheDocument();
    rerender(<Avatar initials="SK" online data-testid="avatar" />);
    expect(screen.getByText("online")).toHaveClass("sr-only");
  });

  it("onlineLabel overrides the sr-only presence text", () => {
    render(<Avatar initials="SK" online onlineLabel="active now" />);
    expect(screen.getByText("active now")).toHaveClass("sr-only");
    expect(screen.queryByText("online")).not.toBeInTheDocument();
  });

  it("applies the requested size", () => {
    render(<Avatar initials="SK" size="lg" data-testid="avatar" />);
    const circle = screen.getByTestId("avatar").firstElementChild;
    expect(circle).toHaveClass("h-12", "w-12");
  });

  it("passes an accessible name through", () => {
    render(<Avatar initials="SK" aria-label="Steffen Karcher" />);
    expect(screen.getByLabelText("Steffen Karcher")).toBeInTheDocument();
  });
});

describe("Avatar picture", () => {
  const circle = () => screen.getByTestId("avatar").firstElementChild as HTMLElement;
  const img = () => screen.getByTestId("avatar").querySelector("img");

  it("keeps the initials until the picture has loaded, then shows only the picture", () => {
    render(<Avatar initials="SK" src="/a.png" data-testid="avatar" />);
    expect(img()).toHaveAttribute("src", "/a.png");
    expect(img()).toHaveClass("opacity-0");
    expect(circle()).toHaveTextContent("SK");
    fireEvent.load(img()!);
    expect(img()).not.toHaveClass("opacity-0");
    expect(circle()).not.toHaveTextContent("SK");
  });

  it("falls back to the initials when the picture fails", () => {
    render(<Avatar initials="SK" src="/broken.png" data-testid="avatar" />);
    fireEvent.error(img()!);
    expect(img()).toBeNull();
    expect(circle()).toHaveTextContent("SK");
  });

  it("tries again when src changes after a failure", () => {
    const { rerender } = render(<Avatar initials="SK" src="/broken.png" data-testid="avatar" />);
    fireEvent.error(img()!);
    rerender(<Avatar initials="SK" src="/b.png" data-testid="avatar" />);
    expect(img()).toHaveAttribute("src", "/b.png");
  });

  it("keeps the picture out of the accessibility tree; the name stays the avatar's", () => {
    render(<Avatar initials="SK" src="/a.png" aria-label="Steffen Karcher" data-testid="avatar" />);
    expect(screen.getByRole("img", { name: "Steffen Karcher" })).toBe(screen.getByTestId("avatar"));
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(img()).toHaveAttribute("alt", "");
  });

  it("uses alt as the accessible name; aria-label wins", () => {
    const { rerender } = render(<Avatar initials="SK" alt="Steffen Karcher" />);
    expect(screen.getByRole("img", { name: "Steffen Karcher" })).toBeInTheDocument();
    rerender(<Avatar initials="SK" alt="Steffen Karcher" aria-label="Sprecher 1" />);
    expect(screen.getByRole("img", { name: "Sprecher 1" })).toBeInTheDocument();
  });

  it("stays unnamed without aria-label or alt", () => {
    render(<Avatar initials="SK" src="/a.png" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("Avatar color", () => {
  it("paints the inner circle and switches to the theme-invariant ink", () => {
    render(<Avatar initials="S1" color="var(--color-category-3)" data-testid="avatar" />);
    const circle = screen.getByTestId("avatar").firstElementChild as HTMLElement;
    expect(circle.style.backgroundColor).toBe("var(--color-category-3)");
    expect(circle).toHaveClass("text-on-secondary-fixed");
    expect(circle).not.toHaveClass("bg-primary-container");
  });

  it("keeps primary-container without color", () => {
    render(<Avatar initials="SK" data-testid="avatar" />);
    const circle = screen.getByTestId("avatar").firstElementChild as HTMLElement;
    expect(circle).toHaveClass("bg-primary-container", "text-on-primary-container");
    expect(circle.getAttribute("style")).toBeNull();
  });
});
