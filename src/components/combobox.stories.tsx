import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import {
  FileText,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  Search,
  Settings,
} from "lucide-react";
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
import { Kbd, KbdGroup } from "./kbd";
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

/* ------------------------------------------------------------------------ */
/* layout="panel": field and list as one surface                            */
/* ------------------------------------------------------------------------ */

/*
 * Oracle for the panel stories: the browser's layout boxes and computed
 * styles, compared with values taken from outside the component —
 * `tokens.css` literals (rounded Style: `--radius-action` 0.5rem = 8px; pill
 * Style: `--radius-2xl` 1.5rem = 24px; `--radius-field` 0.5rem = 8px), and
 * token colours / shadows resolved by the browser on a probe element. Nothing
 * is read back from the component's own class strings or state.
 */

const RECENT_CHATS = [
  { title: "Semesterplanung WS 26/27", when: "Heute" },
  { title: "Fragen zur Prüfungsordnung", when: "Gestern" },
  { title: "Modulwahl Informatik", when: "12. Okt." },
];

/**
 * JustRAG's workspace search (`WorkspaceSearch` → `GlobalSearch`) with the
 * list in the same panel as the field: focusing the empty field opens the
 * command-palette defaults — Chat / Letzte Unterhaltungen / Konto — and
 * typing filters them. Palette rows: a muted `description`, a right-aligned
 * `shortcutHint`.
 */
function PaletteSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("—");
  // As JustRAG: the empty field opens on focus and on a click (after Escape).
  const openDefaults = () => {
    if (!open) setOpen(true);
  };
  return (
    <>
      <Combobox layout="panel" open={open} onOpenChange={setOpen}>
        <ComboboxInput
          aria-label="In „Prüfungsordnung“ suchen"
          aria-keyshortcuts="Meta+K"
          placeholder="In „Prüfungsordnung“ suchen …"
          leadingIcon={<Search />}
          shortcutHint={
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          }
          value={query}
          onValueChange={setQuery}
          onFocus={openDefaults}
          onClick={openDefaults}
        />
        <ComboboxContent>
          <ComboboxEmpty>Keine Treffer für „{query.trim()}“</ComboboxEmpty>
          <ComboboxList label="Suchergebnisse">
            <ComboboxGroup heading="Chat">
              <ComboboxItem
                onSelect={setSelected}
                shortcutHint={
                  <KbdGroup>
                    <Kbd>⌘</Kbd>
                    <Kbd>⇧</Kbd>
                    <Kbd>O</Kbd>
                  </KbdGroup>
                }
              >
                <MessageSquarePlus aria-hidden="true" />
                Neuer Chat
              </ComboboxItem>
            </ComboboxGroup>
            <ComboboxGroup heading="Letzte Unterhaltungen">
              {RECENT_CHATS.map((chat) => (
                <ComboboxItem key={chat.title} onSelect={setSelected} description={chat.when}>
                  <MessageSquare aria-hidden="true" />
                  {chat.title}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
            <ComboboxGroup heading="Konto">
              <ComboboxItem
                onSelect={setSelected}
                shortcutHint={
                  <KbdGroup>
                    <Kbd>⌘</Kbd>
                    <Kbd>,</Kbd>
                  </KbdGroup>
                }
              >
                <Settings aria-hidden="true" />
                Einstellungen
              </ComboboxItem>
              <ComboboxItem onSelect={setSelected}>
                <LogOut aria-hidden="true" />
                Abmelden
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <span className="sr-only" data-testid="selected">
        {selected}
      </span>
    </>
  );
}

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
 * The joined geometry, read from the open panel: one portalled `z-50`
 * element whose box starts on the field's top edge, exactly the field's
 * width; the field has no border, ring or shadow of its own, square bottom
 * corners and the panel's top radius; one divider on the field's bottom
 * border row; one outer radius; one shadow (`--shadow-overlay`) plus the focus
 * ring; and the field under the panel's top still gets the pointer.
 */
async function expectJoinedPanel(
  canvasElement: HTMLElement,
  field: HTMLElement,
  listbox: HTMLElement,
  { radius, frame = field }: { radius: string; frame?: HTMLElement },
) {
  const panel = listbox.closest<HTMLElement>('[data-layout="panel"]');
  await expect(panel).not.toBeNull();
  if (!panel) return;
  const body = panel.querySelector<HTMLElement>('[data-slot="combobox-panel-body"]');
  if (!body) throw new Error("panel body missing");

  // Portalled and on top, as in popover layout.
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
  const panelStyle = getComputedStyle(panel);
  const frameStyle = getComputedStyle(frame);
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    await expect(panelStyle[`border${side}Width`]).toBe("1px");
    await expect(panelStyle[`border${side}Color`]).toBe(resolvedColor(canvasElement, "var(--color-primary)"));
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
  const ring = resolvedColor(canvasElement, "var(--color-focus-ring)");
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

/** The JustRAG case end to end, for one Style: geometry, palette rows, keyboard contract. */
async function playPaletteSearch({
  canvas,
  canvasElement,
  userEvent,
  radius,
}: {
  canvas: ReturnType<typeof within>;
  canvasElement: HTMLElement;
  userEvent: { click: (el: Element) => Promise<void>; keyboard: (text: string) => Promise<void>; type: (el: Element, text: string) => Promise<void>; clear: (el: Element) => Promise<void> };
  radius: string;
}) {
  const body = page(canvasElement);
  const input = canvas.getByRole("combobox", { name: "In „Prüfungsordnung“ suchen" });
  await expect(input).toHaveAttribute("aria-expanded", "false");

  // Focus opens the defaults (the consumer's onFocus still runs).
  await userEvent.click(input);
  const listbox = await body.findByRole("listbox", { name: "Suchergebnisse" });
  await expect(input).toHaveAttribute("aria-expanded", "true");
  await expect(input).toHaveAttribute("aria-controls", listbox.id);
  await expect(body.getByRole("group", { name: "Chat" })).toBeVisible();
  await expect(body.getByRole("group", { name: "Letzte Unterhaltungen" })).toBeVisible();
  await expect(body.getByRole("group", { name: "Konto" })).toBeVisible();
  await expectJoinedPanel(canvasElement, input, listbox, { radius });

  // Palette rows: the description is muted text next to the label, part of
  // the name; the shortcut sits at the trailing edge, hidden from AT; a Kbd
  // on the highlighted row steps up one surface.
  const options = within(listbox).getAllByRole("option");
  const newChat = options[0];
  await waitFor(() => expect(activeOption(input)).toBe(newChat));
  await expect(newChat).toHaveAccessibleName("Neuer Chat");
  const recent = within(listbox).getByRole("option", { name: /Semesterplanung WS 26\/27/ });
  await expect(recent).toHaveAccessibleName("Semesterplanung WS 26/27 Heute");
  const description = recent.querySelector<HTMLElement>('[data-slot="combobox-item-description"]');
  await expect(getComputedStyle(description as HTMLElement).color).toBe(
    resolvedColor(canvasElement, "var(--color-on-surface-variant)"),
  );
  const shortcut = newChat.querySelector<HTMLElement>('[data-slot="combobox-item-shortcut"]');
  await expect(shortcut).toHaveAttribute("aria-hidden", "true");
  const rowBox = newChat.getBoundingClientRect();
  const rowPaddingRight = parseFloat(getComputedStyle(newChat).paddingRight);
  await expect(Math.abs((shortcut as HTMLElement).getBoundingClientRect().right - (rowBox.right - rowPaddingRight))).toBeLessThan(0.5);
  const kbdOf = (row: HTMLElement) => row.querySelector('[data-slot="kbd"]') as HTMLElement;
  await expect(getComputedStyle(kbdOf(newChat)).backgroundColor).toBe(
    resolvedStyle(canvasElement, "backgroundColor", "var(--color-surface-container-highest)"),
  );
  const settings = within(listbox).getByRole("option", { name: "Einstellungen" });
  await expect(getComputedStyle(kbdOf(settings)).backgroundColor).toBe(
    resolvedStyle(canvasElement, "backgroundColor", "var(--color-surface-container-high)"),
  );

  // Keyboard contract, unchanged: ↓/↑ move the highlight as aria-activedescendant, focus stays.
  await userEvent.keyboard("{ArrowDown}");
  await expect(activeOption(input)).toBe(options[1]);
  await userEvent.keyboard("{ArrowUp}{ArrowUp}");
  await expect(activeOption(input)).toBe(options[options.length - 1]); // wrapped
  await expect(document.activeElement).toBe(input);

  // Typing filters; Enter selects — the value is the label, not label + description.
  await userEvent.type(input, "modul");
  await waitFor(() => expect(within(listbox).getAllByRole("option")).toHaveLength(1));
  await waitFor(() => expect(activeOption(input)).toHaveAccessibleName(/Modulwahl Informatik/));
  await expectJoinedPanel(canvasElement, input, listbox, { radius });
  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  await expect(canvas.getByTestId("selected")).toHaveTextContent("Modulwahl Informatik");
  await expect(canvas.getByTestId("selected")).not.toHaveTextContent("Okt");
  await expect(document.activeElement).toBe(input);

  // Closed again: the field's own focused frame is back.
  await settled(input);
  await expect(getComputedStyle(input).borderTopColor).toBe(resolvedColor(canvasElement, "var(--color-primary)"));
  await expect(getComputedStyle(input).borderBottomLeftRadius).not.toBe("0px");

  // Escape closes and keeps focus and text; a click into the field reopens.
  await userEvent.clear(input);
  await body.findByRole("listbox");
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await expect(document.activeElement).toBe(input);
  await userEvent.click(input);
  await body.findByRole("listbox");

  // An outside click closes it.
  await userEvent.click(canvas.getByText("Seiteninhalt"));
  await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  await expect(input).toHaveAttribute("aria-expanded", "false");
}

/**
 * **`layout="panel"`** — the JustRAG workspace search as a command palette
 * that grows out of the field: one border, one outer radius, one shadow, no
 * gap, a single divider between field and list. Closed it is the ordinary
 * search field. Still portalled (the 64px bar cannot clip it) and `z-50`.
 * Rows: leading icon, label, a muted `description`, a `Kbd` `shortcutHint`.
 */
export const SinglePanelSearch: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <AppShellFixture context="overview" search={<PaletteSearch />}>
      <div className="p-gutter text-on-surface-variant">Seiteninhalt</div>
    </AppShellFixture>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(document.documentElement.dataset.uiShape ?? "rounded").toBe("rounded");
    // Rounded Style: the field's radius, `--radius-action` 0.5rem.
    await playPaletteSearch({ canvas, canvasElement, userEvent, radius: "8px" });
  },
};

/**
 * The same panel in the pill Style and the dark theme: the capsule field's
 * panel takes the Style's box radius (24px), colours come from the dark
 * tokens.
 */
export const SinglePanelSearchPillDark: Story = {
  ...SinglePanelSearch,
  globals: { shape: "pill", theme: "dark" },
  play: async ({ canvas, canvasElement, userEvent }) => {
    // The story really runs pill + dark (the providers are the only writers).
    await waitFor(() => expect(document.documentElement.dataset.uiShape).toBe("pill"));
    await expect(document.documentElement.dataset.theme).toBe("dark");
    // Pill Style: `--radius-2xl` 1.5rem.
    await playPaletteSearch({ canvas, canvasElement, userEvent, radius: "24px" });
  },
};

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

/**
 * Closed, a `layout="panel"` field is the `layout="popover"` field: same
 * box, radius, border, surface and shadow — at rest, focused, and again after
 * the panel was open and closed.
 */
export const SinglePanelClosedMatchesField: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      {(["panel", "popover"] as const).map((layout) => (
        <Combobox key={layout} layout={layout}>
          <ComboboxInput aria-label={`Suchen (${layout})`} placeholder="Suchen …" leadingIcon={<Search />} />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxItem>Semesterplanung</ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const panelField = canvas.getByRole("combobox", { name: "Suchen (panel)" });
    const reference = canvas.getByRole("combobox", { name: "Suchen (popover)" });
    await expect(fieldLook(panelField)).toEqual(fieldLook(reference));

    await userEvent.click(reference);
    await settled(reference);
    const referenceFocused = fieldLook(reference);
    await userEvent.click(panelField);
    await settled(panelField);
    await expect(fieldLook(panelField)).toEqual(referenceFocused);

    await userEvent.keyboard("{ArrowDown}");
    await page(canvasElement).findByRole("listbox");
    await expect(panelField).toHaveAttribute("data-panel", "open");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page(canvasElement).queryByRole("listbox")).toBeNull());
    await expect(panelField).not.toHaveAttribute("data-panel");
    await settled(panelField);
    await expect(fieldLook(panelField)).toEqual(referenceFocused);
  },
};

/** Chips mode with `layout="panel"` — people with a username description per row. */
function PanelChips() {
  const [people, setPeople] = useState<Person[]>([DIRECTORY[0]]);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const suggestions = DIRECTORY.filter(
    (p) => !people.includes(p) && (q === "" || p.name.toLowerCase().includes(q)),
  );
  return (
    <div className="max-w-md">
      <Combobox layout="panel" shouldFilter={false}>
        <ComboboxChipsInput
          aria-label="Benutzernamen"
          chipsLabel="Ausgewählte Personen"
          value={query}
          onValueChange={setQuery}
          onRemoveLast={() => setPeople((current) => current.slice(0, -1))}
        >
          {people.map((p) => (
            <ComboboxChip
              key={p.username}
              label={p.name}
              leading={<Avatar size="xs" initials={p.initials} />}
              onRemove={() => setPeople((current) => current.filter((c) => c !== p))}
            />
          ))}
        </ComboboxChipsInput>
        <ComboboxContent>
          <ComboboxList label="Personen">
            {suggestions.map((p) => (
              <ComboboxItem
                key={p.username}
                value={p.username}
                description={p.username}
                onSelect={() => setPeople((current) => [...current, p])}
              >
                <Avatar size="xs" initials={p.initials} />
                {p.name}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

/**
 * Chips mode in `layout="panel"`: the same joined panel around the chips
 * frame, which keeps the field radius in every Style — here the pill Style,
 * where a `ComboboxInput` panel would take 24px.
 */
export const SinglePanelChips: Story = {
  globals: { shape: "pill" },
  render: () => <PanelChips />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await waitFor(() => expect(document.documentElement.dataset.uiShape).toBe("pill"));
    const input = canvas.getByRole("combobox", { name: "Benutzernamen" });
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowDown}");
    const listbox = await page(canvasElement).findByRole("listbox", { name: "Personen" });
    // `--radius-field` 0.5rem, also in the pill Style.
    await expectJoinedPanel(canvasElement, input, listbox, { radius: "8px", frame: chipsFrame(input) });
    await expect(document.activeElement).toBe(input);
  },
};

/**
 * The field's other states move to the panel too: with `aria-invalid` the
 * open panel's border is the error token (and its focus ring the error
 * ring), as on the closed field. And a panel with nothing to show — no
 * option, no `ComboboxEmpty` — has no list part and no divider: it is just
 * the framed field.
 */
export const SinglePanelInvalid: Story = {
  render: () => (
    <div className="max-w-md">
      <Combobox layout="panel">
        <ComboboxInput aria-label="Kürzel" aria-invalid leadingIcon={<Search />} />
        <ComboboxContent>
          <ComboboxList>
            {FACULTIES.map((name) => (
              <ComboboxItem key={name}>{name}</ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Kürzel" });
    await userEvent.type(input, "recht");
    const listbox = await page(canvasElement).findByRole("listbox");
    const panel = listbox.closest<HTMLElement>('[data-layout="panel"]') as HTMLElement;
    const error = resolvedColor(canvasElement, "var(--color-error)");
    await expect(getComputedStyle(panel).borderTopColor).toBe(error);
    await expect(getComputedStyle(panel).borderBottomColor).toBe(error);
    await expect(
      visibleShadowLayers(getComputedStyle(panel).boxShadow).some(
        (layer) => layer.startsWith(error) && layer.endsWith("0px 0px 0px 2px"),
      ),
    ).toBe(true);

    // Nothing matches and there is no ComboboxEmpty: no list part, no divider.
    await userEvent.type(input, "zzz");
    const body = panel.querySelector('[data-slot="combobox-panel-body"]') as HTMLElement;
    await waitFor(() => expect(getComputedStyle(body).display).toBe("none"));
    await expect(
      Math.abs(panel.getBoundingClientRect().height - input.getBoundingClientRect().height),
    ).toBeLessThan(0.5);
  },
};
