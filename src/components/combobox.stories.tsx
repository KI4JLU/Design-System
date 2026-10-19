import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { List, Search } from "lucide-react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
} from "./combobox";
import { Avatar } from "./avatar";
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
      </ComboboxContent>
    </Combobox>
  );
}

function DefaultPage() {
  const [selected, setSelected] = useState("—");
  return (
    <AppShellFixture context="overview" search={<ClientCombobox onSelect={setSelected} />}>
      <p className="m-0 p-gutter text-on-surface-variant" data-testid="selected">
        Ausgewählt: {selected}
      </p>
    </AppShellFixture>
  );
}

/**
 * The Combobox: field and open list are ONE surface — one border, one outer
 * radius, one shadow, no gap, a single divider — like a command palette
 * growing out of the search field. Closed, it is the ordinary framed field.
 * Shown in the `AppShellLayout` search slot (the shared `overview`
 * fixture), where JustRAG's global search sits. The data is a demo, not
 * JustRAG's UI: JustRAG's search runs in server mode (`shouldFilter={false}`,
 * controlled `open`), while this story uses client filtering (the default);
 * the palette rows — the centres' abbreviations as `description`, the
 * „Alle Einrichtungen anzeigen" row with its `shortcutHint` — are made up to
 * exercise those props. The play function checks in one real-browser run:
 *
 * - **Closed:** a framed field, in a bar that stays 64px open or closed
 *   (JustRAG's `Toast.css` `top: 76px` = 64 + 12 depends on it).
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

    await step("Closed: an ordinary framed field in the 64px bar", async () => {
      await expect(document.documentElement.dataset.uiShape ?? "rounded").toBe("rounded");
      await expect(barHeight()).toBe("64px");
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await expect(input).not.toHaveAttribute("data-panel");
      const style = getComputedStyle(input);
      await expect(corners(style)).toEqual(["8px", "8px", "8px", "8px"]);
      await expect(style.borderTopWidth).toBe("1px");
      await expect(style.borderTopColor).toBe(resolvedColor(canvasElement, "var(--color-outline-variant)"));
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

    await step("Panel: one surface with the field, not clipped by the bar", async () => {
      await userEvent.type(input, "zentr");
      const listbox = await body.findByRole("listbox");
      await waitFor(() => expect(activeOption(input)).not.toBeNull());
      await expect(input).toHaveAttribute("data-panel", "open");
      // Rounded Style: the field's radius, `--radius-action` 0.5rem.
      await expectJoinedPanel(canvasElement, input, listbox, { radius: "8px" });
      await expect(barHeight()).toBe("64px");

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
      await userEvent.clear(input);
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
function AddMembers({ invalid = false }: { invalid?: boolean }) {
  const [members, setMembers] = useState<Member[]>([resolveMember("amueller")]);
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
 * suggestions join it in one panel, as on `ComboboxInput`.
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
 * Both field kinds with `aria-invalid`: a `ComboboxInput` and a chips field,
 * plus a plain DS `Input` with the same props as the reference the closed
 * `ComboboxInput` must match.
 */
function InvalidFields() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <Combobox>
        <ComboboxInput aria-label="Kürzel" aria-invalid leadingIcon={<Search />} />
        <ComboboxContent>
          <ComboboxList>
            {FACULTIES.map((name) => (
              <ComboboxItem key={name}>{name}</ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Input aria-label="Referenzfeld" aria-invalid leadingIcon={<Search />} />
      <AddMembers invalid />
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
      await userEvent.type(input, "recht");
      const listbox = await body.findByRole("listbox");
      // Pill Style: `--radius-2xl` 1.5rem.
      await expectJoinedPanel(canvasElement, input, listbox, { radius: "24px", invalid: true });

      // Nothing matches and there is no ComboboxEmpty: no list part, no divider.
      const panel = panelOf(listbox);
      await userEvent.type(input, "zzz");
      const panelBody = panel.querySelector('[data-slot="combobox-panel-body"]') as HTMLElement;
      await waitFor(() => expect(getComputedStyle(panelBody).display).toBe("none"));
      await expect(
        Math.abs(panel.getBoundingClientRect().height - input.getBoundingClientRect().height),
      ).toBeLessThan(0.5);
    });

    await step("Chips: the panel keeps the 8px field radius in pill", async () => {
      await userEvent.type(chipsInput, "sch");
      const listbox = await body.findByRole("listbox", { name: "Personen" });
      await waitFor(() => expect(activeOption(chipsInput)).not.toBeNull());
      // `--radius-field` 0.5rem, also in the pill Style.
      await expectJoinedPanel(canvasElement, chipsInput, listbox, {
        radius: "8px",
        frame: chipsFrame(chipsInput),
        invalid: true,
      });
      await expect(document.activeElement).toBe(chipsInput);
    });
  },
};
