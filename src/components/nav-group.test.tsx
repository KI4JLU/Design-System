import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavGroup } from "./nav-group";
import { NavItem } from "./nav-item";
import { SidePanel } from "./side-panel";

/** The group where `AppShellLayout` puts its nav: the pane body while open,
 *  `collapsedPreview` (the rail) while collapsed. */
const inSidePanel = (collapsed: boolean, node: React.ReactNode) =>
  render(
    <SidePanel
      side="left"
      isOpen={!collapsed}
      width={256}
      onExpand={() => {}}
      onCollapse={() => {}}
      expandLabel="Navigation ausklappen"
      collapseLabel="Navigation einklappen"
      collapsedPreview={collapsed ? node : undefined}
    >
      {collapsed ? null : node}
    </SidePanel>,
  );

const group = (props: Partial<React.ComponentProps<typeof NavGroup>> = {}) => (
  <NavGroup title="Verwaltung" {...props}>
    <NavItem label="Komponenten" active>
      <svg aria-hidden />
      <span>Komponenten</span>
    </NavItem>
    <NavItem label="Nutzende">
      <svg aria-hidden />
      <span>Nutzende</span>
    </NavItem>
  </NavGroup>
);

describe("NavGroup", () => {
  it("is a group named by its heading", () => {
    render(group());
    const g = screen.getByRole("group", { name: "Verwaltung" });
    const heading = screen.getByRole("heading", { name: "Verwaltung" });
    expect(g).toHaveAttribute("aria-labelledby", heading.id);
    expect(g).toContainElement(screen.getByRole("button", { name: "Komponenten" }));
  });

  it("renders an h2 by default and follows headingLevel", () => {
    const { rerender } = render(group());
    expect(screen.getByRole("heading", { level: 2, name: "Verwaltung" })).toBeInTheDocument();
    rerender(group({ headingLevel: 3 }));
    expect(screen.getByRole("heading", { level: 3, name: "Verwaltung" })).toBeInTheDocument();
  });

  it("keeps two groups apart by their own ids", () => {
    render(
      <>
        {group()}
        <NavGroup title="Module">{null}</NavGroup>
      </>,
    );
    expect(screen.getByRole("group", { name: "Verwaltung" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Module" })).toBeInTheDocument();
  });

  it("shows the heading and no separator in an open SidePanel", () => {
    inSidePanel(false, group());
    const heading = screen.getByRole("heading", { name: "Verwaltung" });
    expect(heading).not.toHaveClass("sr-only");
    expect(heading).toHaveClass("m-0", "px-4");
    expect(document.querySelector("[data-slot=nav-group-separator]")).toBeNull();
  });

  it("in the collapsed rail: heading sr-only, still the group's name, separator shown", () => {
    inSidePanel(true, group());
    const heading = screen.getByRole("heading", { name: "Verwaltung" });
    expect(heading).toHaveClass("sr-only");
    expect(screen.getByRole("group", { name: "Verwaltung" })).toBeInTheDocument();
    const separator = document.querySelector("[data-slot=nav-group-separator]");
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });

  it("passes className through for layout", () => {
    render(group({ className: "mt-4" }));
    expect(screen.getByRole("group")).toHaveClass("mt-4", "flex");
  });
});
