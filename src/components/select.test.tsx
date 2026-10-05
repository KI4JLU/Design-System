import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const renderSelect = (onValueChange = vi.fn()) => {
  render(
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Modell">
        <SelectValue placeholder="Modell wählen…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="haiku">Claude Haiku</SelectItem>
        <SelectItem value="sonnet">Claude Sonnet</SelectItem>
        <SelectItem value="opus" disabled>
          Claude Opus
        </SelectItem>
      </SelectContent>
    </Select>,
  );
  return onValueChange;
};

describe("Select", () => {
  it("exposes combobox semantics on the trigger", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Modell" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with the keyboard and lists the options", async () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Modell" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("selects an option and reports the value", async () => {
    const onValueChange = renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Modell" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(await screen.findByRole("option", { name: "Claude Sonnet" }));
    expect(onValueChange).toHaveBeenCalledWith("sonnet");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent("Claude Sonnet");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Modell" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("marks disabled options", async () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Modell" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const disabled = await screen.findByRole("option", { name: "Claude Opus" });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps the default trigger size and applies size=\"sm\"", () => {
    render(
      <>
        <Select>
          <SelectTrigger aria-label="Standard">
            <SelectValue />
          </SelectTrigger>
        </Select>
        <Select>
          <SelectTrigger aria-label="Kompakt" size="sm">
            <SelectValue />
          </SelectTrigger>
        </Select>
      </>,
    );
    const standard = screen.getByRole("combobox", { name: "Standard" });
    expect(standard).toHaveClass("px-4", "py-3");
    expect(standard).not.toHaveClass("h-8");

    const compact = screen.getByRole("combobox", { name: "Kompakt" });
    expect(compact).toHaveClass("h-8", "px-3", "py-0", "text-xs");
    expect(compact).not.toHaveClass("px-4");
    expect(compact).not.toHaveClass("py-3");
  });
});
