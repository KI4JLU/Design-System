import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog, SettingsRow } from "./settings-dialog";

const sections = [
  { value: "general", label: "Allgemein", keywords: ["Darstellung", "Sprache"], content: <SettingsRow label="Darstellung" control={<span>System</span>} /> },
  { value: "profile", label: "Profil", keywords: ["E-Mail"], content: <SettingsRow label="E-Mail" control={<span>a@b.de</span>} /> },
];

// Oracles: the section data handed in and WAI-ARIA roles as testing-library
// resolves them — nothing the component computes itself.
describe("SettingsDialog", () => {
  it("opens on the first section and switches from the nav", async () => {
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} />);
    expect(screen.getByRole("dialog", { name: "Einstellungen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Allgemein" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Profil" }));
    expect(screen.getByRole("heading", { level: 2, name: "Profil" })).toBeInTheDocument();
    expect(screen.getByText("a@b.de")).toBeInTheDocument();
  });

  it("filters sections by label and keywords, falling back to the first match", async () => {
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Einstellungen suchen" }), "mail");
    expect(screen.queryByRole("button", { name: "Allgemein" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Profil" })).toBeInTheDocument();

    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "xyz");
    expect(screen.getByText("Keine Treffer")).toBeInTheDocument();
  });

  it("closes from its close button", async () => {
    const onOpenChange = vi.fn();
    render(<SettingsDialog open onOpenChange={onOpenChange} sections={sections} />);
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders the footer under the section pane", () => {
    render(
      <SettingsDialog open onOpenChange={() => {}} sections={sections} footer={<button type="button">Speichern</button>} />,
    );
    expect(screen.getByRole("button", { name: "Speichern" }).closest("[data-slot='settings-dialog-footer']")).not.toBeNull();
  });

  // Oracle for the geometry: the rule written out by hand per case — the box
  // inset by 16px, at least 960px wide (window less 2×16px), centred on the
  // box and kept 16px inside the window.
  function renderFitted(box: { left: number; top: number; width: number; height: number }, viewportWidth: number, viewportHeight = 1000) {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: viewportWidth });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: viewportHeight });
    const area = document.createElement("div");
    area.getBoundingClientRect = () => box as DOMRect;
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} size="xl" fitTo={{ current: area }} />);
    const dialog = screen.getByRole("dialog");
    const v = (name: string) => dialog.style.getPropertyValue(`--settings-fit-${name}`);
    return { dialog, left: v("left"), top: v("top"), width: v("width"), height: v("height") };
  }

  it("size xl covers a wide fitTo box, 16px inside it", () => {
    const { dialog, left, top, width, height } = renderFitted({ left: 300, top: 0, width: 1200, height: 900 }, 1600);
    expect(dialog).toHaveAttribute("data-size", "xl");
    expect(dialog).toHaveAttribute("data-fitted");
    expect([left, top, width, height]).toEqual(["316px", "16px", "1168px", "868px"]);
    // Full screen below sm.
    expect(dialog.className.split(/\s+/)).toEqual(expect.arrayContaining(["h-dvh", "w-full"]));
  });

  it("outgrows a narrow fitTo box: 960px, centred on it", () => {
    // Box centre 1000 → left 1000 - 480 = 520, inside [16, 1600 - 960 - 16].
    const { left, width } = renderFitted({ left: 700, top: 0, width: 600, height: 900 }, 1600);
    expect([left, width]).toEqual(["520px", "960px"]);
  });

  it("keeps an outgrown dialog inside the window", () => {
    // Box centre 1100 → 620 would end at 1580 > 1440 - 16; clamped to 464.
    const { left, width } = renderFitted({ left: 800, top: 0, width: 600, height: 900 }, 1440);
    expect([left, width]).toEqual(["464px", "960px"]);
  });

  it("keeps a box larger than the window inside it, on all four sides", () => {
    // Box overhangs left/top and is wider and taller than the 1000×700 window.
    const { left, top, width, height } = renderFitted({ left: -50, top: -40, width: 1200, height: 900 }, 1000, 700);
    expect([left, top, width, height]).toEqual(["16px", "16px", "968px", "668px"]);
  });

  it("measures the box when it opens, not when it mounts closed", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1600 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    const area = document.createElement("div");
    let rect = { left: 300, top: 0, width: 1200, height: 900 };
    area.getBoundingClientRect = () => rect as DOMRect;
    const ref = { current: area };
    const { rerender } = render(
      <SettingsDialog open={false} onOpenChange={() => {}} sections={sections} size="xl" fitTo={ref} />,
    );
    // The page scrolled while the dialog was closed.
    rect = { left: 300, top: -200, width: 1200, height: 1100 };
    rerender(<SettingsDialog open onOpenChange={() => {}} sections={sections} size="xl" fitTo={ref} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.getPropertyValue("--settings-fit-top")).toBe("16px");
    expect(dialog.style.getPropertyValue("--settings-fit-height")).toBe("868px");
  });

  it("never grows wider than the window less its gutters", () => {
    const { left, width } = renderFitted({ left: 200, top: 0, width: 500, height: 700 }, 800);
    expect([left, width]).toEqual(["16px", "768px"]);
  });

  it("ignores fitTo at the default size", () => {
    render(
      <SettingsDialog open onOpenChange={() => {}} sections={sections} fitTo={{ current: document.createElement("div") }} />,
    );
    expect(screen.getByRole("dialog")).not.toHaveAttribute("data-fitted");
  });
});
