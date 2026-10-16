import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

/**
 * ORACLE — the WAI-ARIA APG "Tabs Pattern" plus the WAI-ARIA 1.2 role
 * definitions, not this component's source. Nothing below reads a class name or
 * a `data-*` attribute the implementation happens to write; every assertion is
 * either
 *
 *  (a) a role/name *resolution* performed by Testing Library's `getByRole`,
 *      which computes roles and accessible names through aria-query and
 *      dom-accessibility-api — third-party implementations of the same specs, or
 *  (b) an ID reference that must *resolve to a specific other element*, so
 *      pointing it anywhere else fails.
 *
 * The pattern, in the words of the spec:
 *  - the strip is a `tablist`; each tab is a `tab`; each panel is a `tabpanel`
 *  - exactly one tab has `aria-selected="true"`
 *  - a tab's `aria-controls` references *its* tabpanel
 *  - a tabpanel's `aria-labelledby` references *its* tab, which is therefore its
 *    accessible name
 *  - the tablist is a single tab stop (roving tabindex: the selected tab has
 *    `tabindex="0"`, the rest `tabindex="-1"`)
 *  - Left/Right (horizontal) or Up/Down (vertical) move focus between tabs and
 *    wrap; Home/End jump to the first/last tab
 *  - with *automatic* activation, moving focus selects; with *manual*
 *    activation, Enter or Space selects
 */

const SECTIONS = [
  { value: "single", tab: "Einzeln", panel: "Eine Person einladen" },
  { value: "bulk", tab: "Mehrere", panel: "Liste von Kennungen einfügen" },
  { value: "link", tab: "Einladungslink", panel: "Link erzeugen und teilen" },
] as const;

function renderTabs(
  props: Partial<React.ComponentProps<typeof Tabs>> = {},
  opts: { disabled?: string } = {},
) {
  return render(
    <>
      <button type="button">davor</button>
      <Tabs defaultValue="single" {...props}>
        <TabsList aria-label="Freigabe">
          {SECTIONS.map((s) => (
            <TabsTrigger
              key={s.value}
              value={s.value}
              disabled={opts.disabled === s.value}
            >
              {s.tab}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((s) => (
          <TabsContent key={s.value} value={s.value}>
            {s.panel}
          </TabsContent>
        ))}
      </Tabs>
    </>,
  );
}

/**
 * The APG wiring, resolved rather than merely present: exactly one tab is
 * selected, the single rendered tabpanel's `aria-labelledby` resolves to *that*
 * tab, the selected tab's `aria-controls` resolves back to *that* panel, and the
 * panel carries the expected content. Returns the selected tab.
 */
function expectSelectedTabOwnsThePanel(tabLabel: string, panelText: string) {
  const tabs = screen.getAllByRole("tab");
  const selected = tabs.filter(
    (t) => t.getAttribute("aria-selected") === "true",
  );
  expect(selected).toHaveLength(1);
  expect(selected[0]).toHaveAccessibleName(tabLabel);

  // Exactly one panel exists at a time.
  const panels = screen.getAllByRole("tabpanel");
  expect(panels).toHaveLength(1);
  const panel = panels[0];

  // aria-labelledby must resolve to the *selected* tab element itself …
  const labelledBy = panel.getAttribute("aria-labelledby");
  expect(labelledBy).toBeTruthy();
  expect(document.getElementById(labelledBy as string)).toBe(selected[0]);
  // … which makes the tab's text the panel's accessible name.
  expect(screen.getByRole("tabpanel", { name: tabLabel })).toBe(panel);
  expect(panel).toHaveTextContent(panelText);

  // … and the selected tab's aria-controls must resolve back to that panel.
  const controls = selected[0].getAttribute("aria-controls");
  expect(controls).toBeTruthy();
  expect(document.getElementById(controls as string)).toBe(panel);

  return selected[0];
}

describe("Tabs — APG structure and name resolution", () => {
  it("exposes one tablist, one tab per section and exactly one tabpanel", () => {
    renderTabs();
    const tablist = screen.getByRole("tablist", { name: "Freigabe" });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(SECTIONS.length);
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  });

  it("names the open panel after the selected tab (aria-labelledby resolves to it)", () => {
    renderTabs();
    expectSelectedTabOwnsThePanel("Einzeln", "Eine Person einladen");
  });

  it("moves aria-selected, the panel and its label together on activation", async () => {
    renderTabs();
    await userEvent.click(screen.getByRole("tab", { name: "Einladungslink" }));
    expectSelectedTabOwnsThePanel("Einladungslink", "Link erzeugen und teilen");
    // The previous panel is gone, not merely unselected.
    expect(screen.queryByText("Eine Person einladen")).toBeNull();
  });

  it("marks every unselected tab aria-selected=false", () => {
    renderTabs();
    const unselected = screen
      .getAllByRole("tab")
      .filter((t) => t.getAttribute("aria-selected") !== "true");
    expect(unselected).toHaveLength(SECTIONS.length - 1);
    for (const tab of unselected) {
      expect(tab).toHaveAttribute("aria-selected", "false");
    }
  });
});

describe("Tabs — the strip is a single tab stop", () => {
  /**
   * VERIFIED, NOT ASSUMED — Radix does not implement the plain APG roving
   * tabindex. Before focus has ever entered the strip, *every* trigger is
   * `tabindex="-1"` and the `tablist` container itself holds `tabindex="0"`:
   * it is the entry stop and redirects focus to the selected tab on `focus`.
   * Only afterwards does the roving `0` sit on a trigger. Either way the
   * *observable* APG requirement holds — the whole strip is one tab stop and
   * Tab lands on the active tab — which is what the next test asserts and what
   * the docs promise.
   */
  it("parks the entry tab stop on the tablist while no tab has been focused", () => {
    renderTabs();
    expect(screen.getByRole("tablist", { name: "Freigabe" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute("tabindex", "-1");
    }
  });

  it("hands the roving 0 to the focused tab and -1 to every other, once entered", async () => {
    renderTabs({ defaultValue: "bulk" });
    screen.getByRole("button", { name: "davor" }).focus();
    await userEvent.tab();
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute(
        "tabindex",
        tab === document.activeElement ? "0" : "-1",
      );
    }
  });

  it("lands on the selected tab with one Tab press, and leaves the strip with the next", async () => {
    renderTabs({ defaultValue: "bulk" });
    screen.getByRole("button", { name: "davor" }).focus();
    await userEvent.tab();
    // One stop for the whole strip: focus goes to the *selected* tab, not the
    // first one.
    expect(screen.getByRole("tab", { name: "Mehrere" })).toHaveFocus();
    await userEvent.tab();
    // APG: the panel is the next stop after the strip (Radix keeps tabIndex=0
    // on it, which the pattern asks for when the panel's content is not
    // focusable).
    expect(screen.getByRole("tabpanel", { name: "Mehrere" })).toHaveFocus();
  });
});

describe("Tabs — keyboard navigation (horizontal)", () => {
  it("moves focus and selection with Left/Right and wraps around", async () => {
    renderTabs();
    screen.getByRole("tab", { name: "Einzeln" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Mehrere" })).toHaveFocus();
    expectSelectedTabOwnsThePanel("Mehrere", "Liste von Kennungen einfügen");

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Einladungslink" })).toHaveFocus();

    // Wraps from the last tab back to the first.
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Einzeln" })).toHaveFocus();
    expectSelectedTabOwnsThePanel("Einzeln", "Eine Person einladen");

    // … and backwards from the first to the last.
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Einladungslink" })).toHaveFocus();
  });

  it("jumps to the first and last tab with Home and End", async () => {
    renderTabs({ defaultValue: "bulk" });
    screen.getByRole("tab", { name: "Mehrere" }).focus();

    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Einladungslink" })).toHaveFocus();
    expectSelectedTabOwnsThePanel("Einladungslink", "Link erzeugen und teilen");

    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Einzeln" })).toHaveFocus();
    expectSelectedTabOwnsThePanel("Einzeln", "Eine Person einladen");
  });

  it("ignores Up/Down while horizontal", async () => {
    renderTabs();
    const first = screen.getByRole("tab", { name: "Einzeln" });
    first.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(first).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(first).toHaveFocus();
  });
});

describe("Tabs — vertical orientation", () => {
  it("announces aria-orientation=vertical and navigates with Up/Down instead", async () => {
    renderTabs({ orientation: "vertical" });
    expect(screen.getByRole("tablist", { name: "Freigabe" })).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );

    const first = screen.getByRole("tab", { name: "Einzeln" });
    first.focus();
    // Left/Right are inert on a vertical tablist …
    await userEvent.keyboard("{ArrowRight}");
    expect(first).toHaveFocus();
    // … Up/Down are the navigation keys.
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Mehrere" })).toHaveFocus();
    expectSelectedTabOwnsThePanel("Mehrere", "Liste von Kennungen einfügen");
    await userEvent.keyboard("{ArrowUp}");
    expect(first).toHaveFocus();
  });

  it("keeps aria-orientation=horizontal by default", () => {
    renderTabs();
    expect(screen.getByRole("tablist", { name: "Freigabe" })).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
  });
});

describe("Tabs — disabled tab", () => {
  it("is skipped by arrow navigation and cannot be selected", async () => {
    renderTabs({}, { disabled: "bulk" });
    const disabled = screen.getByRole("tab", { name: "Mehrere" });
    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAttribute("aria-selected", "false");

    screen.getByRole("tab", { name: "Einzeln" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    // Focus skips the disabled tab entirely.
    expect(screen.getByRole("tab", { name: "Einladungslink" })).toHaveFocus();

    await userEvent.click(disabled);
    expectSelectedTabOwnsThePanel("Einladungslink", "Link erzeugen und teilen");
  });
});

describe("Tabs — activation mode", () => {
  it("selects on focus by default (automatic activation)", async () => {
    renderTabs();
    screen.getByRole("tab", { name: "Einzeln" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Mehrere" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("with activationMode=manual, arrowing only moves focus; Enter selects", async () => {
    renderTabs({ activationMode: "manual" });
    screen.getByRole("tab", { name: "Einzeln" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    const focused = screen.getByRole("tab", { name: "Mehrere" });
    expect(focused).toHaveFocus();
    // Focus moved, selection did not — the panel still belongs to tab 1.
    expect(focused).toHaveAttribute("aria-selected", "false");
    expectSelectedTabOwnsThePanel("Einzeln", "Eine Person einladen");

    await userEvent.keyboard("{Enter}");
    expectSelectedTabOwnsThePanel("Mehrere", "Liste von Kennungen einfügen");
  });

  it("with activationMode=manual, Space selects the focused tab too", async () => {
    renderTabs({ activationMode: "manual" });
    screen.getByRole("tab", { name: "Einzeln" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard(" ");
    expectSelectedTabOwnsThePanel("Mehrere", "Liste von Kennungen einfügen");
  });
});

describe("Tabs — controlled value", () => {
  it("reports every change through onValueChange and renders the given value", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Tabs value="single" onValueChange={onValueChange}>
        <TabsList aria-label="Freigabe">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.tab}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((s) => (
          <TabsContent key={s.value} value={s.value}>
            {s.panel}
          </TabsContent>
        ))}
      </Tabs>,
    );

    await userEvent.click(screen.getByRole("tab", { name: "Mehrere" }));
    expect(onValueChange).toHaveBeenCalledWith("bulk");
    // Controlled: the owner decides, so the view has not moved on its own.
    expectSelectedTabOwnsThePanel("Einzeln", "Eine Person einladen");

    rerender(
      <Tabs value="bulk" onValueChange={onValueChange}>
        <TabsList aria-label="Freigabe">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.tab}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((s) => (
          <TabsContent key={s.value} value={s.value}>
            {s.panel}
          </TabsContent>
        ))}
      </Tabs>,
    );
    expectSelectedTabOwnsThePanel("Mehrere", "Liste von Kennungen einfügen");
  });
});

describe("Tabs — documented contract: inactive panels are unmounted", () => {
  it("loses panel-local state across a switch, so consumers must lift it", async () => {
    // Not a spec assertion but the promise the MDX makes to call sites (the
    // JustRAG "Mitglieder" dialog has a form per tab). Pinned here so the
    // promise cannot silently stop being true.
    render(
      <Tabs defaultValue="single">
        <TabsList aria-label="Freigabe">
          <TabsTrigger value="single">Einzeln</TabsTrigger>
          <TabsTrigger value="bulk">Mehrere</TabsTrigger>
        </TabsList>
        <TabsContent value="single">
          <input aria-label="Kennung" defaultValue="" />
        </TabsContent>
        <TabsContent value="bulk">Liste</TabsContent>
      </Tabs>,
    );

    await userEvent.type(screen.getByRole("textbox", { name: "Kennung" }), "abc");
    expect(screen.getByRole("textbox", { name: "Kennung" })).toHaveValue("abc");

    await userEvent.click(screen.getByRole("tab", { name: "Mehrere" }));
    expect(screen.queryByRole("textbox", { name: "Kennung" })).toBeNull();

    await userEvent.click(screen.getByRole("tab", { name: "Einzeln" }));
    expect(screen.getByRole("textbox", { name: "Kennung" })).toHaveValue("");
  });
});

describe("Tabs — call-site overrides", () => {
  it("merges className on each part without dropping the part's own styling", () => {
    render(
      <Tabs defaultValue="a" className="w-full">
        <TabsList aria-label="Bereiche" className="overflow-x-auto">
          <TabsTrigger value="a" className="grow">
            A
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="pt-2">
          Inhalt
        </TabsContent>
      </Tabs>,
    );
    // Layout classes from the call site survive `cn()` …
    expect(screen.getByRole("tablist")).toHaveClass("overflow-x-auto");
    expect(screen.getByRole("tab", { name: "A" })).toHaveClass("grow");
    expect(screen.getByRole("tabpanel", { name: "A" })).toHaveClass("pt-2");
    // … and the roles they are attached to are untouched.
    expect(screen.getByRole("tablist")).toHaveClass("border-outline-variant");
  });
});

// ORACLE: the APG tablist contract above, re-checked for the segmented look —
// a variant may change classes, never roles, selection or keyboard.
describe("Tabs — segmented variant", () => {
  function renderSegmented() {
    return render(
      <Tabs defaultValue="one">
        <TabsList variant="segmented" aria-label="Modus">
          <TabsTrigger value="one">Einzeln</TabsTrigger>
          <TabsTrigger value="many">Sammeleinladung</TabsTrigger>
          <TabsTrigger value="link">Einladungslinks</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel eins</TabsContent>
        <TabsContent value="many">Panel zwei</TabsContent>
        <TabsContent value="link">Panel drei</TabsContent>
      </Tabs>,
    );
  }

  it("is still one tablist with tabs and one named panel", () => {
    renderSegmented();
    expect(screen.getByRole("tablist", { name: "Modus" })).toHaveAttribute("data-variant", "segmented");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tabpanel", { name: "Einzeln" })).toHaveTextContent("Panel eins");
  });

  it("moves selection with the arrow keys like the default strip", async () => {
    renderSegmented();
    await userEvent.click(screen.getByRole("tab", { name: "Einzeln" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Sammeleinladung" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Sammeleinladung" })).toHaveTextContent("Panel zwei");
  });

  it("gives triggers equal shares of the track instead of the underline", () => {
    renderSegmented();
    const tab = screen.getByRole("tab", { name: "Einzeln" });
    expect(tab.className).toContain("flex-1");
    expect(tab.className).not.toContain("border-b-2");
  });

  it("leaves the default strip on the underline", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Standard"><TabsTrigger value="a">A</TabsTrigger></TabsList>
        <TabsContent value="a">x</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole("tablist")).toHaveAttribute("data-variant", "underline");
    expect(screen.getByRole("tab", { name: "A" }).className).toContain("border-b-2");
  });
});

// ORACLE: the same APG contract for the enclosed (sheet-tab) look — the
// variant changes classes, never roles, selection or keyboard.
describe("Tabs — enclosed variant", () => {
  function renderEnclosed() {
    return render(
      <Tabs defaultValue="a">
        <TabsList variant="enclosed" aria-label="Tabellenblätter">
          <TabsTrigger value="a">Erhebung</TabsTrigger>
          <TabsTrigger value="b">Nutzungsarten</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Blatt eins</TabsContent>
        <TabsContent value="b">Blatt zwei</TabsContent>
      </Tabs>,
    );
  }

  it("is still one tablist with tabs and one named panel", () => {
    renderEnclosed();
    expect(screen.getByRole("tablist", { name: "Tabellenblätter" })).toHaveAttribute("data-variant", "enclosed");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tabpanel", { name: "Erhebung" })).toHaveTextContent("Blatt eins");
  });

  it("moves selection with the arrow keys like the default strip", async () => {
    renderEnclosed();
    await userEvent.click(screen.getByRole("tab", { name: "Erhebung" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Nutzungsarten" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Nutzungsarten" })).toHaveTextContent("Blatt zwei");
  });

  it("draws separate tab boxes instead of an underline", () => {
    renderEnclosed();
    const tab = screen.getByRole("tab", { name: "Erhebung" });
    expect(tab.className).toContain("rounded-t-md");
    expect(tab.className).not.toContain("border-b-2");
    expect(screen.getByRole("tablist").className).not.toContain("border-b");
  });

  it("keeps a contrasting focus ring on the active (primary-fixed) tab", () => {
    renderEnclosed();
    // Codex review of #71: the shared ring tone nearly vanishes on primary-fixed.
    expect(screen.getByRole("tab", { name: "Erhebung" }).className).toContain("data-[state=active]:focus-visible:ring-on-primary-fixed");
  });
});
