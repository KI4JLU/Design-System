import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { List, Search, Settings } from "lucide-react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxFooter,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
} from "./combobox";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { Input } from "./input";
import { Kbd, KbdGroup } from "./kbd";
import { Label } from "./label";
import { AppShellFixture } from "../test/fixtures/app-shell";

/*
 * Oracle for every play function below: the DOM as the browser and assistive
 * technology see it — `document.activeElement`, ARIA attributes, roles and
 * accessible names, layout boxes, `elementFromPoint` — never component state.
 * Geometry and colours are compared with values taken from outside the
 * component: `tokens.css` literals (rounded Style: `--radius-action` and
 * `--radius-field` 0.5rem = 8px; pill Style: `--radius-2xl` 1.5rem = 24px)
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

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/** The option `aria-activedescendant` points at, resolved through the DOM. */
const activeOption = (input: HTMLElement) => {
  const id = input.getAttribute("aria-activedescendant");
  return id ? input.ownerDocument.getElementById(id) : null;
};

/* ------------------------------------------------------------------------ */
/* Probes and the joined-panel geometry, shared by every story              */
/* ------------------------------------------------------------------------ */

/** `color` of a probe painted with `value` — the token, resolved by the browser. */
const resolvedColor = (host: HTMLElement, value: string) => {
  const probe = host.ownerDocument.createElement("span");
  probe.style.color = value;
  host.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

/** `background` / `box-shadow` of a probe styled with `value` — the token, resolved by the browser. */
const resolvedStyle = (host: HTMLElement, property: "backgroundColor" | "boxShadow", value: string) => {
  const probe = host.ownerDocument.createElement("div");
  probe.style[property] = value;
  host.ownerDocument.body.append(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
};

/**
 * The layers of a computed `box-shadow` that paint anything: a layer is
 * invisible when its colour is fully transparent or all four lengths are 0
 * (Tailwind's empty `0 0 #0000` ring/shadow slots).
 */
const visibleShadowLayers = (boxShadow: string) =>
  [
    ...boxShadow.matchAll(
      /((?:rgba?|oklch|oklab|color)\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/g,
    ),
  ]
    .filter(([, color, ...lengths]) => {
      const transparent = /^rgba\(.*,\s*0\)$/.test(color);
      return !transparent && lengths.some((n) => parseFloat(n) !== 0);
    })
    .map(([layer]) => layer);

const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** 1rem in px, as the browser resolves it. */
const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

/** `tokens.css`: `--spacing-gutter: 24px`. */
const GUTTER = 24;

/** An element's content box (inside border and padding), from its box and computed style. */
const contentBox = (el: HTMLElement) => {
  const box = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const left = box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
  const right = box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
  return { left, right, width: right - left };
};

const centre = (box: { left: number; right: number }) => (box.left + box.right) / 2;

/**
 * The open field's stated width: the requested palette width, capped by the
 * nearest container's content width and by the viewport minus both gutters —
 * never narrower than the closed field.
 */
const grownWidth = (requestedPx: number, containerWidth: number, closedWidth: number) =>
  Math.max(closedWidth, Math.min(requestedPx, containerWidth, window.innerWidth - 2 * GUTTER));

/** Waits for running CSS transitions on `el` (the field animates its border and radius back on close). */
const settled = async (el: Element) => {
  await Promise.all(el.getAnimations().map((animation) => animation.finished));
};

const corners = (style: CSSStyleDeclaration) => [
  style.borderTopLeftRadius,
  style.borderTopRightRadius,
  style.borderBottomRightRadius,
  style.borderBottomLeftRadius,
];

/**
 * A field's frame as the browser draws it: box, the four radii, border
 * colour and width, background, shadow (incl. the focus ring) and padding.
 */
const fieldLook = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  return {
    height: box.height,
    width: box.width,
    radius: corners(style),
    borderColor: [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor],
    borderWidth: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
    background: style.backgroundColor,
    boxShadow: style.boxShadow,
    padding: style.padding,
  };
};

/** The portalled panel element that holds `listbox`. */
const panelOf = (listbox: HTMLElement) => {
  const panel = listbox.closest<HTMLElement>('[data-slot="combobox-content"]');
  if (!panel) throw new Error("panel missing");
  return panel;
};

/**
 * The joined geometry, read from the open panel: one portalled `z-50`
 * element whose box starts on the field's top edge, exactly the field's
 * width; the field has no border, ring or shadow of its own, square bottom
 * corners and the panel's top radius; one divider on the field's bottom
 * border row; one outer radius; one shadow (`--shadow-overlay`) plus the
 * focus ring — `primary` border and `focus-ring` ring, or `error` for both
 * with `aria-invalid`; and the field under the panel's top still gets the
 * pointer.
 */
async function expectJoinedPanel(
  canvasElement: HTMLElement,
  field: HTMLElement,
  listbox: HTMLElement,
  {
    radius,
    frame = field,
    invalid = false,
  }: { radius: string; frame?: HTMLElement; invalid?: boolean },
) {
  const panel = panelOf(listbox);
  const body = panel.querySelector<HTMLElement>('[data-slot="combobox-panel-body"]');
  if (!body) throw new Error("panel body missing");

  // Portalled and on top.
  await expect(canvasElement.contains(panel)).toBe(false);
  await expect(getComputedStyle(panel).zIndex).toBe("50");

  // One box: the panel starts on the field's top edge, exactly as wide.
  const fieldBox = frame.getBoundingClientRect();
  const panelBox = panel.getBoundingClientRect();
  await expect(Math.abs(panelBox.top - fieldBox.top)).toBeLessThan(0.5);
  await expect(Math.abs(panelBox.left - fieldBox.left)).toBeLessThan(0.5);
  await expect(Math.abs(panelBox.width - fieldBox.width)).toBeLessThan(0.5);
  await expect(panelBox.bottom).toBeGreaterThan(fieldBox.bottom);
  // No gap: the divider (the list's 1px top border) is the field's bottom
  // border row — its last pixel row — and the list starts right under it.
  const bodyBox = body.getBoundingClientRect();
  await expect(Math.abs(bodyBox.top + 1 - fieldBox.bottom)).toBeLessThan(0.5);
  const bodyStyle = getComputedStyle(body);
  await expect(bodyStyle.borderTopWidth).toBe("1px");
  await expect(bodyStyle.borderTopColor).toBe(resolvedColor(canvasElement, "var(--color-outline-variant)"));
  await expect(bodyStyle.backgroundColor).toBe(
    resolvedStyle(canvasElement, "backgroundColor", "var(--color-surface-container-lowest)"),
  );

  // One border: the panel's, in the focused field's colour; the field's own is gone.
  const border = resolvedColor(canvasElement, invalid ? "var(--color-error)" : "var(--color-primary)");
  const panelStyle = getComputedStyle(panel);
  const frameStyle = getComputedStyle(frame);
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    await expect(panelStyle[`border${side}Width`]).toBe("1px");
    await expect(panelStyle[`border${side}Color`]).toBe(border);
    await expect(frameStyle[`border${side}Color`]).toBe(TRANSPARENT);
  }

  // One outer radius on the panel; the field's top corners follow it, its bottom ones are square.
  await expect(corners(panelStyle)).toEqual([radius, radius, radius, radius]);
  await expect(corners(frameStyle)).toEqual([radius, radius, "0px", "0px"]);

  // One shadow: the overlay elevation and the focus ring on the panel, nothing on the field.
  await expect(visibleShadowLayers(frameStyle.boxShadow)).toEqual([]);
  const panelLayers = visibleShadowLayers(panelStyle.boxShadow);
  for (const layer of visibleShadowLayers(
    resolvedStyle(canvasElement, "boxShadow", "var(--shadow-overlay)"),
  )) {
    await expect(panelLayers).toContain(layer);
  }
  const ring = resolvedColor(canvasElement, invalid ? "var(--color-error)" : "var(--color-focus-ring)");
  await expect(panelLayers.some((layer) => layer.startsWith(ring) && layer.endsWith("0px 0px 0px 2px"))).toBe(true);

  // The panel's top is a window: the pointer reaches the field, and the options.
  const hit = document.elementFromPoint(fieldBox.left + fieldBox.width / 2, fieldBox.top + fieldBox.height / 2);
  await expect(frame.contains(hit)).toBe(true);
  const firstOption = within(listbox).getAllByRole("option")[0].getBoundingClientRect();
  const optionHit = document.elementFromPoint(
    firstOption.left + firstOption.width / 2,
    firstOption.top + firstOption.height / 2,
  );
  await expect(within(listbox).getAllByRole("option")[0].contains(optionHit)).toBe(true);

  // Radix's role="dialog" stays removed.
  await expect(within(canvasElement.ownerDocument.body).queryByRole("dialog")).toBeNull();
}

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
 * - **Closed:** a framed field, in a bar that stays 64px open or closed
 *   (JustRAG's `Toast.css` `top: 76px` = 64 + 12 depends on it); 24rem wide
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

    await step("Closed: an ordinary framed field in the 64px bar", async () => {
      await expect(document.documentElement.dataset.uiShape ?? "rounded").toBe("rounded");
      await expect(barHeight()).toBe("64px");
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await expect(input).not.toHaveAttribute("data-panel");
      const style = getComputedStyle(input);
      await expect(corners(style)).toEqual(["8px", "8px", "8px", "8px"]);
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
      // Rounded Style: the field's radius, `--radius-action` 0.5rem.
      await expectJoinedPanel(canvasElement, input, listbox, { radius: "8px" });
      await expect(barHeight()).toBe("64px");

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
      await expect(style.borderTopColor).toBe(resolvedColor(canvasElement, "var(--color-primary)"));
      await expect(corners(style)).toEqual(["8px", "8px", "8px", "8px"]);
      await expect(barHeight()).toBe("64px");
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
        await expect(barHeight()).toBe("64px");
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

/* ------------------------------------------------------------------------ */
/* Chips mode: several values in one field                                  */
/* ------------------------------------------------------------------------ */

interface Person {
  username: string;
  name: string;
  initials: string;
}

const DIRECTORY: Person[] = [
  { username: "amueller", name: "Anna Müller", initials: "AM" },
  { username: "bschmidt", name: "Ben Schmidt", initials: "BS" },
  { username: "cweber", name: "Clara Weber", initials: "CW" },
  { username: "dkoch", name: "David Koch", initials: "DK" },
];

interface Member {
  key: string;
  label: string;
  person?: Person;
  invalid?: boolean;
}

/**
 * The consumer's resolution step (JustRAG's job, not the component's): a
 * known username becomes the person, a well-formed unknown one a pending
 * invitation, anything else an error.
 */
function resolveMember(text: string): Member {
  const key = text.toLowerCase();
  const person = DIRECTORY.find((p) => p.username === key || p.name.toLowerCase() === key);
  if (person) return { key: person.username, label: person.name, person };
  if (/^[a-z0-9._-]+(@[a-z0-9.-]+)?$/i.test(text)) return { key, label: text };
  return { key, label: text, invalid: true };
}

/**
 * JustRAG's "Mitglieder hinzufügen" field: people as chips (Avatar + name),
 * a warning chip for a username without an account (invited as pending), an
 * error chip for one that cannot be valid, and suggestions under the field
 * that Tab adds. A plain framed `Input` sits below for comparison.
 */
function AddMembers({
  invalid = false,
  initial = ["amueller"],
}: {
  invalid?: boolean;
  /** The chips the field starts with (typed text, resolved as on commit). */
  initial?: string[];
}) {
  const [members, setMembers] = useState<Member[]>(() => initial.map(resolveMember));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const add = (next: Member[]) =>
    setMembers((current) => [
      ...current,
      ...next.filter((n, i) => !current.some((m) => m.key === n.key) && next.findIndex((x) => x.key === n.key) === i),
    ]);
  const q = query.trim().toLowerCase();
  const suggestions = q
    ? DIRECTORY.filter(
        (p) =>
          !members.some((m) => m.key === p.username) &&
          (p.username.includes(q) || p.name.toLowerCase().includes(q)),
      )
    : [];

  return (
    <div className="flex max-w-md flex-col gap-2">
      <Label id="members-label">Benutzernamen</Label>
      <Combobox shouldFilter={false} open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <ComboboxChipsInput
          aria-labelledby="members-label"
          aria-invalid={invalid || undefined}
          chipsLabel="Ausgewählte Personen"
          placeholder={members.length > 0 ? undefined : "Benutzername oder E-Mail …"}
          value={query}
          onValueChange={setQuery}
          onCommit={(values) => add(values.map(resolveMember))}
          onRemoveLast={() => setMembers((current) => current.slice(0, -1))}
        >
          {members.map((member) => (
            <ComboboxChip
              key={member.key}
              label={member.label}
              leading={
                member.person ? <Avatar size="xs" initials={member.person.initials} /> : undefined
              }
              tone={member.person ? "default" : member.invalid ? "error" : "warning"}
              labels={{
                warning: "noch kein Konto, wird eingeladen",
                error: "kein gültiger Benutzername",
              }}
              onRemove={() =>
                setMembers((current) => current.filter((m) => m.key !== member.key))
              }
            />
          ))}
        </ComboboxChipsInput>
        <ComboboxContent>
          <ComboboxList label="Personen">
            {suggestions.map((person) => (
              <ComboboxItem
                key={person.username}
                value={person.username}
                onSelect={() => add([resolveMember(person.username)])}
              >
                <Avatar size="xs" initials={person.initials} />
                <span>{person.name}</span>
                <span className="text-on-surface-variant">{person.username}</span>
                <span aria-hidden="true" className="ml-auto text-xs text-on-surface-variant">
                  Tab zum Hinzufügen
                </span>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Input aria-label="Nachricht" placeholder="Nachricht (optional)" />
    </div>
  );
}

/** A chip's text as a screen reader gets it: aria-hidden parts (the avatar's initials) and the remove button left out. */
const spokenText = (el: HTMLElement) => {
  const copy = el.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[aria-hidden="true"], button').forEach((node) => node.remove());
  return copy.textContent;
};

const chipsFrame = (input: HTMLElement) =>
  input.closest('[data-slot="combobox-chips-input"]') as HTMLElement;

/**
 * Chips mode (`ComboboxChipsInput` + `ComboboxChip`) as the add-members
 * dialog uses it: Tab takes the highlighted suggestion, Enter commits typed
 * text (resolved by the consumer into a person or a pending invitation), a
 * paste of several names commits each, Backspace removes the last chip, ×
 * removes one and returns focus to the field. The frame wraps onto new lines
 * and is as tall as a framed `Input` while it holds one row; open, the
 * suggestions join it in one panel, as on `ComboboxInput`. The chips field
 * never widens (only `ComboboxInput` does): the open frame keeps its width —
 * the case of JustRAG's members dialog.
 */
export const Chips: Story = {
  render: () => <AddMembers />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Benutzernamen" });
    const frame = chipsFrame(input);
    const chips = () =>
      within(canvas.getByRole("list", { name: "Ausgewählte Personen" })).getAllByRole("listitem");
    const chipTexts = () => chips().map(spokenText);
    await expect(chipTexts()).toEqual(["Anna Müller"]);
    // One row: exactly as tall as the framed Input below it.
    const reference = canvas.getByRole("textbox", { name: "Nachricht" });
    await expect(frame.getBoundingClientRect().height).toBe(
      reference.getBoundingClientRect().height,
    );
    await expect(getComputedStyle(frame).borderTopColor).toBe(
      resolvedColor(canvasElement, "var(--color-outline-variant)"),
    );

    // Tab takes the highlighted suggestion; focus and the empty field stay.
    await userEvent.type(input, "sch");
    const listbox = await body.findByRole("listbox", { name: "Personen" });
    const ben = within(listbox).getByRole("option", { name: /Ben Schmidt/ });
    await waitFor(() => expect(activeOption(input)).toBe(ben));
    // The same joined panel around the chips frame (`--radius-field` 0.5rem).
    await expectJoinedPanel(canvasElement, input, listbox, { radius: "8px", frame });
    // No palette width set here: open, the frame is as wide as the Input below.
    await expect(Math.abs(frame.getBoundingClientRect().width - reference.getBoundingClientRect().width)).toBeLessThan(0.5);
    await expect(Math.abs(frame.getBoundingClientRect().left - reference.getBoundingClientRect().left)).toBeLessThan(0.5);
    await userEvent.tab();
    await expect(chipTexts()).toEqual(["Anna Müller", "Ben Schmidt"]);
    await expect(input).toHaveValue("");
    await expect(document.activeElement).toBe(input);
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());

    // Enter commits typed text the directory does not know: a warning chip,
    // tinted with the warning container token and carrying an icon.
    await userEvent.type(input, "neu.person{Enter}");
    await expect(chipTexts()).toEqual([
      "Anna Müller",
      "Ben Schmidt",
      "neu.person, noch kein Konto, wird eingeladen",
    ]);
    const pending = chips()[2];
    await expect(getComputedStyle(pending).backgroundColor).toBe(
      resolvedColor(canvasElement, "var(--color-warning-container)"),
    );
    await expect(pending.querySelector(":scope > svg")).not.toBeNull();

    // A paste of several names commits each part.
    await userEvent.paste("cweber, max mustermann\n");
    await expect(chipTexts()).toEqual([
      "Anna Müller",
      "Ben Schmidt",
      "neu.person, noch kein Konto, wird eingeladen",
      "Clara Weber",
      "max mustermann, kein gültiger Benutzername",
    ]);
    await expect(getComputedStyle(chips()[4]).backgroundColor).toBe(
      resolvedColor(canvasElement, "var(--color-error-container)"),
    );
    // It wrapped: chips on more than one row, every chip and the input
    // inside the frame, which grew past one row.
    const frameBox = frame.getBoundingClientRect();
    const tops = new Set(chips().map((li) => Math.round(li.getBoundingClientRect().top)));
    await expect(tops.size).toBeGreaterThan(1);
    await expect(frameBox.height).toBeGreaterThan(reference.getBoundingClientRect().height);
    for (const el of [...chips(), input]) {
      const box = el.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(frameBox.left);
      await expect(box.right).toBeLessThanOrEqual(frameBox.right);
      await expect(box.bottom).toBeLessThanOrEqual(frameBox.bottom);
    }

    // Backspace in the empty field removes the last chip.
    await userEvent.keyboard("{Backspace}");
    await expect(chips()).toHaveLength(4);
    await expect(chipTexts()[3]).toBe("Clara Weber");

    // × removes that chip and hands focus back to the field.
    await userEvent.click(canvas.getByRole("button", { name: "Anna Müller entfernen" }));
    await expect(chipTexts()).toEqual([
      "Ben Schmidt",
      "neu.person, noch kein Konto, wird eingeladen",
      "Clara Weber",
    ]);
    await expect(document.activeElement).toBe(input);
  },
};

/**
 * Both field kinds with `aria-invalid`: a `ComboboxInput` and a chips field
 * (four chips, wrapping onto several lines), plus a plain DS `Input` with
 * the same props as the reference the closed `ComboboxInput` must match.
 */
function InvalidFields() {
  return (
    // Centred, with a 32rem palette width: the ComboboxInput widens while
    // open, the chips field does not (the closed width is unset, so closed
    // both fill the column as before).
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
      {/* Four chips: they wrap onto several lines at the column's width. */}
      <AddMembers invalid initial={["amueller", "cweber", "dkoch", "neu.person"]} />
    </div>
  );
}

/**
 * `aria-invalid` turns the field's border to the error token, like `Input`
 * — closed on the field, open on the panel (whose focus ring becomes the
 * error ring). A panel with nothing to show — no option, no `ComboboxEmpty`
 * — has no list part and no divider: it is just the framed field.
 *
 * Runs in the pill Style, where the two field kinds' panels differ: a
 * `ComboboxInput` panel takes the Style's box radius (24px — a capsule
 * cannot frame a list), a `ComboboxChipsInput` panel keeps the field radius
 * (8px) as its frame does in every Style. `Default` and `Chips` show the
 * rounded Style (8px for both).
 *
 * Closed, the `ComboboxInput` is the ordinary framed field: a plain `Input`
 * with the same `leadingIcon` and `aria-invalid` is the reference, compared
 * at rest, focused, and after the panel was open and closed — the panel's
 * classes on the field may only act while it is open.
 *
 * The column sets `--combobox-open-width: 32rem` (no closed width): the
 * `ComboboxInput` widens to 32rem while open, centred on its closed box, in
 * the pill Style. The chips field ignores the palette widths — with the
 * open width set and a 16rem closed width added, it stays the column's
 * width, open and closed, and its wrapped chips and the field below it do
 * not move. The `ComboboxInput` panel also has a `ComboboxFooter`, which
 * alone does not keep the list part open when nothing matches.
 */
export const Invalid: Story = {
  globals: { shape: "pill" },
  render: () => <InvalidFields />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    // The story really runs pill (the provider is the only writer).
    await waitFor(() => expect(document.documentElement.dataset.uiShape).toBe("pill"));
    const body = page(canvasElement);
    const error = resolvedColor(canvasElement, "var(--color-error)");
    const input = canvas.getByRole("combobox", { name: "Kürzel" });
    const chipsInput = canvas.getByRole("combobox", { name: "Benutzernamen" });

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

    await step("Closed: both fields carry the error border", async () => {
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(chipsInput).toHaveAttribute("aria-invalid", "true");
      await expect(getComputedStyle(input).borderTopColor).toBe(error);
      await expect(getComputedStyle(chipsFrame(chipsInput)).borderTopColor).toBe(error);
    });

    await step("ComboboxInput: error border and ring on the panel, 24px in pill", async () => {
      const closed = input.getBoundingClientRect();
      await userEvent.type(input, "recht");
      const listbox = await body.findByRole("listbox");
      // Pill Style: `--radius-2xl` 1.5rem.
      await expectJoinedPanel(canvasElement, input, listbox, { radius: "24px", invalid: true });
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

    await step("Chips: 8px in pill, and the palette widths do not apply", async () => {
      const frame = chipsFrame(chipsInput);
      const below = canvas.getAllByRole("textbox", { name: "Nachricht" }).at(-1) as HTMLElement;
      const boxOf = (el: HTMLElement) => {
        const box = el.getBoundingClientRect();
        return [box.left, box.top, box.width, box.height];
      };
      // The column sets `--combobox-open-width: 32rem`; a closed width too, for this step.
      const column = canvas.getByTestId("invalid-column");
      column.style.setProperty("--combobox-width", "16rem");
      try {
        // Closed: as wide as the plain Input below it — the column's width,
        // not 16rem — and its chips wrap onto several lines.
        await expect(Math.abs(frame.getBoundingClientRect().width - below.getBoundingClientRect().width)).toBeLessThan(0.5);
        await expect(Math.abs(frame.getBoundingClientRect().left - below.getBoundingClientRect().left)).toBeLessThan(0.5);
        const lines = new Set(
          within(frame)
            .getAllByRole("listitem")
            .map((chip) => Math.round(chip.getBoundingClientRect().top)),
        ).size;
        await expect(lines).toBeGreaterThan(1);
        const closedFrame = boxOf(frame);
        const closedBelow = boxOf(below);

        await userEvent.type(chipsInput, "sch");
        const listbox = await body.findByRole("listbox", { name: "Personen" });
        await waitFor(() => expect(activeOption(chipsInput)).not.toBeNull());
        // `--radius-field` 0.5rem, also in the pill Style.
        await expectJoinedPanel(canvasElement, chipsInput, listbox, {
          radius: "8px",
          frame,
          invalid: true,
        });
        // Open: exactly the closed box, and nothing below it moved.
        await expect(boxOf(frame)).toEqual(closedFrame);
        await expect(boxOf(below)).toEqual(closedBelow);
        await expect(document.activeElement).toBe(chipsInput);

        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
        await expect(boxOf(frame)).toEqual(closedFrame);
        await expect(boxOf(below)).toEqual(closedBelow);
      } finally {
        column.style.removeProperty("--combobox-width");
      }
    });

  },
};
