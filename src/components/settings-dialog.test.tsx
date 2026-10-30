import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { useSettingsSearch } from "./settings-search-context";
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
    // The open section's rows hold no „mail": once that settles, it drops out for the first match.
    await waitFor(() => expect(screen.queryByRole("button", { name: "Allgemein" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { level: 2, name: "Profil" })).toBeInTheDocument();

    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "xyz");
    expect(await screen.findByText("Keine Treffer")).toBeInTheDocument();
  });

  // Oracle: the section data handed in. A controlled caller (value + onValueChange) must hear that the search moved the
  // dialog to another section, or it keeps loading and labelling the one that is gone.
  it("calls onValueChange when a search drops the open section and shows the first match", async () => {
    const onValueChange = vi.fn();
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} value="general" onValueChange={onValueChange} />);
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole("searchbox", { name: "Einstellungen suchen" }), "mail");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("profile"));
  });

  // Oracle: the rows' own text as handed in. Search marks rows on the DOM; tokens.css hides the misses
  // while `data-filtering` is set (jsdom applies no stylesheet, so the attributes are what is checked).
  describe("row search", () => {
    const rowSections = [
      {
        value: "models",
        label: "KI-Modelle",
        keywords: ["Fast-Tier"],
        content: (
          <>
            <h3>Modelle pro Aufgabe</h3>
            <SettingsRow label="CRAG: Grader-Modell" description="Leer = Standard-Chat-Modell" />
            <SettingsRow label="Globaler Fast-Tier-Default" description="Deployment-weiter Default" />
          </>
        ),
      },
      { value: "fast", label: "Fast-Tier", content: <SettingsRow label="Anderes" /> },
    ];
    const row = (label: string) => screen.getByText(label).closest("[data-slot='settings-row']")!;
    const scroller = () => document.querySelector("[data-slot='settings-dialog-content']")!;

    it("marks the rows without the query and filters the section", async () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={rowSections} />);
      await userEvent.type(screen.getByRole("searchbox"), "fast-tier");
      expect(row("Globaler Fast-Tier-Default")).not.toHaveAttribute("data-search-miss");
      expect(row("CRAG: Grader-Modell")).toHaveAttribute("data-search-miss");
      expect(scroller()).toHaveAttribute("data-filtering");
    });

    it("matches descriptions too", async () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={rowSections} />);
      await userEvent.type(screen.getByRole("searchbox"), "standard-chat");
      expect(row("CRAG: Grader-Modell")).not.toHaveAttribute("data-search-miss");
      expect(row("Globaler Fast-Tier-Default")).toHaveAttribute("data-search-miss");
    });

    // Content that renders a part only for the search (a closed group opened from an effect) gets its rows
    // after the dialog's first pass: the open section must not count as a miss before they are there.
    it("keeps the open section while rows opened for the search mount", async () => {
      function LateGroup() {
        const { filtering } = useSettingsSearch();
        const [open, setOpen] = React.useState(false);
        React.useEffect(() => setOpen(filtering), [filtering]);
        return open ? <SettingsRow label="Spät geladen" description="nur im Beitrag" /> : <p>zu</p>;
      }
      render(<SettingsDialog open onOpenChange={() => {}} sections={[{ value: "late", label: "Später", content: <LateGroup /> }, ...sections]} />);
      await userEvent.type(screen.getByRole("searchbox"), "beitrag");
      expect(await screen.findByText("Spät geladen")).toBeInTheDocument();
      await new Promise((r) => setTimeout(r, 500));
      expect(screen.getByRole("heading", { level: 2, name: "Später" })).toBeInTheDocument();
      expect(screen.queryByText("Keine Treffer")).not.toBeInTheDocument();
    });

    it("looks at the rows afresh when a search is repeated", async () => {
      const one = (rows: React.ReactNode) => [{ value: "only", label: "Einzig", content: rows }];
      const { rerender } = render(<SettingsDialog open onOpenChange={() => {}} sections={one(<SettingsRow label="Alpha" />)} />);
      await userEvent.type(screen.getByRole("searchbox"), "zebra");
      expect(await screen.findByText("Keine Treffer")).toBeInTheDocument();
      await userEvent.clear(screen.getByRole("searchbox"));
      rerender(<SettingsDialog open onOpenChange={() => {}} sections={one(<SettingsRow label="Zebra" />)} />);
      await userEvent.type(screen.getByRole("searchbox"), "zebra");
      await new Promise((r) => setTimeout(r, 500));
      expect(screen.getByRole("heading", { level: 2, name: "Einzig" })).toBeInTheDocument();
    });

    it("keeps a section whole when the query names it, or no row matches", async () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={rowSections} value="fast" />);
      await userEvent.type(screen.getByRole("searchbox"), "fast-tier");
      expect(scroller()).not.toHaveAttribute("data-filtering");
    });

    it("clears the marks with the query", async () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={rowSections} />);
      await userEvent.type(screen.getByRole("searchbox"), "fast-tier");
      await userEvent.clear(screen.getByRole("searchbox"));
      expect(row("CRAG: Grader-Modell")).not.toHaveAttribute("data-search-miss");
      expect(scroller()).not.toHaveAttribute("data-filtering");
    });

    it("highlights every hit through the CSS Custom Highlight API", async () => {
      const set = vi.fn();
      const highlights = { set, delete: vi.fn() };
      vi.stubGlobal("CSS", { highlights });
      vi.stubGlobal("Highlight", class { ranges: Range[]; constructor(...r: Range[]) { this.ranges = r; } });
      try {
        render(<SettingsDialog open onOpenChange={() => {}} sections={rowSections} />);
        await userEvent.type(screen.getByRole("searchbox"), "modell");
        const last = set.mock.calls.at(-1)!;
        expect(last[0]).toBe("settings-search");
        // Every occurrence in the section, rows or not: „Modelle pro Aufgabe", „Grader-Modell",
        // „Standard-Chat-Modell" (the heading is highlighted too, though it is no row).
        expect((last[1] as { ranges: Range[] }).ranges.map((r) => r.toString())).toEqual(["Modell", "Modell", "Modell"]);
      } finally {
        vi.unstubAllGlobals();
      }
    });
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

  // Oracle: the `group` values handed in, and WAI-ARIA's group role.
  describe("groups", () => {
    const grouped = [
      { value: "a", label: "Alpha", group: "Wissensbasen", keywords: ["eins"], content: <p>A</p> },
      { value: "b", label: "Beta", group: "Wissensbasen", keywords: ["zwei"], content: <p>B</p> },
      { value: "c", label: "Gamma", group: "System", keywords: ["drei"], content: <p>C</p> },
      { value: "d", label: "Delta", content: <p>D</p> },
    ];

    it("puts one heading over each run of sections with the same group", () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={grouped} />);
      const kbs = screen.getByRole("group", { name: "Wissensbasen" });
      expect(within(kbs).getAllByRole("button").map((b) => b.textContent)).toEqual(["Alpha", "Beta"]);
      const system = screen.getByRole("group", { name: "System" });
      expect(within(system).getAllByRole("button").map((b) => b.textContent)).toEqual(["Gamma"]);
      // The ungrouped section sits loose: in no group.
      expect(screen.getAllByRole("group")).toHaveLength(2);
      expect(screen.getByRole("button", { name: "Delta" }).closest("[role='group']")).toBeNull();
    });

    it("renders no group markup when no section has a group", () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={sections} />);
      expect(screen.queryAllByRole("group")).toHaveLength(0);
    });

    it("drops the heading of a group the search no longer matches", async () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={grouped} />);
      await userEvent.type(screen.getByRole("searchbox", { name: "Einstellungen suchen" }), "drei");
      await waitFor(() => expect(screen.queryByRole("group", { name: "Wissensbasen" })).not.toBeInTheDocument());
      expect(screen.getByRole("group", { name: "System" })).toBeInTheDocument();
    });

    it("repeats the heading when a group's sections are not adjacent", () => {
      const split = [grouped[0], grouped[2], grouped[1]];
      render(<SettingsDialog open onOpenChange={() => {}} sections={split} />);
      expect(screen.getAllByRole("group", { name: "Wissensbasen" })).toHaveLength(2);
    });

    // Oracle: the dialog's `title` prop, which names the dialog and is shown nowhere.
    it("shows no title in the column when there are groups, but still names the dialog", () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={grouped} title="Admin-Einstellungen" />);
      expect(screen.getByRole("dialog", { name: "Admin-Einstellungen" })).toBeInTheDocument();
      // Only the screen-reader title: no visible label over the search or the groups.
      const nodes = screen.getAllByText("Admin-Einstellungen");
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toHaveClass("sr-only");
    });

    it("keeps the grey list label (and a hidden dialog title) without groups", () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={sections} title="Admin-Einstellungen" />);
      // The visible label and the screen-reader title: two nodes, as before groups existed.
      expect(screen.getAllByText("Admin-Einstellungen")).toHaveLength(2);
    });

    it("still switches sections from inside a group", async () => {
      render(<SettingsDialog open onOpenChange={() => {}} sections={grouped} />);
      await userEvent.click(screen.getByRole("button", { name: "Gamma" }));
      expect(screen.getByRole("heading", { level: 2, name: "Gamma" })).toBeInTheDocument();
    });
  });

  // Oracle: useScrollFade's contract (fade only where there is more to scroll to),
  // with the scroll metrics jsdom lacks supplied by hand.
  it("fades the content at the top once it has scrolled, and at the bottom while more follows", () => {
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} />);
    const content = document.querySelector<HTMLElement>('[data-slot="settings-dialog-content"]')!;
    const metrics = (scrollTop: number) => {
      Object.defineProperty(content, "scrollTop", { configurable: true, value: scrollTop });
      Object.defineProperty(content, "clientHeight", { configurable: true, value: 100 });
      Object.defineProperty(content, "scrollHeight", { configurable: true, value: 300 });
      content.dispatchEvent(new Event("scroll"));
    };
    metrics(0);
    expect(content.dataset.scrollFade).toBe("bottom");
    metrics(80);
    expect(content.dataset.scrollFade).toBe("top bottom");
    metrics(200);
    expect(content.dataset.scrollFade).toBe("top");
  });

  // Oracle: the developer's report of 2026-10-26 — switching sections kept the last section's
  // scroll position. jsdom has no layout, so the scroll box is given a `scrollTop` that remembers it.
  it("scrolls the content back to the top when another section is chosen", async () => {
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} />);
    const content = document.querySelector<HTMLElement>('[data-slot="settings-dialog-content"]')!;
    let scrollTop = 120;
    Object.defineProperty(content, "scrollTop", { configurable: true, get: () => scrollTop, set: (v: number) => { scrollTop = v; } });
    await userEvent.click(screen.getByRole("button", { name: "Profil" }));
    expect(scrollTop).toBe(0);
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

  // A page loaded with the dialog already open (a deep link) mounts the dialog in the same commit as the
  // element its `fitTo` ref points at — an ancestor, whose ref React attaches only after the dialog's own
  // layout effects ran. It must still fit to that box, not fall back to the unfitted xl window.
  it("fits to a fitTo ancestor mounted in the same commit", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1600 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    const proto = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function () {
      return (this.dataset.area !== undefined ? { left: 300, top: 0, width: 1200, height: 900 } : proto.call(this)) as DOMRect;
    };
    try {
      function Page() {
        const area = React.useRef<HTMLDivElement>(null);
        return (
          <div ref={area} data-area="">
            <SettingsDialog open onOpenChange={() => {}} sections={sections} size="xl" fitTo={area} />
          </div>
        );
      }
      render(<Page />);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("data-fitted");
      expect(dialog.style.getPropertyValue("--settings-fit-left")).toBe("316px");
    } finally {
      HTMLElement.prototype.getBoundingClientRect = proto;
    }
  });

  it("maximizes and restores from its toggle, ignoring fitTo while maximized", async () => {
    const onMaximizedChange = vi.fn();
    const area = document.createElement("div");
    area.getBoundingClientRect = () => ({ left: 300, top: 0, width: 1200, height: 900 }) as DOMRect;
    render(
      <SettingsDialog open onOpenChange={() => {}} sections={sections} size="xl" fitTo={{ current: area }} maximizable onMaximizedChange={onMaximizedChange} />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-fitted");
    await userEvent.click(screen.getByRole("button", { name: "Maximieren" }));
    expect(onMaximizedChange).toHaveBeenLastCalledWith(true);
    expect(dialog).toHaveAttribute("data-maximized");
    expect(dialog).not.toHaveAttribute("data-fitted");
    await userEvent.click(screen.getByRole("button", { name: "Wiederherstellen" }));
    expect(onMaximizedChange).toHaveBeenLastCalledWith(false);
    expect(dialog).not.toHaveAttribute("data-maximized");
    expect(dialog).toHaveAttribute("data-fitted");
  });

  it("shows no maximize toggle unless maximizable", () => {
    render(<SettingsDialog open onOpenChange={() => {}} sections={sections} />);
    expect(screen.queryByRole("button", { name: "Maximieren" })).not.toBeInTheDocument();
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
