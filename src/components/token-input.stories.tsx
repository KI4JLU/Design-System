import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { TokenInput, TokenInputChip } from "./token-input";
import { ComboboxItem, ComboboxList } from "./combobox";
import { Avatar } from "./avatar";
import { Input } from "./input";
import { Label } from "./label";
import {
  activeOption,
  expectJoinedPanel,
  page,
  resolvedColor,
  resolvedStyle,
} from "../test/fixtures/combobox-panel";
import { contrastRatio, realHover, realUnhover } from "../test/fixtures/real-pointer";

/*
 * Oracle for every play function below: the DOM as the browser and assistive
 * technology see it — `document.activeElement`, ARIA attributes, roles and
 * accessible names, layout boxes, `elementFromPoint` — never component state.
 * Geometry and colours are compared with values taken from outside the
 * component: `tokens.css` literals (`--radius-field` 10px), token colours / shadows resolved by the browser on a probe element,
 * and the boxes of a plain framed `Input` rendered next to the field.
 * Nothing is read back from the component's own class strings or state. The
 * list is portalled to <body>, so it is queried there, not in the canvas.
 */

const meta = {
  title: "Components/TokenInput",
  component: TokenInput,
  // Stricter than the repo-wide `todo`, as for `Combobox`: the ARIA wiring
  // is the point, so an axe violation in any story's end state fails the test.
  parameters: { a11y: { test: "error" } },
} satisfies Meta<typeof TokenInput>;

export default meta;
type Story = StoryObj<typeof meta>;

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
      <TokenInput
        shouldFilter={false}
        open={open && suggestions.length > 0}
        onOpenChange={setOpen}
        aria-labelledby="members-label"
        aria-invalid={invalid || undefined}
        chipsLabel="Ausgewählte Personen"
        placeholder={members.length > 0 ? undefined : "Benutzername oder E-Mail …"}
        value={query}
        onValueChange={setQuery}
        onCommit={(values) => add(values.map(resolveMember))}
        onRemoveLast={() => setMembers((current) => current.slice(0, -1))}
        suggestions={
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
        }
      >
        {members.map((member) => (
          <TokenInputChip
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
      </TokenInput>
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
  input.closest('[data-slot="token-input"]') as HTMLElement;

/**
 * `TokenInput` + `TokenInputChip` as the add-members dialog uses it:
 * Tab takes the highlighted suggestion, Enter commits typed text (resolved by the consumer into a person or a pending invitation), a
 * paste of several names commits each, Backspace removes the last chip, ×
 * removes one and returns focus to the field. The frame wraps onto new lines
 * and is as tall as a framed `Input` while it holds one row; open, the
 * suggestions join it in one panel, as on `Combobox`. It never widens: the
 * open frame keeps its width — the case of JustRAG's members dialog.
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
    await expectJoinedPanel(canvasElement, input, listbox, { radius: "10px", frame });
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
 * The remove × is a delete action, so it is red in every tone — on the
 * neutral person chip, the warning chip and the error chip alike — and fills
 * red on hover (`error` with `on-error`), which stands out on every chip
 * background, the error chip's own container included.
 */
export const RemoveIsRed: Story = {
  render: () => <AddMembers initial={["amueller", "neu.person", "max mustermann"]} />,
  // ORACLE: the browser — each × button's computed colours against
  // `--color-error` / `--color-on-error` resolved on probe elements, and the
  // WCAG contrast of the hover fill against the chip's own computed
  // background (≥ 3:1, the non-text minimum); never the class strings. The
  // hover is the real Playwright pointer (`realHover`), so `:hover` applies;
  // in the Storybook UI, outside the Vitest runner, the hover step is skipped.
  play: async ({ canvas, canvasElement, step }) => {
    const error = resolvedColor(canvasElement, "var(--color-error)");
    const errorFill = resolvedStyle(canvasElement, "backgroundColor", "var(--color-error)");
    const onError = resolvedColor(canvasElement, "var(--color-on-error)");
    for (const label of ["Anna Müller", "neu.person", "max mustermann"]) {
      await step(`${label}: red at rest, filled red on hover`, async () => {
        const remove = canvas.getByRole("button", { name: `${label} entfernen` });
        await expect(getComputedStyle(remove).color).toBe(error);
        if (!(await realHover(remove))) return;
        await expect(getComputedStyle(remove).backgroundColor).toBe(errorFill);
        await expect(getComputedStyle(remove).color).toBe(onError);
        const chip = remove.closest("li")!;
        await expect(
          contrastRatio(getComputedStyle(remove).backgroundColor, getComputedStyle(chip).backgroundColor),
        ).toBeGreaterThanOrEqual(3);
        await realUnhover(remove);
      });
    }
  },
};

/** The same in the dark theme, where every chip and the error token change. */
export const RemoveIsRedDark: Story = {
  ...RemoveIsRed,
  globals: { theme: "dark" },
  play: async (context) => {
    // The story really runs dark (`ThemeProvider` is the only writer of `<html data-theme>`).
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await RemoveIsRed.play!(context);
  },
};

/**
 * `aria-invalid` turns the frame's border to the error token, like `Input` —
 * closed on the frame, open on the panel (whose focus ring becomes the error
 * ring). The frame and its panel keep the field radius (10px) — a field
 * that grows to several lines cannot be a capsule.
 *
 * **No growth.** The column sets both palette widths of `Combobox`
 * (`--combobox-open-width: 32rem` and, for one step, `--combobox-width:
 * 16rem`): the field ignores them. Closed it is the column's width (as wide
 * as the plain `Input` below it), with four chips wrapping onto several
 * lines; open it keeps exactly its closed box, and the `Input` below it does
 * not move.
 */
export const Invalid: Story = {
  render: () => (
    <div data-testid="invalid-column" className="mx-auto max-w-md [--combobox-open-width:32rem]">
      {/* Four chips: they wrap onto several lines at the column's width. */}
      <AddMembers invalid initial={["amueller", "cweber", "dkoch", "neu.person"]} />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const body = page(canvasElement);
    const error = resolvedColor(canvasElement, "var(--color-error)");
    const input = canvas.getByRole("combobox", { name: "Benutzernamen" });
    const frame = chipsFrame(input);
    const below = canvas.getByRole("textbox", { name: "Nachricht" });
    const boxOf = (el: HTMLElement) => {
      const box = el.getBoundingClientRect();
      return [box.left, box.top, box.width, box.height];
    };

    await step("Closed: the frame carries the error border", async () => {
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(getComputedStyle(frame).borderTopColor).toBe(error);
    });

    await step("10px, and the palette widths do not apply", async () => {
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

        await userEvent.type(input, "sch");
        const listbox = await body.findByRole("listbox", { name: "Personen" });
        await waitFor(() => expect(activeOption(input)).not.toBeNull());
        // `--radius-field`, 10px.
        await expectJoinedPanel(canvasElement, input, listbox, {
          radius: "10px",
          frame,
          invalid: true,
        });
        // Open: exactly the closed box, and nothing below it moved.
        await expect(boxOf(frame)).toEqual(closedFrame);
        await expect(boxOf(below)).toEqual(closedBelow);
        await expect(document.activeElement).toBe(input);

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
