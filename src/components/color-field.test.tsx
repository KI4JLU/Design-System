import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorField } from "./color-field";
import { CATEGORY_PALETTE, COLOR_PRESETS } from "../lib/category-color";
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

// Oracle: tokens.css — the brand blue (--p-blue-700) and the category palette.
describe("COLOR_PRESETS", () => {
  it("are the brand blue and the category hues", () => {
    expect(COLOR_PRESETS).toEqual(["#0056B3", ...CATEGORY_PALETTE.map((c) => c.toUpperCase())]);
  });
});

describe("ColorField", () => {
  it("picks a system colour from the grid and closes it", async () => {
    const onChange = vi.fn();
    render(<ColorField label="Farbe" value="#0056B3" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Farbe: #0056B3" }));
    const grid = screen.getByRole("group", { name: "Systemfarben" });
    expect(screen.getByRole("button", { name: "#0056B3" })).toHaveAttribute("aria-pressed", "true");
    expect(grid.querySelectorAll("button")).toHaveLength(COLOR_PRESETS.length);
    await userEvent.click(screen.getByRole("button", { name: "#EE4589" }));
    expect(onChange).toHaveBeenCalledWith("#EE4589");
    expect(screen.queryByRole("group", { name: "Systemfarben" })).not.toBeInTheDocument();
  });

  it("opens the browser picker only from Eigene Farbe, and marks a colour outside the grid as custom", async () => {
    const onChange = vi.fn();
    const { container } = render(<ColorField label="Farbe" value="#123456" onChange={onChange} />);
    const native = container.querySelector<HTMLInputElement>('input[type="color"]')!;
    // Not a control of its own: no tab stop, hidden from assistive tech.
    expect(native).toHaveAttribute("tabindex", "-1");
    expect(native).toHaveAttribute("aria-hidden", "true");
    const showPicker = vi.fn();
    native.showPicker = showPicker;
    await userEvent.click(screen.getByRole("button", { name: "Farbe: #123456" }));
    expect(screen.queryByRole("button", { pressed: true, name: /^#/ })).not.toBeInTheDocument();
    const custom = screen.getByRole("button", { name: "Eigene Farbe…" });
    expect(custom).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(custom);
    expect(showPicker).toHaveBeenCalledOnce();
    expect(screen.queryByRole("group", { name: "Systemfarben" })).not.toBeInTheDocument();
  });

  it("reports a colour from the browser's picker as #RRGGBB", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorField label="Farbe" value="#0056B3" onChange={onChange} />);
    const native = container.querySelector<HTMLInputElement>('input[type="color"]')!;
    fireEvent.input(native, { target: { value: "#b46ef7" } });
    expect(onChange).toHaveBeenLastCalledWith("#B46EF7");
  });

  it("takes its own presets and labels", async () => {
    render(<ColorField label="Color" value="#000000" onChange={() => undefined} presets={["#000000", "#ffffff"]} labels={{ custom: "Custom…", presets: "Palette" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Color: #000000" }));
    expect(screen.getByRole("group", { name: "Palette" }).querySelectorAll("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "#FFFFFF" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Custom…" })).toHaveAttribute("aria-pressed", "false");
  });
});
