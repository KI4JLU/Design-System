import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MenuItem } from "./menu-item";

describe("MenuItem", () => {
  it("renders a quiet default row", () => {
    render(<MenuItem>Offen</MenuItem>);
    expect(screen.getByRole("button", { name: "Offen" })).toHaveClass("text-on-surface");
  });

  it("marks selected rows with color and weight", () => {
    render(<MenuItem selected>Alle</MenuItem>);
    expect(screen.getByRole("button")).toHaveClass("text-primary", "font-medium");
  });

  it("shows the keyboard highlight surface", () => {
    render(<MenuItem highlighted>Beantwortet</MenuItem>);
    expect(screen.getByRole("button")).toHaveClass("bg-surface-container-low");
  });

  it("styles destructive actions with the error color", () => {
    render(<MenuItem variant="destructive">Abmelden</MenuItem>);
    expect(screen.getByRole("button")).toHaveClass("text-error");
  });

  it("renders the child element when asChild is set", () => {
    render(
      <MenuItem asChild>
        <a href="#x">Portal</a>
      </MenuItem>,
    );
    expect(screen.getByRole("link", { name: "Portal" })).toHaveClass("text-on-surface");
  });
});
