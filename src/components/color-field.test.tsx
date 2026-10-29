import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorField } from "./color-field";
import { normalizeHex } from "../lib/hex-color";

// Oracle: CSS Color 4 hex notation — six hex digits, case-insensitive; the
// field always reports `#RRGGBB`.
describe("normalizeHex", () => {
  it("accepts six digits with or without #, in any case", () => {
    expect(normalizeHex("#0056b3")).toBe("#0056B3");
    expect(normalizeHex("b46ef7")).toBe("#B46EF7");
  });
  it("rejects short, long and non-hex values", () => {
    for (const v of ["#fff", "#0056b", "#0056b3a", "red", "#gg0000"]) expect(normalizeHex(v)).toBeNull();
  });
});

describe("ColorField", () => {
  it("commits a complete hex typed in place and snaps an incomplete one back on blur", async () => {
    const onChange = vi.fn();
    render(<ColorField label="Startfarbe" value="#0056B3" onChange={onChange} />);
    const hex = screen.getByRole("textbox", { name: "Startfarbe (Hex)" });
    await userEvent.clear(hex);
    await userEvent.type(hex, "#b46e");
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.type(hex, "f7");
    expect(onChange).toHaveBeenLastCalledWith("#B46EF7");
    onChange.mockClear();
    await userEvent.clear(hex);
    await userEvent.type(hex, "12");
    await userEvent.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(hex).toHaveValue("#0056B3");
  });

  it("names the swatch's colour picker with the label", () => {
    render(<ColorField label="Endfarbe" value="#3897E8" onChange={() => undefined} />);
    expect(screen.getByLabelText("Endfarbe")).toHaveAttribute("type", "color");
  });
});
