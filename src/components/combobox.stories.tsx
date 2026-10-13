import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { FileText, MessageSquare, Search } from "lucide-react";
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
  ComboboxLoading,
  ComboboxSeparator,
} from "./combobox";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { AppShellFixture } from "../test/fixtures/app-shell";

/*
 * Oracle for every play function below: the DOM as the browser and assistive
 * technology see it — `document.activeElement`, ARIA attributes, roles and
 * accessible names, layout boxes, `elementFromPoint` — never component state.
 * The list is portalled to <body>, so it is queried there, not in the canvas.
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
/* Client-filtered                                                          */
/* ------------------------------------------------------------------------ */

const FACULTIES = [
  "01 Rechtswissenschaft",
  "02 Wirtschaftswissenschaften",
  "03 Sozial- und Kulturwissenschaften",
  "04 Geschichts- und Kulturwissenschaften",
  "05 Sprache, Literatur, Kultur",
];
const CENTRES = ["Hochschulrechenzentrum", "Universitätsbibliothek", "Zentrum für Medien und Interaktivität"];

function ClientCombobox() {
  const [selected, setSelected] = useState("—");
  return (
    <div className="flex max-w-md flex-col gap-4">
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
                <ComboboxItem key={name} onSelect={setSelected}>
                  {name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
            <ComboboxSeparator />
            <ComboboxGroup heading="Zentrale Einrichtungen">
              {CENTRES.map((name) => (
                <ComboboxItem key={name} onSelect={setSelected}>
                  {name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p className="m-0 text-sm text-on-surface-variant" data-testid="selected">
        Ausgewählt: {selected}
      </p>
      <p className="m-0 text-sm text-on-surface-variant">Außerhalb der Liste</p>
      <Button variant="outline">Weiter</Button>
    </div>
  );
}

/**
 * Client mode (default): cmdk filters and ranks the rendered items against
 * the text; groups without a match disappear, `ComboboxEmpty` shows when
 * nothing matches. Typing opens the list, and focus stays in the field.
 */
export const ClientFiltered: Story = {
  render: () => <ClientCombobox />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Einrichtung suchen" });
    await expect(input).toHaveAttribute("aria-expanded", "false");
    // The first keystroke opens the list AND highlights (and announces) its
    // first option, so Enter already has something to select.
    await userEvent.type(input, "w");
    await page(canvasElement).findByRole("listbox");
    await waitFor(() => expect(activeOption(input)).toHaveAttribute("aria-selected", "true"));
    await userEvent.type(input, "issen");
    const listbox = await page(canvasElement).findByRole("listbox");
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(input).toHaveAttribute("aria-controls", listbox.id);
    const names = within(listbox)
      .getAllByRole("option")
      .map((o) => o.textContent);
    await expect(names).toHaveLength(4);
    await expect(names.every((n) => n?.toLowerCase().includes("wissen"))).toBe(true);
    await expect(page(canvasElement).queryByRole("group", { name: "Zentrale Einrichtungen" })).toBeNull();
    // The auto-highlighted option is announced before any arrow key.
    await waitFor(() => expect(activeOption(input)).toHaveAttribute("aria-selected", "true"));
    await expect(document.activeElement).toBe(input);

    await userEvent.clear(input);
    await userEvent.type(input, "xyz");
    await expect(await page(canvasElement).findByText("Keine Treffer")).toBeVisible();
    await expect(within(listbox).queryAllByRole("option")).toHaveLength(0);
    // No options → no empty listbox in the accessibility tree.
    await waitFor(() => expect(listbox).not.toBeVisible());
  },
};

/**
 * ↓ opens a closed list; ↓/↑ move the highlight and wrap around (cmdk
 * `loop`); Home/End jump to the first/last option; Enter selects the
 * highlighted one and closes the list. Focus never leaves the field — the
 * highlight travels as `aria-activedescendant`.
 */
export const KeyboardNavigation: Story = {
  render: () => <ClientCombobox />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Einrichtung suchen" });
    await userEvent.click(input);
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{ArrowDown}");
    const listbox = await page(canvasElement).findByRole("listbox");
    await expect(input).toHaveAttribute("aria-expanded", "true");
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
    await expect(document.activeElement).toBe(input);

    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(page(canvasElement).queryByRole("listbox")).toBeNull());
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.getByTestId("selected")).toHaveTextContent(`Ausgewählt: ${FACULTIES[1]}`);
    await expect(document.activeElement).toBe(input);
  },
};

/** Escape closes the list and leaves both focus and text in the field. */
export const EscapeCloses: Story = {
  render: () => <ClientCombobox />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Einrichtung suchen" });
    await userEvent.type(input, "recht");
    await page(canvasElement).findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page(canvasElement).queryByRole("listbox")).toBeNull());
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).toHaveValue("recht");
    await expect(document.activeElement).toBe(input);
  },
};

/**
 * A click on an option selects it and closes the list — without the field
 * losing focus first (the list cancels its mousedown).
 */
export const ClickSelectKeepsFocus: Story = {
  render: () => <ClientCombobox />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Einrichtung suchen" });
    await userEvent.type(input, "bib");
    const option = await page(canvasElement).findByRole("option", {
      name: "Universitätsbibliothek",
    });
    let blurred = false;
    const onBlur = () => (blurred = true);
    input.addEventListener("blur", onBlur);
    await userEvent.click(option);
    input.removeEventListener("blur", onBlur);
    await waitFor(() => expect(page(canvasElement).queryByRole("listbox")).toBeNull());
    await expect(blurred).toBe(false);
    await expect(document.activeElement).toBe(input);
    await expect(canvas.getByTestId("selected")).toHaveTextContent(
      "Ausgewählt: Universitätsbibliothek",
    );
  },
};

/**
 * A click outside field and list closes it; a click into the field itself
 * does not.
 */
export const OutsideClickCloses: Story = {
  render: () => <ClientCombobox />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Einrichtung suchen" });
    await userEvent.type(input, "zentrum");
    await page(canvasElement).findByRole("listbox");
    await userEvent.click(input);
    await expect(page(canvasElement).getByRole("listbox")).toBeVisible();
    await userEvent.click(canvas.getByText("Außerhalb der Liste"));
    await waitFor(() => expect(page(canvasElement).queryByRole("listbox")).toBeNull());
    await expect(input).toHaveAttribute("aria-expanded", "false");
  },
};

/** Focus moving on to anything outside field and list closes it (Tab). */
export const BlurCloses: Story = {
  render: () => <ClientCombobox />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Einrichtung suchen" });
    await userEvent.type(input, "0");
    await page(canvasElement).findByRole("listbox");
    await userEvent.tab();
    await expect(document.activeElement).toBe(canvas.getByRole("button", { name: "Weiter" }));
    await waitFor(() => expect(page(canvasElement).queryByRole("listbox")).toBeNull());
    await expect(input).toHaveAttribute("aria-expanded", "false");
  },
};

/* ------------------------------------------------------------------------ */
/* Server mode                                                              */
/* ------------------------------------------------------------------------ */

type Results = { group: string; items: string[] }[];

const INDEX: Results = [
  { group: "Chats", items: ["Semesterplanung WS 26/27", "Fragen zur Prüfungsordnung", "Modulwahl Informatik"] },
  { group: "Dokumente", items: ["Modulhandbuch_Informatik.pdf", "Pruefungsordnung_2024.pdf", "Semesterplan.xlsx"] },
  { group: "Wissensbasen", items: ["Studienberatung", "Prüfungsamt"] },
];

/** A fake backend: substring match, answered after `delay` ms. */
function mockSearch(query: string, delay: number): Promise<Results> {
  const q = query.trim().toLowerCase();
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          INDEX.map(({ group, items }) => ({
            group,
            items: items.filter((item) => item.toLowerCase().includes(q)),
          })).filter(({ items }) => items.length > 0),
        ),
      delay,
    ),
  );
}

const MIN_QUERY = 2;

/**
 * The consumer's side of server mode, as JustRAG's global search needs it:
 * `shouldFilter={false}`, the list kept closed below `MIN_QUERY` characters
 * through the controlled `open`, loading and empty states, and — the part the
 * component cannot do for you — stale responses dropped by a request counter.
 */
function ServerSearch({ delay = 300 }: { delay?: number }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [selected, setSelected] = useState("—");
  const latest = useRef(0);

  const onQuery = (next: string) => {
    setQuery(next);
    const request = ++latest.current;
    if (next.trim().length < MIN_QUERY) {
      setLoading(false);
      setResults(null);
      return;
    }
    setLoading(true);
    void mockSearch(next, delay).then((found) => {
      if (request !== latest.current) return; // an older query answered late
      setResults(found);
      setLoading(false);
    });
  };

  return (
    <>
      <Combobox
        shouldFilter={false}
        open={open && query.trim().length >= MIN_QUERY}
        onOpenChange={setOpen}
      >
        <ComboboxInput
          aria-label="Suchen"
          placeholder="Chats, Dokumente, Wissensbasen …"
          leadingIcon={<Search />}
          value={query}
          onValueChange={onQuery}
        />
        <ComboboxContent>
          {loading ? <ComboboxLoading>Suche läuft …</ComboboxLoading> : null}
          {!loading && results ? (
            <ComboboxEmpty>Keine Treffer für „{query.trim()}“</ComboboxEmpty>
          ) : null}
          <ComboboxList>
            {!loading && results ? (
              <>
                {results.map(({ group, items }) => (
                  <ComboboxGroup key={group} heading={group}>
                    {items.map((item) => (
                      <ComboboxItem
                        key={item}
                        value={`${group}/${item}`}
                        onSelect={() => setSelected(item)}
                      >
                        {group === "Chats" ? <MessageSquare aria-hidden /> : <FileText aria-hidden />}
                        {item}
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                ))}
              </>
            ) : null}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <span className="sr-only" data-testid="selected">
        {selected}
      </span>
    </>
  );
}

/**
 * Server mode with grouped async results behind a mocked 300ms delay:
 * nothing opens below two characters, `ComboboxLoading` shows while the
 * request runs, groups arrive unfiltered by cmdk, and a query with no hits
 * shows `ComboboxEmpty`.
 */
export const ServerGroupedAsync: Story = {
  render: () => (
    <div className="max-w-md">
      <ServerSearch />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Suchen" });
    await userEvent.type(input, "p");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(body.queryByRole("listbox")).toBeNull();

    await userEvent.type(input, "r");
    await expect(await body.findByRole("progressbar", { name: "Wird geladen …" })).toBeVisible();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    const chats = await body.findByRole("group", { name: "Chats" });
    await expect(within(chats).getByRole("option")).toHaveTextContent("Fragen zur Prüfungsordnung");
    await expect(body.getByRole("group", { name: "Dokumente" })).toBeVisible();
    await expect(body.getByRole("group", { name: "Wissensbasen" })).toBeVisible();
    await expect(body.queryByRole("progressbar")).toBeNull();
    await expect(document.activeElement).toBe(input);

    await userEvent.type(input, "zzz");
    await expect(await body.findByText("Keine Treffer für „przzz“")).toBeVisible();
    await expect(body.queryAllByRole("option")).toHaveLength(0);
  },
};

/* ------------------------------------------------------------------------ */
/* In the AppShellLayout search slot                                        */
/* ------------------------------------------------------------------------ */

/**
 * The real consumer placement: server search in `AppShellLayout`'s `search`
 * slot. The bar stays **64px** open or closed (JustRAG's `Toast.css`
 * `top: 76px` = 64 + 12 depends on it), the list is portalled so the bar
 * cannot clip it, and focus stays in the field while ↓ moves the highlight.
 *
 * The shell is the shared story fixture's `overview` context
 * (`src/test/fixtures/app-shell.tsx`, the shell of every
 * `Templates/AppShellLayout` story) with `ServerSearch` in its `search` slot.
 * JustRAG's global search sits in that context, and this file builds no shell
 * of its own.
 */
export const InAppShellSearch: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <AppShellFixture context="overview" search={<ServerSearch />}>
      <div className="p-gutter text-on-surface-variant">Seiteninhalt</div>
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    const bar = canvasElement.querySelector("header") as HTMLElement;
    await expect(getComputedStyle(bar).height).toBe("64px");

    const input = canvas.getByRole("combobox", { name: "Suchen" });
    await userEvent.type(input, "ng");
    const listbox = await body.findByRole("listbox");
    await body.findAllByRole("option");
    await expect(getComputedStyle(bar).height).toBe("64px");

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

    // Focus stays in the field while ↓ moves the highlight.
    await waitFor(() => expect(activeOption(input)).toBe(options[0]));
    await userEvent.keyboard("{ArrowDown}");
    await expect(activeOption(input)).toBe(options[1]);
    await userEvent.keyboard("{ArrowDown}");
    await expect(activeOption(input)).toBe(options[2]);
    await expect(document.activeElement).toBe(input);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(getComputedStyle(bar).height).toBe("64px");
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

/** `color` of a probe painted with `value` — the token, resolved by the browser. */
const resolvedColor = (host: HTMLElement, value: string) => {
  const probe = host.ownerDocument.createElement("span");
  probe.style.color = value;
  host.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

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
 * and is as tall as a framed `Input` while it holds one row.
 */
export const ChipsAddMembers: Story = {
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

/** `aria-invalid` on the field turns the frame's border to the error token, like `Input`. */
export const ChipsInvalid: Story = {
  render: () => <AddMembers invalid />,
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole("combobox", { name: "Benutzernamen" });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(getComputedStyle(chipsFrame(input)).borderTopColor).toBe(
      resolvedColor(canvasElement, "var(--color-error)"),
    );
  },
};
