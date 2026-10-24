import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { List, Search, Settings } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxFooter,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
} from "./combobox";
import { Button } from "./button";
import { Input } from "./input";
import { Kbd, KbdGroup } from "./kbd";
import { AppShellFixture } from "../test/fixtures/app-shell";
import {
  GUTTER,
  TRANSPARENT,
  activeOption,
  centre,
  contentBox,
  corners,
  expectJoinedPanel,
  fieldLook,
  grownWidth,
  page,
  panelOf,
  remPx,
  resolvedColor,
  resolvedStyle,
  settled,
} from "../test/fixtures/combobox-panel";

/*
 * Oracle for every play function below: the DOM as the browser and assistive
 * technology see it — `document.activeElement`, ARIA attributes, roles and
 * accessible names, layout boxes, `elementFromPoint` — never component state.
 * Geometry and colours are compared with values taken from outside the
 * component: `tokens.css` literals (`--radius-action` and
 * `--radius-field` = `--ui-radius-control` 10px)
 * and token colours / shadows resolved by the browser on a probe element.
 * Widths are compared with the stated width expressions evaluated from
 * outside: the rem size read off `<html>`, the 24px gutter
 * (`--spacing-gutter` in `tokens.css`), `window.innerWidth`, and the boxes
 * of the slot and the bar row the field sits in.
 * Nothing is read back from the component's own class strings or state. The
 * list is portalled to <body>, so it is queried there, not in the canvas.
 */

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  // Stricter than the repo-wide `todo`: the ARIA wiring is this component's
  // whole point, so an axe violation in any story's end state fails the test.
  parameters: { a11y: { test: "error" } },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------------ */
/* Default: client-filtered, in the app bar                                 */
/* ------------------------------------------------------------------------ */

const FACULTIES = [
  "01 Rechtswissenschaft",
  "02 Wirtschaftswissenschaften",
  "03 Sozial- und Kulturwissenschaften",
  "04 Geschichts- und Kulturwissenschaften",
  "05 Sprache, Literatur, Kultur",
];
const CENTRES = [
  { name: "Hochschulrechenzentrum", short: "HRZ" },
  { name: "Universitätsbibliothek", short: "UB" },
  { name: "Zentrum für Medien und Interaktivität", short: "ZMI" },
];

/**
 * The search field of the bar: client-filtered groups, palette rows (a
 * muted `description` on the centres, a `Kbd` `shortcutHint` on the action).
 */
function ClientCombobox({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <Combobox>
      <ComboboxInput
        aria-label="Einrichtung suchen"
        placeholder="Fachbereich oder Einrichtung …"
        leadingIcon={<Search />}
      />
      <ComboboxContent>
        <ComboboxEmpty>Keine Treffer</ComboboxEmpty>
        <ComboboxList>
          <ComboboxGroup heading="Fachbereiche">
            {FACULTIES.map((name) => (
              <ComboboxItem key={name} onSelect={onSelect}>
                {name}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup heading="Zentrale Einrichtungen">
            {CENTRES.map(({ name, short }) => (
              <ComboboxItem key={name} onSelect={onSelect} description={short}>
                {name}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup heading="Aktionen">
            <ComboboxItem
              onSelect={onSelect}
              shortcutHint={
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>⇧</Kbd>
                  <Kbd>E</Kbd>
                </KbdGroup>
              }
            >
              <List aria-hidden="true" />
              Alle Einrichtungen anzeigen
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
        <ComboboxFooter>
          <span className="font-medium text-on-surface">JLU</span> Alle Einrichtungen
        </ComboboxFooter>
      </ComboboxContent>
    </Combobox>
  );
}

function DefaultPage() {
  const [selected, setSelected] = useState("—");
  return (
    <AppShellFixture
      context="overview"
      // A label long enough to fill its region: the grown field covers its end.
      pageLabel="Fachbereiche und zentrale Einrichtungen der Universität"
      headerActions={
        <Button type="button" variant="ghost" size="icon" aria-label="Einstellungen">
          <Settings size={20} aria-hidden="true" />
        </Button>
      }
      search={<ClientCombobox onSelect={setSelected} />}
    >
      <p className="m-0 p-gutter text-on-surface-variant" data-testid="selected">
        Ausgewählt: {selected}
      </p>
    </AppShellFixture>
  );
}

/**
 * The Combobox: field and open list are ONE surface — one border, one outer
 * radius, one shadow, no gap, a single divider — like a command palette
 * growing out of the search field. Closed, it is the ordinary framed field,
 * 24rem wide (the slot's `--combobox-width`, capped by the slot); open, the
 * field widens to the 40rem palette width (`--combobox-open-width`, capped
 * by the bar row and the viewport minus the gutters), centred, as an
 * overlay — the bar and its regions do not move. A `ComboboxFooter` closes
 * the panel: the context on the left, the key hints on the right.
 * Shown in the `AppShellLayout` search slot (the shared `overview`
 * fixture), where JustRAG's global search sits. The data is a demo, not
 * JustRAG's UI: JustRAG's search runs in server mode (`shouldFilter={false}`,
 * controlled `open`), while this story uses client filtering (the default);
 * the palette rows — the centres' abbreviations as `description`, the
 * „Alle Einrichtungen anzeigen" row with its `shortcutHint` — are made up to
 * exercise those props. The play function checks in one real-browser run:
 *
 * - **Closed:** a framed field, in a bar that stays 56px open or closed
 *   (JustRAG's `Toast.css` `top: 68px` = 56 + 12 depends on it); 24rem wide
 *   (at most the slot) and centred in the slot.
 * - **Growth:** open, the field is min(40rem, bar row content, viewport −
 *   2 × 24px) wide, centred on its closed box, as tall as before, painted
 *   over the bar's side region; the row, the slot and both side regions keep
 *   their boxes. With a huge requested width the bar row's content box caps it.
 * - **Footer:** below the list, not in it, nothing focusable; a full-width
 *   `outline-variant` divider on the panel surface; the key hints
 *   (↵ Öffnen, ↑ ↓ Navigieren, esc Schließen) hidden from assistive tech.
 * - **Keyboard:** ↓ opens a closed list; ↓/↑ move the highlight and wrap
 *   around; Home/End jump; Enter selects and closes. The highlight travels as
 *   `aria-activedescendant`, focus never leaves the field.
 * - **Panel:** the joined geometry; the list is portalled, so the bar cannot
 *   clip it; closed again, the field's own focused frame is back.
 * - **Palette rows:** a muted `description` that is part of the name, a
 *   `shortcutHint` at the trailing edge, hidden from assistive tech, whose
 *   `Kbd` steps up one surface on the highlighted row.
 * - **Click:** selecting with the mouse keeps focus in the field (the list
 *   cancels its mousedown, so the field never blurs); `onSelect` gets the
 *   label, not label + description.
 * - **Filter:** groups without a match disappear; `ComboboxEmpty` shows when
 *   nothing matches, and the empty listbox leaves the accessibility tree.
 * - **Escape:** closes the list and leaves focus and text in the field.
 * - **Pointer:** a click into the field (under the panel's top) keeps the
 *   list open; a click outside closes it.
 */
export const Default: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <DefaultPage />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const body = page(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Einrichtung suchen" });
    const selected = canvas.getByTestId("selected");
    const bar = canvasElement.querySelector("header") as HTMLElement;
    const barHeight = () => getComputedStyle(bar).height;
    // AppShellLayout's wide bar: `header > row`, the row's three regions.
    const row = bar.firstElementChild as HTMLElement;
    const [leftRegion, slot, rightRegion] = Array.from(row.children) as HTMLElement[];
    await expect(slot.contains(input)).toBe(true);
    const layoutOf = () =>
      [row, leftRegion, slot, rightRegion].map((el) => {
        const box = el.getBoundingClientRect();
        return [box.left, box.top, box.width, box.height];
      });

    await step("Closed: an ordinary framed field in the 56px bar", async () => {
      await expect(barHeight()).toBe("56px");
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await expect(input).not.toHaveAttribute("data-panel");
      const style = getComputedStyle(input);
      await expect(corners(style)).toEqual(["9999px", "9999px", "9999px", "9999px"]);
      await expect(style.borderTopWidth).toBe("1px");
      await expect(style.borderTopColor).toBe(resolvedColor(canvasElement, "var(--color-outline-variant)"));
      // 24rem, at most the slot, centred in it — narrower than the 28rem slot here.
      const fieldBox = input.getBoundingClientRect();
      const slotBox = slot.getBoundingClientRect();
      await expect(Math.abs(fieldBox.width - Math.min(24 * remPx(), slotBox.width))).toBeLessThan(0.5);
      await expect(fieldBox.width).toBeLessThan(slotBox.width);
      await expect(Math.abs(centre(fieldBox) - centre(slotBox))).toBeLessThan(0.5);
      // A closed width larger than the slot is capped at the slot.
      slot.style.setProperty("--combobox-width", "200rem");
      try {
        await expect(Math.abs(input.getBoundingClientRect().width - slotBox.width)).toBeLessThan(0.5);
      } finally {
        slot.style.removeProperty("--combobox-width");
      }
    });

    await step("Keyboard: ↓ opens, highlight wraps, Enter selects", async () => {
      await userEvent.click(input);
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await userEvent.keyboard("{ArrowDown}");
      const listbox = await body.findByRole("listbox");
      await expect(input).toHaveAttribute("aria-expanded", "true");
      await expect(input).toHaveAttribute("aria-controls", listbox.id);
      const options = within(listbox).getAllByRole("option");
      const first = options[0];
      const last = options[options.length - 1];

      await waitFor(() => expect(activeOption(input)).toBe(first));
      await userEvent.keyboard("{ArrowDown}");
      await expect(activeOption(input)).toBe(options[1]);
      await expect(options[1]).toHaveAttribute("aria-selected", "true");
      await expect(first).toHaveAttribute("aria-selected", "false");
      await userEvent.keyboard("{End}");
      await expect(activeOption(input)).toBe(last);
      await userEvent.keyboard("{ArrowDown}");
      await expect(activeOption(input)).toBe(first); // wrapped past the last
      await userEvent.keyboard("{ArrowUp}");
      await expect(activeOption(input)).toBe(last); // wrapped past the first
      await userEvent.keyboard("{Home}");
      await expect(activeOption(input)).toBe(first);

      await userEvent.keyboard("{ArrowDown}{Enter}");
      await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await expect(input).not.toHaveAttribute("aria-controls");
      await expect(selected).toHaveTextContent(`Ausgewählt: ${FACULTIES[1]}`);
      await expect(document.activeElement).toBe(input);
    });

    await step("Panel: one surface with the field, grown, not clipped by the bar", async () => {
      const closedField = input.getBoundingClientRect();
      const closedLayout = layoutOf();
      await userEvent.type(input, "zentr");
      const listbox = await body.findByRole("listbox");
      await waitFor(() => expect(activeOption(input)).not.toBeNull());
      await expect(input).toHaveAttribute("data-panel", "open");
      // The bar's search is a capsule; open, field and panel share the row
      // radius (`--combobox-open-radius`) — a capsule cannot frame a list.
      await expectJoinedPanel(canvasElement, input, listbox, { radius: "10px" });
      await expect(barHeight()).toBe("56px");

      // Grown: the palette width, centred on the closed field, same height.
      const openField = input.getBoundingClientRect();
      const expected = grownWidth(40 * remPx(), contentBox(row).width, closedField.width);
      await expect(Math.abs(openField.width - expected)).toBeLessThan(0.5);
      await expect(openField.width).toBeGreaterThan(closedField.width + 1);
      await expect(Math.abs(centre(openField) - centre(closedField))).toBeLessThan(0.5);
      await expect(Math.abs(openField.height - closedField.height)).toBeLessThan(0.5);
      // An overlay: the row, the slot and the side regions did not move.
      await expect(layoutOf()).toEqual(closedLayout);
      // Painted over the side region: left of the slot, over the page label's
      // (truncated) text, the field is what the pointer hits.
      const x = openField.left + 4;
      const y = openField.top + openField.height / 2;
      const label = within(leftRegion).getByText(/^Fachbereiche und zentrale/);
      const labelBox = label.getBoundingClientRect();
      await expect(x).toBeLessThan(slot.getBoundingClientRect().left);
      await expect(x > labelBox.left && x < labelBox.right && y > labelBox.top && y < labelBox.bottom).toBe(true);
      await expect(document.elementFromPoint(x, y)).toBe(input);

      // Footer: after the list, outside it, nothing focusable in it.
      const panel = panelOf(listbox);
      const footer = panel.querySelector<HTMLElement>('[data-slot="combobox-footer"]');
      if (!footer) throw new Error("footer missing");
      await expect(listbox.contains(footer)).toBe(false);
      await expect(footer.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        listbox.getBoundingClientRect().bottom,
      );
      await expect(
        footer.querySelectorAll("a, button, input, select, textarea, [tabindex], [contenteditable]"),
      ).toHaveLength(0);
      // Context left, key hints right, the hints hidden from assistive tech.
      await expect(footer).toHaveTextContent(/^JLU Alle Einrichtungen/);
      const keys = Array.from(footer.querySelectorAll('[data-slot="kbd"]'));
      await expect(keys.map((key) => key.textContent)).toEqual(["↵", "↑", "↓", "esc"]);
      for (const word of ["Öffnen", "Navigieren", "Schließen"]) {
        const hint = within(footer).getByText(word);
        await expect(hint.closest('[aria-hidden="true"]')).not.toBeNull();
      }
      for (const key of keys) await expect(key.closest('[aria-hidden="true"]')).not.toBeNull();
      const context = within(footer).getByText("Alle Einrichtungen", { exact: false });
      await expect(context.closest('[aria-hidden="true"]')).toBeNull();
      await expect(keys[0].getBoundingClientRect().left).toBeGreaterThan(context.getBoundingClientRect().right);
      // One surface: a 1px outline-variant divider, edge to edge inside the
      // panel's border, the footer transparent on the panel surface.
      const footerStyle = getComputedStyle(footer);
      await expect(footerStyle.borderTopWidth).toBe("1px");
      await expect(footerStyle.borderTopColor).toBe(resolvedColor(canvasElement, "var(--color-outline-variant)"));
      await expect(footerStyle.backgroundColor).toBe(TRANSPARENT);
      const footerBox = footer.getBoundingClientRect();
      const panelBox = panel.getBoundingClientRect();
      await expect(Math.abs(footerBox.left - (panelBox.left + 1))).toBeLessThan(0.5);
      await expect(Math.abs(footerBox.right - (panelBox.right - 1))).toBeLessThan(0.5);
      await expect(Math.abs(footerBox.bottom - (panelBox.bottom - 1))).toBeLessThan(0.5);

      // Not clipped: the list is outside the bar's subtree, reaches below it,
      // and its last option is what the browser hit-tests at that option's
      // centre — nothing (the bar included) covers or cuts it.
      await expect(bar.contains(listbox)).toBe(false);
      const barBottom = bar.getBoundingClientRect().bottom;
      await expect(listbox.getBoundingClientRect().bottom).toBeGreaterThan(barBottom);
      const options = within(listbox).getAllByRole("option");
      const lastBox = options[options.length - 1].getBoundingClientRect();
      await expect(lastBox.top).toBeGreaterThan(barBottom);
      const hit = document.elementFromPoint(
        lastBox.left + lastBox.width / 2,
        lastBox.top + lastBox.height / 2,
      );
      await expect(options[options.length - 1].contains(hit)).toBe(true);

      // Closed again: the field's own focused frame is back, and the bar is unchanged.
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
      await expect(input).not.toHaveAttribute("data-panel");
      await settled(input);
      const style = getComputedStyle(input);
      await expect(style.borderTopColor).toBe(resolvedColor(canvasElement, "var(--color-outline-variant)"));
      await expect(corners(style)).toEqual(["9999px", "9999px", "9999px", "9999px"]);
      await expect(barHeight()).toBe("56px");
      // Back to its closed width.
      await expect(Math.abs(input.getBoundingClientRect().width - closedField.width)).toBeLessThan(0.5);
      await userEvent.clear(input);
    });

    await step("Growth cap: the bar row's content box, not the viewport", async () => {
      const closedField = input.getBoundingClientRect();
      slot.style.setProperty("--combobox-open-width", "200rem");
      try {
        await userEvent.type(input, "zentr");
        const listbox = await body.findByRole("listbox");
        const rowContent = contentBox(row);
        const openField = input.getBoundingClientRect();
        // 200rem is wider than the row: the row's content width wins.
        await expect(rowContent.width).toBeLessThan(window.innerWidth - 2 * GUTTER);
        await expect(Math.abs(openField.width - rowContent.width)).toBeLessThan(0.5);
        await expect(Math.abs(openField.left - rowContent.left)).toBeLessThan(0.5);
        await expect(Math.abs(centre(openField) - centre(closedField))).toBeLessThan(0.5);
        await expect(Math.abs(panelOf(listbox).getBoundingClientRect().width - openField.width)).toBeLessThan(0.5);
        await expect(barHeight()).toBe("56px");
        // It now covers the header action too, and is painted over it — also
        // over a positioned action (a badge on a button makes it `relative`),
        // which comes later in the bar's tree order than the field.
        const button = canvas.getByRole("button", { name: "Einstellungen" });
        button.style.position = "relative";
        try {
          const action = button.getBoundingClientRect();
          // (The action ends on the row's content edge, as the grown field does.)
          await expect(action.left).toBeGreaterThan(openField.left);
          await expect(action.right).toBeLessThanOrEqual(openField.right + 0.5);
          await expect(document.elementFromPoint(centre(action), (action.top + action.bottom) / 2)).toBe(input);
        } finally {
          button.style.position = "";
        }
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
      } finally {
        slot.style.removeProperty("--combobox-open-width");
      }
      await userEvent.clear(input);
    });

    await step("Narrow panel: the footer's key hints stay inside it", async () => {
      // No growth (open width 0), so the panel is as narrow as the field.
      slot.style.setProperty("--combobox-open-width", "0px");
      try {
        /** Every hint (key + word) inside the footer's content box and inside the panel's border. */
        const expectHintsInside = async (width: string) => {
          slot.style.setProperty("--combobox-width", width);
          await expect(Math.abs(input.getBoundingClientRect().width - parseFloat(width) * remPx())).toBeLessThan(0.5);
          await userEvent.type(input, "zentr");
          const listbox = await body.findByRole("listbox");
          const panel = panelOf(listbox);
          const footer = panel.querySelector<HTMLElement>('[data-slot="combobox-footer"]') as HTMLElement;
          const inner = contentBox(footer);
          const footerBox = footer.getBoundingClientRect();
          const panelBox = panel.getBoundingClientRect();
          const hints = Array.from(footer.querySelectorAll<HTMLElement>('[data-slot="combobox-footer-hint"]'));
          await expect(hints).toHaveLength(3);
          for (const hint of hints) {
            const box = hint.getBoundingClientRect();
            await expect(box.width).toBeGreaterThan(0);
            await expect(box.left).toBeGreaterThanOrEqual(inner.left - 0.5);
            await expect(box.right).toBeLessThanOrEqual(inner.right + 0.5);
            await expect(box.top).toBeGreaterThanOrEqual(footerBox.top);
            await expect(box.bottom).toBeLessThanOrEqual(footerBox.bottom + 0.5);
            await expect(box.left).toBeGreaterThanOrEqual(panelBox.left + 1 - 0.5);
            await expect(box.right).toBeLessThanOrEqual(panelBox.right - 1 + 0.5);
            await expect(box.bottom).toBeLessThanOrEqual(panelBox.bottom - 1 + 0.5);
          }
          // Every key stays visible.
          for (const key of footer.querySelectorAll<HTMLElement>('[data-slot="kbd"]')) {
            await expect(key.getBoundingClientRect().width).toBeGreaterThan(0);
          }
          const hintLines = new Set(hints.map((hint) => Math.round(hint.getBoundingClientRect().top))).size;
          await userEvent.keyboard("{Escape}");
          await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
          await userEvent.clear(input);
          return hintLines;
        };
        // 16rem — a phone-width field: the compact form fits on one line.
        await expect(await expectHintsInside("16rem")).toBe(1);
        // 8rem — the slot's floor: even the keys alone wrap, still inside.
        await expect(await expectHintsInside("8rem")).toBeGreaterThan(1);
      } finally {
        slot.style.removeProperty("--combobox-open-width");
        slot.style.removeProperty("--combobox-width");
      }
    });

    await step("Palette rows: description in the name, shortcut hidden and trailing", async () => {
      await userEvent.keyboard("{ArrowDown}");
      const listbox = await body.findByRole("listbox");
      const library = within(listbox).getByRole("option", { name: /Universitätsbibliothek/ });
      await expect(library).toHaveAccessibleName("Universitätsbibliothek UB");
      const description = library.querySelector<HTMLElement>('[data-slot="combobox-item-description"]');
      await expect(getComputedStyle(description as HTMLElement).color).toBe(
        resolvedColor(canvasElement, "var(--color-on-surface-variant)"),
      );

      const action = within(listbox).getByRole("option", { name: "Alle Einrichtungen anzeigen" });
      const shortcut = action.querySelector<HTMLElement>('[data-slot="combobox-item-shortcut"]');
      await expect(shortcut).toHaveAttribute("aria-hidden", "true");
      await userEvent.keyboard("{End}"); // the action row, scrolled into view
      await expect(activeOption(input)).toBe(action);
      const rowBox = action.getBoundingClientRect();
      const rowPaddingRight = parseFloat(getComputedStyle(action).paddingRight);
      await expect(
        Math.abs((shortcut as HTMLElement).getBoundingClientRect().right - (rowBox.right - rowPaddingRight)),
      ).toBeLessThan(0.5);
      // A Kbd on the highlighted row steps up one surface, and back down.
      const kbd = action.querySelector('[data-slot="kbd"]') as HTMLElement;
      await expect(getComputedStyle(kbd).backgroundColor).toBe(
        resolvedStyle(canvasElement, "backgroundColor", "var(--color-surface-container-highest)"),
      );
      await userEvent.keyboard("{ArrowUp}");
      await expect(activeOption(input)).not.toBe(action);
      await expect(getComputedStyle(kbd).backgroundColor).toBe(
        resolvedStyle(canvasElement, "backgroundColor", "var(--color-surface-container-high)"),
      );
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    });

    await step("Click: selecting with the mouse keeps focus in the field", async () => {
      await userEvent.type(input, "bib");
      const option = await body.findByRole("option", { name: "Universitätsbibliothek UB" });
      let blurred = false;
      const onBlur = () => (blurred = true);
      input.addEventListener("blur", onBlur);
      await userEvent.click(option);
      input.removeEventListener("blur", onBlur);
      await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
      await expect(blurred).toBe(false);
      await expect(document.activeElement).toBe(input);
      // The label, not label + description.
      await expect(selected.textContent).toBe("Ausgewählt: Universitätsbibliothek");
    });

    await step("Filter: non-matching groups go, an empty result shows ComboboxEmpty", async () => {
      await userEvent.clear(input);
      // The first keystroke opens the list AND highlights (and announces) its
      // first option, so Enter already has something to select.
      await userEvent.type(input, "w");
      await body.findByRole("listbox");
      await waitFor(() => expect(activeOption(input)).toHaveAttribute("aria-selected", "true"));
      await userEvent.type(input, "issen");
      const listbox = await body.findByRole("listbox");
      const names = within(listbox)
        .getAllByRole("option")
        .map((o) => o.textContent);
      await expect(names).toHaveLength(4);
      await expect(names.every((n) => n?.toLowerCase().includes("wissen"))).toBe(true);
      await expect(body.queryByRole("group", { name: "Zentrale Einrichtungen" })).toBeNull();
      await waitFor(() => expect(activeOption(input)).toHaveAttribute("aria-selected", "true"));
      await expect(document.activeElement).toBe(input);

      await userEvent.clear(input);
      await userEvent.type(input, "xyz");
      await expect(await body.findByText("Keine Treffer")).toBeVisible();
      await expect(within(listbox).queryAllByRole("option")).toHaveLength(0);
      // No options → no empty listbox in the accessibility tree.
      await waitFor(() => expect(listbox).not.toBeVisible());
    });

    await step("Escape: closes, keeps focus and text", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "recht");
      await body.findByRole("listbox");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await expect(input).toHaveValue("recht");
      await expect(document.activeElement).toBe(input);
    });

    await step("Pointer: a click into the field keeps the list open, outside closes it", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await body.findByRole("listbox");
      await userEvent.click(input);
      await expect(body.getByRole("listbox")).toBeVisible();
      await userEvent.click(selected);
      await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
      await expect(input).toHaveAttribute("aria-expanded", "false");
    });
  },
};

/**
 * A `ComboboxInput` with `aria-invalid`, plus a plain DS `Input` with the
 * same props as the reference the closed `ComboboxInput` must match.
 */
function InvalidFields() {
  return (
    // Centred, with a 32rem palette width: the ComboboxInput widens while
    // open (the closed width is unset, so closed it fills the column).
    <div data-testid="invalid-column" className="mx-auto flex max-w-md flex-col gap-6 [--combobox-open-width:32rem]">
      <Combobox>
        <ComboboxInput aria-label="Kürzel" aria-invalid leadingIcon={<Search />} />
        <ComboboxContent>
          <ComboboxList>
            {FACULTIES.map((name) => (
              <ComboboxItem key={name}>{name}</ComboboxItem>
            ))}
          </ComboboxList>
          <ComboboxFooter>Fachbereiche</ComboboxFooter>
        </ComboboxContent>
      </Combobox>
      <Input aria-label="Referenzfeld" aria-invalid leadingIcon={<Search />} />
    </div>
  );
}

/**
 * `aria-invalid` turns the field's border to the error token, like `Input`
 * — closed on the field, open on the panel (whose focus ring becomes the
 * error ring). A panel with nothing to show — no option, no `ComboboxEmpty`
 * — has no list part and no divider: it is just the framed field.
 *
 * The panel takes the field radius (10px), as in `Default`.
 * `TokenInput`'s `Invalid` story covers the chips field.
 *
 * Closed, the `ComboboxInput` is the ordinary framed field: a plain `Input`
 * with the same `leadingIcon` and `aria-invalid` is the reference, compared
 * at rest, focused, and after the panel was open and closed — the panel's
 * classes on the field may only act while it is open.
 *
 * The column sets `--combobox-open-width: 32rem` (no closed width): the
 * `ComboboxInput` widens to 32rem while open, centred on its closed box, in
 * the one Style. The panel also has a `ComboboxFooter`, which
 * alone does not keep the list part open when nothing matches.
 */
export const Invalid: Story = {
  render: () => <InvalidFields />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const body = page(canvasElement);
    const error = resolvedColor(canvasElement, "var(--color-error)");
    const input = canvas.getByRole("combobox", { name: "Kürzel" });

    await step("Closed: the ComboboxInput is the plain Input, at rest, focused, after open/close", async () => {
      const reference = canvas.getByRole("textbox", { name: "Referenzfeld" });
      await expect(fieldLook(input)).toEqual(fieldLook(reference));

      await userEvent.click(reference);
      await settled(reference);
      const referenceFocused = fieldLook(reference);
      await userEvent.click(input);
      await settled(input);
      await expect(fieldLook(input)).toEqual(referenceFocused);

      await userEvent.keyboard("{ArrowDown}");
      await body.findByRole("listbox");
      await expect(input).toHaveAttribute("data-panel", "open");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
      await expect(input).not.toHaveAttribute("data-panel");
      await settled(input);
      await expect(fieldLook(input)).toEqual(referenceFocused);
    });

    await step("Closed: the field carries the error border", async () => {
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(getComputedStyle(input).borderTopColor).toBe(error);
    });

    await step("ComboboxInput: error border and ring on the panel, 10px", async () => {
      const closed = input.getBoundingClientRect();
      await userEvent.type(input, "recht");
      const listbox = await body.findByRole("listbox");
      await expectJoinedPanel(canvasElement, input, listbox, { radius: "10px", invalid: true });
      // Widened to 32rem (no container here: the viewport caps), centred.
      const open = input.getBoundingClientRect();
      const expected = grownWidth(32 * remPx(), window.innerWidth, closed.width);
      await expect(Math.abs(open.width - expected)).toBeLessThan(0.5);
      await expect(open.width).toBeGreaterThan(closed.width + 1);
      await expect(Math.abs(centre(open) - centre(closed))).toBeLessThan(0.5);

      // A palette width wider than the viewport: capped at the viewport minus
      // both 24px gutters (no inline-size container around this story).
      const column = canvas.getByTestId("invalid-column");
      column.style.setProperty("--combobox-open-width", "200rem");
      try {
        await waitFor(() =>
          expect(Math.abs(input.getBoundingClientRect().width - (window.innerWidth - 2 * GUTTER))).toBeLessThan(0.5),
        );
        await expect(Math.abs(centre(input.getBoundingClientRect()) - centre(closed))).toBeLessThan(0.5);
      } finally {
        column.style.removeProperty("--combobox-open-width");
      }

      // Nothing matches and there is no ComboboxEmpty: no list part, no
      // divider — the footer alone does not keep the list part open.
      const panel = panelOf(listbox);
      await userEvent.type(input, "zzz");
      const panelBody = panel.querySelector('[data-slot="combobox-panel-body"]') as HTMLElement;
      await waitFor(() => expect(getComputedStyle(panelBody).display).toBe("none"));
      await expect(
        Math.abs(panel.getBoundingClientRect().height - input.getBoundingClientRect().height),
      ).toBeLessThan(0.5);
    });
  },
};
