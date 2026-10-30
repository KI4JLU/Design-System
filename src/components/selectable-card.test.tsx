import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SelectableCard, SelectableCardGroup } from "./selectable-card";
import { CardTitle } from "./card";

/*
 * Oracle: the WAI-ARIA patterns the card claims — a radio group (one checked
 * radio, one tab stop, arrow keys move the check) inside a group, a toggle
 * button (`aria-pressed`) on its own — and the slot contract: the action is
 * outside the pick target.
 */
function Group({ onAction = () => {} }: { onAction?: () => void }) {
  const [value, setValue] = useState("a");
  return (
    <>
      <SelectableCardGroup aria-label="Rolle" value={value} onValueChange={setValue}>
        <SelectableCard value="a" action={<button type="button" onClick={onAction}>Menü A</button>}>
          <CardTitle>Tutor</CardTitle>
        </SelectableCard>
        <SelectableCard value="b"><CardTitle>Prüfer</CardTitle></SelectableCard>
        <SelectableCard value="c" disabled><CardTitle>Recherche</CardTitle></SelectableCard>
      </SelectableCardGroup>
      <output>{value}</output>
    </>
  );
}

describe("SelectableCard in a group", () => {
  it("renders the cards as radios of one named group", () => {
    render(<Group />);
    expect(screen.getByRole("radiogroup", { name: "Rolle" })).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
  });

  it("picks a card on click and moves the pick with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Group />);
    const [a, b] = screen.getAllByRole("radio");
    await user.click(b);
    expect(screen.getByRole("status")).toHaveTextContent("b");
    // Held, as a real key is while Radix moves the focus (it checks the radio
    // only while an arrow key is down; user-event would release it at once).
    await user.keyboard("{ArrowLeft>}");
    await waitFor(() => expect(a).toHaveFocus());
    await user.keyboard("{/ArrowLeft}");
    expect(screen.getByRole("status")).toHaveTextContent("a");
  });

  it("is one tab stop, followed by the card's action", async () => {
    const user = userEvent.setup();
    render(<Group />);
    await user.tab();
    expect(screen.getAllByRole("radio")[0]).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Menü A" })).toHaveFocus();
  });

  it("keeps the action outside the pick target", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Group onAction={onAction} />);
    await user.click(screen.getAllByRole("radio")[1]);
    const action = screen.getByRole("button", { name: "Menü A" });
    expect(screen.getAllByRole("radio")[0]).not.toContainElement(action);
    await user.click(action);
    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("b");
  });

  it("does not pick a disabled card", async () => {
    const user = userEvent.setup();
    render(<Group />);
    await user.click(screen.getAllByRole("radio")[2]);
    expect(screen.getByRole("status")).toHaveTextContent("a");
  });

  it("hands its accentColor to the Card parts", () => {
    render(
      <SelectableCardGroup aria-label="Thema">
        <SelectableCard value="x" accentColor="rgb(1, 2, 3)">X</SelectableCard>
      </SelectableCardGroup>,
    );
    expect(screen.getByRole("radio").style.getPropertyValue("--card-accent")).toBe("rgb(1, 2, 3)");
  });
});

describe("SelectableCard on its own", () => {
  it("is a toggle button that reports the new state", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(<SelectableCard selected={false} onSelectedChange={onSelectedChange}>Standard</SelectableCard>);
    const card = screen.getByRole("button", { name: "Standard" });
    expect(card).toHaveAttribute("aria-pressed", "false");
    expect(card).toHaveAttribute("type", "button");
    await user.click(card);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it("lets onClick cancel the toggle", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <SelectableCard selected onSelectedChange={onSelectedChange} onClick={(e) => e.preventDefault()}>
        Standard
      </SelectableCard>,
    );
    await user.click(screen.getByRole("button", { name: "Standard" }));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("renders no wrapper without an action", () => {
    const { container } = render(<SelectableCard>Karte</SelectableCard>);
    expect(container.firstElementChild).toHaveAttribute("data-slot", "selectable-card");
  });
});
