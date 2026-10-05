import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import {
  Fieldset,
  FieldsetDescription,
  FieldsetLegend,
  FieldsetMessage,
} from "./fieldset";

describe("Fieldset", () => {
  it("names the group by its legend and describes it", () => {
    render(
      <Fieldset>
        <FieldsetLegend>Exportformate</FieldsetLegend>
        <FieldsetDescription>Mindestens ein Format wählen.</FieldsetDescription>
        <Checkbox id="srt" aria-label="SRT" />
      </Fieldset>,
    );
    const group = screen.getByRole("group", { name: "Exportformate" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group).toHaveAccessibleDescription("Mindestens ein Format wählen.");
    expect(group).not.toHaveAttribute("aria-invalid");
  });

  it("wires the error to aria-invalid, the message and the legend colour", () => {
    render(
      <Fieldset error>
        <FieldsetLegend>Modelle</FieldsetLegend>
        <FieldsetDescription>Eines pro Zeile.</FieldsetDescription>
        <FieldsetMessage>Mindestens ein Modell angeben.</FieldsetMessage>
      </Fieldset>,
    );
    const group = screen.getByRole("group", { name: "Modelle" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription(
      "Eines pro Zeile. Mindestens ein Modell angeben.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Mindestens ein Modell angeben.");
    expect(screen.getByText("Modelle")).toHaveClass("text-error");
  });

  it("points aria-describedby only at parts that are rendered", () => {
    const { rerender } = render(
      <Fieldset aria-describedby="extern">
        <FieldsetLegend>Modelle</FieldsetLegend>
        <FieldsetMessage />
      </Fieldset>,
    );
    const group = screen.getByRole("group", { name: "Modelle" });
    expect(group).toHaveAttribute("aria-describedby", "extern");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(
      <Fieldset aria-describedby="extern" error>
        <FieldsetLegend>Modelle</FieldsetLegend>
        <FieldsetMessage>Fehlt.</FieldsetMessage>
      </Fieldset>,
    );
    const message = screen.getByRole("alert");
    expect(group.getAttribute("aria-describedby")).toBe(`extern ${message.id}`);
  });

  it("keeps the legend's default id unless one is passed", () => {
    render(
      <>
        <Fieldset>
          <FieldsetLegend>Automatisch</FieldsetLegend>
        </Fieldset>
        <Fieldset>
          <FieldsetLegend id="eigene-id">Eigene</FieldsetLegend>
        </Fieldset>
      </>,
    );
    expect(screen.getByText("Automatisch").id).toMatch(/-legend$/);
    expect(screen.getByText("Eigene")).toHaveAttribute("id", "eigene-id");
  });

  it("disables the native controls inside when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Fieldset disabled>
        <FieldsetLegend>Modell</FieldsetLegend>
        <Label htmlFor="model-id">Modell-ID</Label>
        <Input id="model-id" />
        <Checkbox aria-label="Standard" />
      </Fieldset>,
    );
    const input = screen.getByLabelText("Modell-ID");
    expect(input).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Standard" })).toBeDisabled();
    await user.type(input, "gpt");
    expect(input).toHaveValue("");
  });

  it("throws when a part is used outside a Fieldset", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<FieldsetLegend>Allein</FieldsetLegend>)).toThrow(
      "<FieldsetLegend> must be used within <Fieldset>",
    );
    spy.mockRestore();
  });
});
