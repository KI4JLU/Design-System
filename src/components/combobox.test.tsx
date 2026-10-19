import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxLoading,
  type ComboboxProps,
} from "./combobox";

/*
 * Oracle for every test in this file: the DOM as assistive technology and the
 * browser see it — roles, accessible names, ARIA attributes, `document
 * .activeElement`, whether a native event was cancelled — plus the fixture's
 * own literals (option labels, the call arguments a handler must receive).
 * None of it is read back from the component's state, so a wrong wiring
 * cannot confirm itself.
 */

function Fixture({
  onSelect = () => {},
  ...props
}: Partial<ComboboxProps> & { onSelect?: (value: string) => void }) {
  return (
    <Combobox {...props}>
      <ComboboxInput aria-label="Suchen" />
      <ComboboxContent>
        <ComboboxEmpty>Keine Treffer</ComboboxEmpty>
        <ComboboxList>
          <ComboboxGroup heading="Chats">
            <ComboboxItem onSelect={onSelect}>Semesterplanung</ComboboxItem>
            <ComboboxItem onSelect={onSelect}>Prüfungsordnung</ComboboxItem>
          </ComboboxGroup>
          <ComboboxGroup heading="Dokumente">
            <ComboboxItem onSelect={onSelect}>Modulhandbuch</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const field = () => screen.getByRole("combobox", { name: "Suchen" });
const option = (name: string) => screen.getByRole("option", { name });

describe("Combobox", () => {
  it("is a named, collapsed combobox until something opens it", () => {
    render(<Fixture />);
    const input = field();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    // The listbox is not mounted while closed, so nothing may point at it.
    expect(input).not.toHaveAttribute("aria-controls");
    expect(input).not.toHaveAttribute("aria-activedescendant");
    // cmdk points aria-labelledby at its own empty hidden label; the name
    // above only resolves because that pointer is removed.
    expect(input).not.toHaveAttribute("aria-labelledby");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens on typing and wires combobox → listbox → highlighted option", async () => {
    render(<Fixture />);
    const input = field();
    await userEvent.type(input, "s");
    const listbox = await screen.findByRole("listbox", { name: "Vorschläge" });
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    // Radix Popover's role="dialog" is removed: the popup is the listbox.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // The option cmdk highlights on its own when the list opens must be
    // announced too — before any arrow key (cmdk 1.1.1 alone misses it).
    await waitFor(() => {
      const highlighted = screen
        .getAllByRole("option")
        .filter((o) => o.getAttribute("aria-selected") === "true");
      expect(highlighted).toHaveLength(1);
      expect(input).toHaveAttribute("aria-activedescendant", highlighted[0].id);
    });
    expect(document.activeElement).toBe(input);
  });

  it("labels each group by its heading", async () => {
    render(<Fixture />);
    await userEvent.type(field(), "{ArrowDown}");
    const chats = await screen.findByRole("group", { name: "Chats" });
    expect(chats).toContainElement(option("Semesterplanung"));
    expect(screen.getByRole("group", { name: "Dokumente" })).toContainElement(
      option("Modulhandbuch"),
    );
  });

  it("filters the rendered items on the client by default", async () => {
    render(<Fixture />);
    await userEvent.type(field(), "modul");
    await screen.findByRole("listbox");
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Modulhandbuch"]),
    );
    await userEvent.clear(field());
    await userEvent.type(field(), "xyz");
    expect(await screen.findByText("Keine Treffer")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    // An empty listbox is an ARIA error; the list hides while it has no option.
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("opens a closed list on ArrowDown and moves the highlight with wrap-around", async () => {
    render(<Fixture />);
    const input = field();
    input.focus();
    await userEvent.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    const active = () => document.getElementById(input.getAttribute("aria-activedescendant")!);
    await waitFor(() => expect(active()).toBe(option("Semesterplanung")));
    await userEvent.keyboard("{ArrowDown}");
    expect(active()).toBe(option("Prüfungsordnung"));
    expect(option("Prüfungsordnung")).toHaveAttribute("aria-selected", "true");
    expect(option("Semesterplanung")).toHaveAttribute("aria-selected", "false");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(active()).toBe(option("Semesterplanung")); // wrapped past the last
    await userEvent.keyboard("{ArrowUp}");
    expect(active()).toBe(option("Modulhandbuch")); // wrapped past the first
    await userEvent.keyboard("{Home}");
    expect(active()).toBe(option("Semesterplanung"));
    await userEvent.keyboard("{End}");
    expect(active()).toBe(option("Modulhandbuch"));
    expect(document.activeElement).toBe(input);
  });

  it("selects the highlighted item on Enter, closes, and keeps focus and text", async () => {
    const onSelect = vi.fn();
    render(<Fixture onSelect={onSelect} />);
    const input = field();
    await userEvent.type(input, "p");
    await screen.findByRole("listbox");
    await userEvent.keyboard("{Home}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("Prüfungsordnung");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(input).toHaveAttribute("aria-expanded", "false");
    // Closed again, nothing may point at the unmounted listbox.
    expect(input).not.toHaveAttribute("aria-controls");
    expect(input).toHaveValue("p");
    expect(document.activeElement).toBe(input);
  });

  it("selects on click without the field ever losing focus", async () => {
    const onSelect = vi.fn();
    render(<Fixture onSelect={onSelect} />);
    const input = field();
    await userEvent.type(input, "{ArrowDown}");
    await screen.findByRole("listbox");
    const blur = vi.fn();
    input.addEventListener("blur", blur);
    await userEvent.click(option("Modulhandbuch"));
    expect(onSelect).toHaveBeenCalledWith("Modulhandbuch");
    expect(blur).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("closes on Escape and keeps focus and text in the field", async () => {
    render(<Fixture />);
    const input = field();
    await userEvent.type(input, "sem");
    await screen.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveValue("sem");
    expect(document.activeElement).toBe(input);
  });

  it("closes on an outside click, but not on a click into the field", async () => {
    render(
      <>
        <Fixture />
        <p>Draußen</p>
      </>,
    );
    const input = field();
    await userEvent.type(input, "{ArrowDown}");
    await screen.findByRole("listbox");
    await userEvent.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Draußen"));
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("closes when focus leaves the field for something outside input and list", async () => {
    render(
      <>
        <Fixture />
        <button type="button">Weiter</button>
      </>,
    );
    await userEvent.type(field(), "{ArrowDown}");
    await screen.findByRole("listbox");
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Weiter" }));
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("leaves Enter to the text field while closed (a form still submits)", () => {
    render(<Fixture />);
    const input = field();
    input.focus();
    // fireEvent returns false when a handler called preventDefault().
    expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(true);
    expect(fireEvent.keyDown(input, { key: "Home" })).toBe(true);
    expect(fireEvent.keyDown(input, { key: "ArrowDown" })).toBe(false); // opens instead
  });

  it("lets a controlled consumer keep the list closed", async () => {
    const onOpenChange = vi.fn();
    render(<Fixture open={false} onOpenChange={onOpenChange} />);
    const input = field();
    await userEvent.type(input, "s");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("supports a controlled input value", async () => {
    function Controlled() {
      const [value, setValue] = useState("modul");
      return (
        <Combobox defaultOpen>
          <ComboboxInput aria-label="Suchen" value={value} onValueChange={setValue} />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxItem>Semesterplanung</ComboboxItem>
              <ComboboxItem>Modulhandbuch</ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
          <output>{value}</output>
        </Combobox>
      );
    }
    render(<Controlled />);
    expect(field()).toHaveValue("modul");
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Modulhandbuch"]),
    );
    await userEvent.type(field(), "x");
    expect(screen.getByRole("status")).toHaveTextContent("modulx");
  });

  it("renders server results unfiltered, with loading and empty states", async () => {
    function Server({ loading, results }: { loading: boolean; results: string[] }) {
      return (
        <Combobox shouldFilter={false} defaultOpen>
          <ComboboxInput aria-label="Suchen" defaultValue="zzz" />
          <ComboboxContent>
            {loading ? <ComboboxLoading>Suche läuft</ComboboxLoading> : null}
            {!loading ? <ComboboxEmpty>Keine Treffer</ComboboxEmpty> : null}
            <ComboboxList>
              {results.map((r) => (
                <ComboboxItem key={r}>{r}</ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      );
    }
    const { rerender } = render(<Server loading results={[]} />);
    expect(screen.getByRole("progressbar", { name: "Wird geladen …" })).toBeInTheDocument();
    expect(screen.queryByText("Keine Treffer")).not.toBeInTheDocument();
    // "zzz" matches neither label — shown anyway, because the server decided.
    rerender(<Server loading={false} results={["Semesterplanung", "Modulhandbuch"]} />);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    rerender(<Server loading={false} results={[]} />);
    expect(await screen.findByText("Keine Treffer")).toBeInTheDocument();
  });

  it("throws a readable error when a part is used outside <Combobox>", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ComboboxInput aria-label="x" />)).toThrow(
      "<ComboboxInput> must be rendered inside <Combobox>.",
    );
    spy.mockRestore();
  });
});

/*
 * The joined panel. Oracle, as above: the DOM as assistive technology sees it
 * plus the fixture's literals. The joined geometry itself (boxes, radii,
 * colours) needs a layout engine — it is asserted in Chromium by the
 * `Default` and `Invalid` stories; here only what jsdom can observe
 * without reading the component's own class strings: attributes, roles,
 * focus, structure. Keyboard, Escape and outside-click behaviour run on the
 * panel in the tests above (there is no other look).
 */
describe("Combobox panel", () => {
  const panelOf = (listbox: HTMLElement) => listbox.closest('[data-slot="combobox-content"]');

  it("marks the field data-panel=open only while the list is open", async () => {
    render(<Fixture />);
    const input = field();
    expect(input).not.toHaveAttribute("data-panel");
    await userEvent.type(input, "{ArrowDown}");
    await screen.findByRole("listbox");
    expect(input).toHaveAttribute("data-panel", "open");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(input).not.toHaveAttribute("data-panel");
  });

  it("renders one portalled panel: a hidden window onto the field, then the list", async () => {
    const { container } = render(<Fixture />);
    await userEvent.type(field(), "{ArrowDown}");
    const listbox = await screen.findByRole("listbox");
    const panel = panelOf(listbox);
    expect(panel).not.toBeNull();
    expect(container.contains(panel)).toBe(false); // portalled to <body>
    const [window, body] = Array.from(panel!.children);
    expect(window).toHaveAttribute("aria-hidden", "true");
    expect(window).toBeEmptyDOMElement();
    expect(body).toContainElement(listbox);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("still calls the consumer's onFocus and onBlur", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <Combobox>
          <ComboboxInput aria-label="Suchen" onFocus={onFocus} onBlur={onBlur} />
        </Combobox>
        <button type="button">Weiter</button>
      </>,
    );
    await userEvent.click(field());
    expect(onFocus).toHaveBeenCalledTimes(1);
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

/*
 * Palette rows. Oracle: the accessible name as dom-accessibility-api computes
 * it from the DOM, `aria-hidden`, and the fixture's literals — the label a
 * handler must receive and the strings typed.
 */
describe("ComboboxItem description and shortcutHint", () => {
  function Palette({ onSelect = () => {} }: { onSelect?: (value: string) => void }) {
    return (
      <Combobox>
        <ComboboxInput aria-label="Suchen" />
        <ComboboxContent>
          <ComboboxEmpty>Keine Treffer</ComboboxEmpty>
          <ComboboxList>
            <ComboboxItem onSelect={onSelect} description="Heute" shortcutHint={<kbd>⌘ 1</kbd>}>
              <svg aria-hidden="true" />
              <span>Semesterplanung</span>
            </ComboboxItem>
            <ComboboxItem onSelect={onSelect} value="explicit" description="Gestern">
              Modulhandbuch
            </ComboboxItem>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  }

  it("names the option after label and description, never the shortcut, which is hidden", async () => {
    render(<Palette />);
    await userEvent.type(field(), "{ArrowDown}");
    // jsdom has no layout, so it joins the inline spans without a space; the
    // exact spaced name is asserted in Chromium (`Default`, palette rows).
    const first = await screen.findByRole("option", { name: /^Semesterplanung\s?Heute$/ });
    const shortcut = within(first).getByText("⌘ 1").parentElement;
    expect(shortcut).toHaveAttribute("aria-hidden", "true");
    expect(within(first).getByText("Heute")).not.toHaveAttribute("aria-hidden");
  });

  it("passes the label (not description or keys) to onSelect; an explicit value wins", async () => {
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);
    await userEvent.type(field(), "{ArrowDown}");
    await screen.findByRole("listbox");
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("Semesterplanung");
    await userEvent.keyboard("{ArrowDown}{End}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("explicit");
  });

  it("keeps the label as the value for a row cmdk filters out and then shows", async () => {
    // "Sem" opens the list with this row filtered out (cmdk renders nothing
    // for it); clearing the query makes cmdk mount it before ArrowDown /
    // Enter reach it — the filtered-then-visible path.
    const onSelect = vi.fn();
    render(
      <Combobox>
        <ComboboxInput aria-label="Suchen" />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxItem onSelect={onSelect}>Semesterplanung</ComboboxItem>
            <ComboboxItem onSelect={onSelect} description="Gestern" shortcutHint={<kbd>⌘ 2</kbd>}>
              Prüfungsordnung
            </ComboboxItem>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    );
    // jsdom joins label and description without a space (see above).
    const row = () => screen.queryByRole("option", { name: /^Prüfungsordnung\s?Gestern$/ });
    await userEvent.type(field(), "Sem");
    await screen.findByRole("option", { name: "Semesterplanung" });
    expect(row()).toBeNull();
    await userEvent.clear(field());
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    await userEvent.keyboard("{ArrowDown}");
    expect(row()).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("Prüfungsordnung");
  });

  it("leaves a plain row's classes exactly as before the palette props existed", async () => {
    // Oracle: the class attribute a plain `ComboboxItem` rendered at the
    // claim base (86aa39c), copied literally — not derived from this code.
    const before =
      "flex w-full items-center gap-3 px-3 py-2 text-left font-body-base text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring [&_svg]:shrink-0 text-on-surface hover:bg-surface-container-high cursor-default rounded-lg select-none data-[selected=true]:bg-surface-container-high data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-60 [&_svg]:size-4";
    render(<Fixture />);
    await userEvent.type(field(), "{ArrowDown}");
    expect(await screen.findByRole("option", { name: "Semesterplanung" })).toHaveAttribute(
      "class",
      before,
    );
  });

  it("filters on the label: typing the description alone matches nothing", async () => {
    render(<Palette />);
    await userEvent.type(field(), "heute");
    expect(await screen.findByText("Keine Treffer")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });
});

/*
 * Ref forwarding. Oracle: the option element found in the live DOM by role
 * and accessible name, and `Node.isConnected` — not the component's state.
 */
describe("ComboboxItem ref", () => {
  it("tracks the live option after cmdk filters the row out and back in", async () => {
    const itemRef = createRef<HTMLDivElement>();
    render(
      <Combobox>
        <ComboboxInput aria-label="Suchen" />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxItem ref={itemRef}>Semesterplanung</ComboboxItem>
            <ComboboxItem>Modulhandbuch</ComboboxItem>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    );
    // Open on an empty query first, so the row is mounted before the filter
    // removes it — the state in which a stale ref would hold a detached node.
    await userEvent.type(field(), "{ArrowDown}");
    expect(itemRef.current).toBe(await screen.findByRole("option", { name: "Semesterplanung" }));
    await userEvent.type(field(), "modul");
    await waitFor(() => expect(screen.queryByRole("option", { name: "Semesterplanung" })).toBeNull());
    // While cmdk renders nothing for the row, the ref holds no node — not a
    // detached one left over from the earlier mount.
    expect(itemRef.current).toBeNull();
    await userEvent.clear(field());
    const visible = await screen.findByRole("option", { name: "Semesterplanung" });
    expect(itemRef.current).toBe(visible);
    expect(itemRef.current?.isConnected).toBe(true);
  });
});
