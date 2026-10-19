import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComboboxItem, ComboboxList } from "./combobox";
import {
  TokenInput,
  TokenInputChip,
  type TokenInputChipLabels,
  type TokenInputChipTone,
  type TokenInputProps,
} from "./token-input";

const option = (name: string) => screen.getByRole("option", { name });

/*
 * Oracle for every test in this file: the DOM as assistive technology sees it
 * (roles, accessible names, `document.activeElement`, whether a native event
 * was cancelled) and the fixture's own literals — the strings typed or pasted
 * and the call arguments a handler must therefore receive. The chips the
 * fixture renders come from its own state, which only changes through the
 * callbacks under test, so a chip appearing is the consumer-visible result of
 * a callback firing with the right value, not a read-back of component state.
 */

interface Chip {
  name: string;
  tone?: TokenInputChipTone;
}

function ChipsFixture({
  initial = [],
  suggestions = ["Anna Müller", "Ben Schmidt"],
  onCommit = () => {},
  onSelect = () => {},
  onRemoveLast = () => {},
  labels,
  ...props
}: Partial<Omit<TokenInputProps, "onCommit" | "onRemoveLast" | "suggestions">> & {
  initial?: Chip[];
  suggestions?: string[];
  onCommit?: (values: string[]) => void;
  onSelect?: (value: string) => void;
  onRemoveLast?: () => void;
  labels?: Partial<TokenInputChipLabels>;
}) {
  const [chips, setChips] = useState<Chip[]>(initial);
  return (
    <>
      <TokenInput
        aria-label="Benutzernamen"
        onCommit={(values) => {
          onCommit(values);
          setChips((c) => [...c, ...values.map((name) => ({ name }))]);
        }}
        onRemoveLast={() => {
          onRemoveLast();
          setChips((c) => c.slice(0, -1));
        }}
        suggestions={
          <ComboboxList>
            {suggestions.map((name) => (
              <ComboboxItem
                key={name}
                onSelect={(value) => {
                  onSelect(value);
                  setChips((c) => [...c, { name }]);
                }}
              >
                {name}
              </ComboboxItem>
            ))}
          </ComboboxList>
        }
        {...props}
      >
        {chips.map((chip) => (
          <TokenInputChip
            key={chip.name}
            label={chip.name}
            tone={chip.tone}
            labels={labels}
            onRemove={() => setChips((c) => c.filter((x) => x.name !== chip.name))}
          />
        ))}
      </TokenInput>
      <button type="button">Weiter</button>
    </>
  );
}

const chipsField = () => screen.getByRole("combobox", { name: "Benutzernamen" });
const chipTexts = () =>
  within(screen.getByRole("list", { name: "Ausgewählt" }))
    .getAllByRole("listitem")
    .map((li) => li.textContent);

describe("TokenInput", () => {
  it("renders the chips as a named list before a named, collapsed combobox", () => {
    render(<ChipsFixture initial={[{ name: "Anna Müller" }, { name: "Ben Schmidt" }]} />);
    const list = screen.getByRole("list", { name: "Ausgewählt" });
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Anna Müller",
      "Ben Schmidt",
    ]);
    const input = chipsField();
    // The list precedes the input in reading order.
    expect(list.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Same corrections to cmdk's input as ComboboxInput (the shared engine).
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-controls");
    expect(input).not.toHaveAttribute("aria-labelledby");
  });

  it("names the list via chipsLabel and renders no list without chips", () => {
    const { unmount } = render(
      <ChipsFixture initial={[{ name: "Anna Müller" }]} chipsLabel="Ausgewählte Personen" />,
    );
    expect(screen.getByRole("list", { name: "Ausgewählte Personen" })).toBeInTheDocument();
    unmount();
    render(<ChipsFixture />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("commits trimmed text on Enter, clears the field and never submits a form", async () => {
    const onCommit = vi.fn();
    render(<ChipsFixture onCommit={onCommit} suggestions={[]} />);
    const input = chipsField();
    await userEvent.type(input, "  max.muster ");
    // fireEvent returns false when a handler called preventDefault().
    expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(false);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(["max.muster"]);
    expect(input).toHaveValue("");
    expect(chipTexts()).toEqual(["max.muster"]);
    // Empty field: Enter is the text field's again (implicit submission).
    expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(true);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("commits on a comma, which is never typed itself", async () => {
    const onCommit = vi.fn();
    render(<ChipsFixture onCommit={onCommit} suggestions={[]} />);
    const input = chipsField();
    await userEvent.type(input, "a.b,c.d,");
    expect(onCommit.mock.calls).toEqual([[["a.b"]], [["c.d"]]]);
    expect(input).toHaveValue("");
    await userEvent.type(input, ",");
    expect(input).toHaveValue("");
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it("commits on Tab and keeps focus; on an empty field Tab moves on", async () => {
    const onCommit = vi.fn();
    render(<ChipsFixture onCommit={onCommit} suggestions={[]} />);
    const input = chipsField();
    await userEvent.type(input, "x.y");
    await userEvent.tab();
    expect(onCommit).toHaveBeenCalledWith(["x.y"]);
    expect(document.activeElement).toBe(input);
    expect(input).toHaveValue("");
    // The chip's remove button sits before the input; Weiter after it.
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Weiter" }));
  });

  it("Tab takes the highlighted suggestion while the list is open", async () => {
    const onCommit = vi.fn();
    const onSelect = vi.fn();
    render(<ChipsFixture onCommit={onCommit} onSelect={onSelect} />);
    const input = chipsField();
    await userEvent.type(input, "anna");
    await screen.findByRole("listbox");
    await waitFor(() =>
      expect(input).toHaveAttribute("aria-activedescendant", option("Anna Müller").id),
    );
    await userEvent.tab();
    expect(onSelect).toHaveBeenCalledWith("Anna Müller");
    expect(onCommit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    // An accepted suggestion spends the query, and the list closes.
    expect(input).toHaveValue("");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(chipTexts()).toEqual(["Anna Müller"]);
  });

  it("Tab takes the highlighted suggestion on an empty field too, keeping focus", async () => {
    const onCommit = vi.fn();
    const onSelect = vi.fn();
    render(<ChipsFixture onCommit={onCommit} onSelect={onSelect} />);
    const input = chipsField();
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    await waitFor(() =>
      expect(input).toHaveAttribute("aria-activedescendant", option("Anna Müller").id),
    );
    expect(input).toHaveValue("");
    await userEvent.tab();
    expect(onSelect).toHaveBeenCalledWith("Anna Müller");
    expect(onCommit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    expect(chipTexts()).toEqual(["Anna Müller"]);
  });

  it("Enter takes the highlighted suggestion while the list is open", async () => {
    const onCommit = vi.fn();
    const onSelect = vi.fn();
    render(<ChipsFixture onCommit={onCommit} onSelect={onSelect} />);
    const input = chipsField();
    await userEvent.type(input, "ben");
    await screen.findByRole("listbox");
    await waitFor(() =>
      expect(input).toHaveAttribute("aria-activedescendant", option("Ben Schmidt").id),
    );
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("Ben Schmidt");
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue("");
    expect(chipTexts()).toEqual(["Ben Schmidt"]);
  });

  it("Backspace in the empty field removes the last chip, not while text is typed", async () => {
    const onRemoveLast = vi.fn();
    render(
      <ChipsFixture
        onRemoveLast={onRemoveLast}
        suggestions={[]}
        initial={[{ name: "Anna Müller" }, { name: "Ben Schmidt" }]}
      />,
    );
    const input = chipsField();
    await userEvent.type(input, "q{Backspace}");
    expect(onRemoveLast).not.toHaveBeenCalled();
    expect(input).toHaveValue("");
    await userEvent.keyboard("{Backspace}");
    expect(onRemoveLast).toHaveBeenCalledTimes(1);
    expect(chipTexts()).toEqual(["Anna Müller"]);
    expect(document.activeElement).toBe(input);
  });

  it("splits a paste on commas and line breaks, the typed text included", async () => {
    const onCommit = vi.fn();
    render(<ChipsFixture onCommit={onCommit} suggestions={[]} />);
    const input = chipsField();
    await userEvent.type(input, "pre");
    await userEvent.paste("fix, b.c\nd.e\r\n,");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(["prefix", "b.c", "d.e"]);
    expect(input).toHaveValue("");
    expect(chipTexts()).toEqual(["prefix", "b.c", "d.e"]);
    // Without a separator a paste is an ordinary paste.
    await userEvent.paste("plain");
    expect(input).toHaveValue("plain");
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("names each remove button after its chip, and removing returns focus to the input", async () => {
    render(<ChipsFixture initial={[{ name: "Anna Müller" }, { name: "Ben Schmidt" }]} />);
    const remove = screen.getByRole("button", { name: "Anna Müller entfernen" });
    await userEvent.click(remove);
    expect(chipTexts()).toEqual(["Ben Schmidt"]);
    expect(document.activeElement).toBe(chipsField());
  });

  it("takes overridden labels", () => {
    render(
      <ChipsFixture
        initial={[{ name: "neu.person", tone: "warning" }]}
        labels={{ remove: (label) => `Remove ${label}`, warning: "no account yet" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Remove neu.person" })).toBeInTheDocument();
    expect(chipTexts()).toEqual(["neu.person, no account yet"]);
  });

  it("gives warning and error chips an icon and a spoken status, default chips neither", () => {
    render(
      <ChipsFixture
        initial={[
          { name: "Anna Müller" },
          { name: "neu.person", tone: "warning" },
          { name: "%%%", tone: "error" },
        ]}
      />,
    );
    const items = within(screen.getByRole("list", { name: "Ausgewählt" })).getAllByRole(
      "listitem",
    );
    expect(items.map((li) => li.textContent)).toEqual([
      "Anna Müller",
      "neu.person, Warnung",
      "%%%, Fehler",
    ]);
    // Icons outside the remove button: the non-colour status signal.
    const statusIcons = (li: HTMLElement) =>
      Array.from(li.querySelectorAll("svg")).filter((svg) => !svg.closest("button"));
    expect(items.map((li) => statusIcons(li).length)).toEqual([0, 1, 1]);
    for (const icon of [...statusIcons(items[1]), ...statusIcons(items[2])]) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("passes aria-invalid to the combobox and disabled to the input and remove buttons", () => {
    render(<ChipsFixture initial={[{ name: "Anna Müller" }]} aria-invalid disabled />);
    expect(chipsField()).toHaveAttribute("aria-invalid", "true");
    expect(chipsField()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Anna Müller entfernen" })).toBeDisabled();
  });

  it("focuses the input on a mousedown on the frame", () => {
    render(<ChipsFixture initial={[{ name: "Anna Müller" }]} />);
    const list = screen.getByRole("list", { name: "Ausgewählt" });
    const frame = list.parentElement as HTMLElement;
    expect(frame).toContainElement(chipsField());
    // false = the handler cancelled the mousedown (no blur-then-refocus).
    expect(fireEvent.mouseDown(frame)).toBe(false);
    expect(document.activeElement).toBe(chipsField());
  });

  it("reports the cleared text to a controlled consumer after a commit", async () => {
    function Controlled() {
      const [text, setText] = useState("");
      return (
        <>
          <TokenInput aria-label="Benutzernamen" value={text} onValueChange={setText} />
          <output>{`[${text}]`}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.type(chipsField(), "abc");
    expect(screen.getByRole("status")).toHaveTextContent("[abc]");
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("[]");
    expect(chipsField()).toHaveValue("");
  });

  it("throws a readable error when a chip is used outside <TokenInput>", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TokenInputChip label="x" />)).toThrow(
      "<TokenInputChip> must be rendered inside <TokenInput>.",
    );
    spy.mockRestore();
  });

  /*
   * New with the split (the root and the panel are rendered by TokenInput
   * itself). Oracle: the fixture's literals and the DOM — which options are
   * in the document, whether a panel element exists, which element a ref
   * points at — not the component's state.
   */
  it("passes the root's shouldFilter: server-decided suggestions are shown unfiltered", async () => {
    render(<ChipsFixture shouldFilter={false} suggestions={["Anna Müller", "Ben Schmidt"]} />);
    // "zzz" matches neither label; with client filtering both would be hidden.
    await userEvent.type(chipsField(), "zzz");
    await screen.findByRole("listbox");
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
        "Anna Müller",
        "Ben Schmidt",
      ]),
    );
  });

  it("filters on the client by default", async () => {
    render(<ChipsFixture suggestions={["Anna Müller", "Ben Schmidt"]} />);
    await userEvent.type(chipsField(), "ben");
    await screen.findByRole("listbox");
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Ben Schmidt"]),
    );
  });

  it("passes the root's open state: a controlled consumer keeps the list closed", async () => {
    const onOpenChange = vi.fn();
    render(<ChipsFixture open={false} onOpenChange={onOpenChange} />);
    await userEvent.type(chipsField(), "a");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(chipsField()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with defaultOpen", async () => {
    render(<ChipsFixture defaultOpen />);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(chipsField()).toHaveAttribute("aria-expanded", "true");
  });

  it("renders no panel at all without suggestions, and the field stays closed", async () => {
    render(<TokenInput aria-label="Benutzernamen" />);
    const input = chipsField();
    const frame = input.closest('[data-slot="token-input"]');
    await userEvent.type(input, "abc");
    await userEvent.keyboard("{ArrowDown}");
    // Typing and ↓ ask to open; with nothing to suggest, no panel element
    // exists and nothing may claim one: collapsed, no pointer at a listbox,
    // and the frame keeps its closed look (no data-panel).
    expect(document.querySelector('[data-slot="combobox-content"]')).toBeNull();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-controls");
    expect(input).not.toHaveAttribute("aria-activedescendant");
    expect(frame).not.toBeNull();
    expect(frame).not.toHaveAttribute("data-panel");
    expect(input).toHaveValue("abc");
  });

  it("ignores open requests without suggestions: a later list waits for the next keystroke", async () => {
    // Oracle: the DOM (listbox present or not, aria-expanded), the calls
    // onOpenChange receives, and the fixture's literals.
    const onOpenChange = vi.fn();
    const onCommit = vi.fn();
    function Late() {
      const [results, setResults] = useState<string[] | null>(null);
      return (
        <>
          <TokenInput
            aria-label="Benutzernamen"
            onOpenChange={onOpenChange}
            onCommit={onCommit}
            suggestions={
              results ? (
                <ComboboxList>
                  {results.map((r) => (
                    <ComboboxItem key={r}>{r}</ComboboxItem>
                  ))}
                </ComboboxList>
              ) : undefined
            }
          />
          {/* The "response": arrives without the field losing focus. */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setResults(["Anna Müller", "Ben Schmidt"])}
          >
            Ergebnisse
          </button>
        </>
      );
    }
    render(<Late />);
    const input = chipsField();
    await userEvent.type(input, "an{Enter}");
    expect(onCommit).toHaveBeenCalledWith(["an"]);
    expect(input).toHaveValue("");
    // The requests made while typing were ignored, not reported.
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Ergebnisse" }));
    expect(document.activeElement).toBe(input);
    // Suggestions now exist, but nothing asked for them since: still closed.
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector('[data-slot="combobox-content"]')).toBeNull();

    // The next keystroke opens the list, and that request is reported.
    await userEvent.type(input, "b");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("an open list that loses its suggestions does not come back open after a commit", async () => {
    // Oracle: the DOM (listbox present or not, aria-expanded) and the
    // fixture's literals; the suggestions are toggled from outside.
    function Toggled() {
      const [shown, setShown] = useState(true);
      return (
        <>
          <TokenInput
            aria-label="Benutzernamen"
            suggestions={
              shown ? (
                <ComboboxList>
                  <ComboboxItem>Anna Müller</ComboboxItem>
                </ComboboxList>
              ) : undefined
            }
          />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShown((v) => !v)}>
            Umschalten
          </button>
        </>
      );
    }
    render(<Toggled />);
    const input = chipsField();
    await userEvent.type(input, "an");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Umschalten" });
    fireEvent.click(toggle); // suggestions go away
    expect(input).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{Enter}"); // commits "an" — no list to take it
    expect(input).toHaveValue("");
    fireEvent.click(toggle); // suggestions come back
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("forwards its ref to the text input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TokenInput ref={ref} aria-label="Benutzernamen" />);
    expect(ref.current).toBe(chipsField());
  });

  it("joins the panel: the frame is marked while open, Tab still takes the suggestion", async () => {
    function Chips() {
      const [chips, setChips] = useState<string[]>([]);
      return (
        <TokenInput
          aria-label="Personen"
          suggestions={
            <ComboboxList>
              <ComboboxItem onSelect={(v) => setChips((cs) => [...cs, v])}>Anna Müller</ComboboxItem>
            </ComboboxList>
          }
        >
          {chips.map((c) => (
            <TokenInputChip key={c} label={c} />
          ))}
        </TokenInput>
      );
    }
    render(<Chips />);
    const input = screen.getByRole("combobox", { name: "Personen" });
    const frame = input.closest('[data-slot="token-input"]');
    expect(frame).not.toHaveAttribute("data-panel");
    await userEvent.type(input, "an");
    await screen.findByRole("listbox");
    expect(frame).toHaveAttribute("data-panel", "open");
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant"));
    await userEvent.tab();
    expect(screen.getByRole("listitem")).toHaveTextContent("Anna Müller");
    expect(document.activeElement).toBe(input);
    await waitFor(() => expect(frame).not.toHaveAttribute("data-panel"));
  });
});
