import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarFilterMenu, type SidebarFilter } from "./sidebar-filter-menu";

const filters: SidebarFilter[] = [
  { key: "activity", label: "Letzte Aktivität", value: "all", options: [{ value: "all", label: "Alle" }, { value: "week", label: "Diese Woche" }] },
  { key: "groupBy", label: "Gruppieren", value: "day", separatorBefore: true, options: [{ value: "day", label: "Tag" }, { value: "none", label: "Keine" }] },
];

/*
 * Oracle: the menu's contract — every filter is a row naming its current
 * value; choosing a value reports (key, value) and keeps the menu open; the
 * trigger's name says when a filter hides rows.
 */
describe("SidebarFilterMenu", () => {
  it("names each filter with its current value and reports a choice without closing", async () => {
    const onValueChange = vi.fn();
    render(<SidebarFilterMenu label="Filter" filters={filters} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));
    const row = await screen.findByRole("menuitem", { name: /^Letzte Aktivität/ });
    expect(row).toHaveTextContent("Alle");
    await userEvent.click(row);
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Diese Woche" }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("activity", "week");
    expect(screen.getByRole("menuitemradio", { name: "Alle" })).toHaveAttribute("aria-checked", "true");
  });

  it("offers a reset that is disabled at the defaults, and further actions", async () => {
    const onReset = vi.fn();
    const onCreate = vi.fn();
    render(
      <SidebarFilterMenu
        label="Filter" filters={filters} onValueChange={() => {}} resetLabel="Zurücksetzen" onReset={onReset} resetDisabled
        actions={[{ label: "Neuen Abschnitt erstellen", onSelect: onCreate }]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Filter" }));
    expect(await screen.findByRole("menuitem", { name: "Zurücksetzen" })).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(screen.getByRole("menuitem", { name: "Neuen Abschnitt erstellen" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onReset).not.toHaveBeenCalled();
  });

  // Oracle: the DS's selected fill (sidebar-card's active state, ghost aria-pressed).
  it("sets the trigger on the selected fill while a filter hides rows, and only then", () => {
    const { rerender } = render(<SidebarFilterMenu label="Filter" filters={filters} onValueChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Filter" })).not.toHaveClass("bg-primary/10");
    rerender(<SidebarFilterMenu label="Filter" activeLabel="Filter aktiv" active filters={filters} onValueChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Filter aktiv" })).toHaveClass("bg-primary/10", "text-primary");
  });

  it("names the trigger by activeLabel while a filter hides rows", () => {
    render(<SidebarFilterMenu label="Filter" activeLabel="Filter aktiv" active filters={filters} onValueChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Filter aktiv" })).toBeInTheDocument();
  });
});
