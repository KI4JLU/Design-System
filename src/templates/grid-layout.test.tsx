import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GridLayout } from "./grid-layout";

/* What GridLayout decides on its own — everything else (columns, gaps, the
   toolbar's edges) is layout and measured in Chromium by its stories. */

const grids = (container: HTMLElement) => container.querySelectorAll("[data-slot='grid-layout-grid']");

describe("GridLayout", () => {
  it("is one named region", () => {
    render(<GridLayout label="Mein Wissen" items={["a"]} />);
    expect(screen.getByRole("region", { name: "Mein Wissen" })).toBeInTheDocument();
  });

  it("leaves out groups without cells, and drops the headings when one group is left", () => {
    const { container } = render(
      <GridLayout
        label="Mein Wissen"
        groups={[
          { id: "favorites", label: "Favoriten", items: [] },
          { id: "rest", label: "Weitere Themen", items: ["a", "b"] },
        ]}
      />,
    );
    expect(grids(container)).toHaveLength(1);
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("shows the empty state instead of the grid when there is no cell at all", () => {
    const { container } = render(
      <GridLayout label="Mein Wissen" items={[]} listHeader="Spalten" view="list" emptyState="Noch nichts" />,
    );
    expect(screen.getByText("Noch nichts")).toBeInTheDocument();
    expect(grids(container)).toHaveLength(0);
    expect(screen.queryByText("Spalten")).toBeNull();
  });

  it("does not show the empty state while there are cells", () => {
    render(<GridLayout label="Mein Wissen" items={["a"]} emptyState="Noch nichts" />);
    expect(screen.queryByText("Noch nichts")).toBeNull();
  });

  it("shows the list header in the list view only", () => {
    const { rerender } = render(<GridLayout label="Mein Wissen" items={["a"]} listHeader="Spalten" />);
    expect(screen.queryByText("Spalten")).toBeNull();
    rerender(<GridLayout label="Mein Wissen" items={["a"]} listHeader="Spalten" view="list" />);
    expect(screen.getByText("Spalten")).toBeInTheDocument();
  });

  it("hands each shown group's grid to renderGroup, with the group", () => {
    const renderGroup = vi.fn((grid: React.ReactElement, group: { id: string }) => (
      <div data-wrapped={group.id}>{grid}</div>
    ));
    const { container } = render(
      <GridLayout
        label="Mein Wissen"
        renderGroup={renderGroup}
        groups={[
          { id: "favorites", label: "Favoriten", items: ["a"] },
          { id: "empty", label: "Leer", items: [] },
          { id: "rest", label: "Weitere Themen", items: ["b"] },
        ]}
      />,
    );
    expect(renderGroup.mock.calls.map(([, group]) => group.id)).toEqual(["favorites", "rest"]);
    expect(container.querySelectorAll("[data-wrapped] > [data-slot='grid-layout-grid']")).toHaveLength(2);
  });

  it("calls a page without groups the group \"items\"", () => {
    const renderGroup = vi.fn<(grid: React.ReactElement, group: { id: string }) => React.ReactNode>((grid) => grid);
    render(<GridLayout label="Mein Wissen" items={["a"]} renderGroup={renderGroup} />);
    expect(renderGroup.mock.calls[0][1]).toEqual(expect.objectContaining({ id: "items" }));
  });

  it("renders no toolbar row without filters or actions", () => {
    const { container, rerender } = render(<GridLayout label="Mein Wissen" items={["a"]} />);
    expect(container.querySelector("[data-slot='grid-layout-toolbar']")).toBeNull();
    rerender(<GridLayout label="Mein Wissen" items={["a"]} toolbarActions={<button type="button">Neu</button>} />);
    expect(container.querySelector("[data-slot='grid-layout-toolbar']")).not.toBeNull();
  });

  it("counts only cells that render: a group of null or false cells is empty", () => {
    const { container } = render(
      <GridLayout
        label="Mein Wissen"
        groups={[
          { id: "favorites", label: "Favoriten", items: [null, false] },
          { id: "rest", label: "Weitere Themen", items: ["a"] },
        ]}
        emptyState="Noch nichts"
      />,
    );
    expect(grids(container)).toHaveLength(1);
    expect(screen.queryByRole("heading")).toBeNull();
    render(<GridLayout label="Leer" items={[null, undefined, false]} emptyState="Leer hier" />);
    expect(screen.getByText("Leer hier")).toBeInTheDocument();
    render(<GridLayout label="Null" items={[0]} emptyState="Nicht leer" />);
    expect(screen.queryByText("Nicht leer")).toBeNull();
  });

  it("keeps a group's cells mounted when the other group empties", () => {
    const groups = (favorites: string[]) => [
      { id: "favorites", label: "Favoriten", items: favorites.map((t) => <span key={t}>{t}</span>) },
      { id: "rest", label: "Weitere Themen", items: [<input key="field" aria-label="Notiz" />] },
    ];
    const { rerender } = render(<GridLayout label="Mein Wissen" groups={groups(["a"])} />);
    const field = screen.getByRole("textbox", { name: "Notiz" });
    rerender(<GridLayout label="Mein Wissen" groups={groups([])} />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Notiz" })).toBe(field);
  });
});
