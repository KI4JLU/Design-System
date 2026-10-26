import * as React from "react";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TitleTooltips } from "./title-tooltips";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * Oracles: the native tooltip is suppressed exactly while the DS tooltip
 * shows (no `title` attribute on the element, which is what the browser
 * reads), the original attribute comes back afterwards, and the APG wiring
 * holds — the text is reachable as the element's description.
 */
/** jsdom's :focus-visible is a heuristic over earlier events, so it varies
 * with test order; tests about the hover/focus bookkeeping pin it to true. */
const forceFocusVisible = () => {
  const matches = Element.prototype.matches;
  const spy = vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, sel: string) {
    return sel === ":focus-visible" ? true : matches.call(this, sel);
  });
  onTestFinished(() => spy.mockRestore());
};

describe("TitleTooltips", () => {
  it("replaces a native title on hover and restores it on leave", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" aria-label="Löschen" title="Datei endgültig löschen">x</button>
        <span>elsewhere</span>
      </>,
    );
    const btn = screen.getByRole("button", { name: "Löschen" });
    await user.hover(btn);
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Datei endgültig löschen");
    // Emptied, not removed: an empty title shows no native tooltip.
    expect(btn).toHaveAttribute("title", "");
    expect(btn).toHaveAttribute("data-title", "Datei endgültig löschen");
    // Still described by the text the title carried.
    expect(btn).toHaveAccessibleDescription("Datei endgültig löschen");

    await user.hover(screen.getByText("elsewhere"));
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    await waitFor(() => expect(btn).toHaveAttribute("title", "Datei endgültig löschen"));
    expect(btn).not.toHaveAttribute("data-title");
    expect(btn).not.toHaveAttribute("aria-describedby");
  });

  it("does not add a description that only repeats the name", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" aria-label="Löschen" title="Löschen">x</button>
      </>,
    );
    const btn = screen.getByRole("button", { name: "Löschen" });
    await user.hover(btn);
    await screen.findByRole("tooltip");
    expect(btn).not.toHaveAttribute("aria-describedby");
  });

  it("opens on keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" title="Neu laden">↻</button>
      </>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Neu laden");
  });

  it("leaves data-native-title subtrees to the browser", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <div data-native-title>
          <button type="button" title="nativ">x</button>
        </div>
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    expect(btn).toHaveAttribute("title", "nativ");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("skips elements inside an explicit TooltipTrigger", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" title="alt">x</button>
          </TooltipTrigger>
          <TooltipContent>explizit</TooltipContent>
        </Tooltip>
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    const tips = await screen.findAllByRole("tooltip");
    expect(tips).toHaveLength(1);
    expect(tips[0]).toHaveTextContent("explizit");
    expect(btn).toHaveAttribute("title", "alt");
  });

  it("follows a title React changes while it is shown", async () => {
    const user = userEvent.setup();
    const Toggle = () => {
      const [on, setOn] = React.useState(false);
      return (
        <button type="button" title={on ? "Fortsetzen" : "Pausieren"} onKeyDown={() => setOn(true)}>
          ⏯
        </button>
      );
    };
    render(
      <>
        <TitleTooltips />
        <Toggle />
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Pausieren");
    btn.focus();
    await user.keyboard("a");
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Fortsetzen"));
    expect(btn).toHaveAttribute("title", "");
  });

  it("uses the inverse surface inside a data-tooltip-tone=inverse subtree", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <div data-tooltip-tone="inverse">
          <button type="button" title="in der Nachricht">a</button>
        </div>
        <button type="button" title="außerhalb">b</button>
      </>,
    );
    await user.hover(screen.getByRole("button", { name: "a" }));
    await screen.findByRole("tooltip");
    const inner = document.querySelector('[data-slot="tooltip-content"]');
    expect(inner).toHaveClass("bg-inverse-surface");

    await user.hover(screen.getByRole("button", { name: "b" }));
    await waitFor(() =>
      expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent("außerhalb"),
    );
    expect(document.querySelector('[data-slot="tooltip-content"]')).not.toHaveClass("bg-inverse-surface");
  });

  // Codex review findings (title-tooltips.tsx): name, nesting, removal,
  // hoverable content.
  it("keeps a title that names the control as its accessible name", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <input title="Suche" />
      </>,
    );
    const input = screen.getByRole("textbox", { name: "Suche" });
    await user.hover(input);
    await screen.findByRole("tooltip");
    expect(input).toHaveAccessibleName("Suche");
    await user.unhover(input);
    await waitFor(() => expect(input).toHaveAttribute("title", "Suche"));
    expect(input).not.toHaveAttribute("aria-label");
  });

  it("moves to a nested element's own title", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <div title="Außen">
          <button type="button" title="Innen">x</button>
        </div>
      </>,
    );
    const outer = screen.getByText("x").parentElement as HTMLElement;
    await user.hover(outer);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Außen");
    const inner = screen.getByRole("button");
    await user.hover(inner);
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Innen"));
    expect(inner).toHaveAttribute("title", "");
    expect(outer).toHaveAttribute("title", "Außen");
  });

  it("does not restore a title React removed while it was shown", async () => {
    const user = userEvent.setup();
    const Toggle = () => {
      const [on, setOn] = React.useState(true);
      return (
        <button type="button" title={on ? "Hinweis" : undefined} onKeyDown={() => setOn(false)}>
          y
        </button>
      );
    };
    render(
      <>
        <TitleTooltips />
        <Toggle />
        <span>elsewhere</span>
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    await screen.findByRole("tooltip");
    btn.focus();
    await user.keyboard("a");
    await user.hover(screen.getByText("elsewhere"));
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    expect(btn).not.toHaveAttribute("title");
    expect(btn).not.toHaveAttribute("data-title");
  });

  it("stays open while the pointer moves onto the tooltip", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" title="Lesbarer Hinweis">z</button>
      </>,
    );
    await user.hover(screen.getByRole("button"));
    await screen.findByRole("tooltip");
    const content = document.querySelector("[data-title-tooltip]") as HTMLElement;
    await user.hover(content);
    await new Promise((r) => setTimeout(r, 250));
    expect(document.querySelector("[data-title-tooltip]")).toHaveTextContent("Lesbarer Hinweis");
  });

  // Second Codex pass: app-cleared titles, native input names, boundaries.
  it("keeps a title the app cleared while it was shown", async () => {
    const user = userEvent.setup();
    const Toggle = () => {
      const [on, setOn] = React.useState(true);
      return (
        <button type="button" title={on ? "Hinweis" : ""} onKeyDown={() => setOn(false)}>
          y
        </button>
      );
    };
    render(
      <>
        <TitleTooltips />
        <Toggle />
        <span>elsewhere</span>
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    await screen.findByRole("tooltip");
    btn.focus();
    await user.keyboard("a");
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    await user.hover(screen.getByText("elsewhere"));
    expect(btn).toHaveAttribute("title", "");
    expect(btn).not.toHaveAttribute("data-title");
  });

  it("leaves the native name of a submit input alone", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <input type="submit" value="Speichern" title="Formular absenden" />
      </>,
    );
    const input = screen.getByRole("button", { name: "Speichern" });
    await user.hover(input);
    await screen.findByRole("tooltip");
    expect(input).not.toHaveAttribute("aria-label");
    expect(input).toHaveAccessibleName("Speichern");
  });

  it("treats a data-native-title element below a titled ancestor as a boundary", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <div title="Außen">
          <span data-native-title>innen</span>
        </div>
      </>,
    );
    await user.hover(screen.getByText("innen"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByText("innen").parentElement).toHaveAttribute("title", "Außen");
  });

  it("keeps a select named by its title although it has option text", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <select title="Land">
          <option>Deutschland</option>
        </select>
      </>,
    );
    const select = screen.getByRole("combobox");
    await user.hover(select);
    await screen.findByRole("tooltip");
    expect(select).toHaveAccessibleName("Land");
  });

  it("keeps an aria-label the app set while the temporary one was active", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <input title="Suche" />
        <span>elsewhere</span>
      </>,
    );
    const input = screen.getByRole("textbox");
    await user.hover(input);
    await screen.findByRole("tooltip");
    input.setAttribute("aria-label", "Volltextsuche");
    await user.hover(screen.getByText("elsewhere"));
    await waitFor(() => expect(input).toHaveAttribute("title", "Suche"));
    expect(input).toHaveAttribute("aria-label", "Volltextsuche");
  });

  it("names a button whose only content is aria-hidden by its title", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" title="Löschen">
          <span aria-hidden="true">×</span>
        </button>
      </>,
    );
    const btn = screen.getByRole("button", { name: "Löschen" });
    await user.hover(btn);
    await screen.findByRole("tooltip");
    expect(btn).toHaveAccessibleName("Löschen");
  });

  it("stays open while keyboard focus remains after the pointer leaves", async () => {
    forceFocusVisible();
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" title="Hinweis">h</button>
        <span>elsewhere</span>
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    await screen.findByRole("tooltip");
    await user.tab(); // keyboard focus lands on the same button
    expect(btn).toHaveFocus();
    await user.hover(screen.getByText("elsewhere"));
    await new Promise((r) => setTimeout(r, 250));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Hinweis");
    await user.tab(); // focus leaves: now nothing holds it
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  it("names a value-less button input by its title", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <input type="button" title="Speichern" />
      </>,
    );
    const input = screen.getByRole("button");
    await user.hover(input);
    await screen.findByRole("tooltip");
    expect(input).toHaveAccessibleName("Speichern");
  });

  it("keeps an app aria-label written together with a new title", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <input title="Suche" />
        <span>elsewhere</span>
      </>,
    );
    const input = screen.getByRole("textbox");
    await user.hover(input);
    await screen.findByRole("tooltip");
    input.setAttribute("aria-label", "Volltextsuche");
    input.setAttribute("title", "Suche im Thema");
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Suche im Thema"));
    expect(input).toHaveAttribute("aria-label", "Volltextsuche");
    await user.hover(screen.getByText("elsewhere"));
    await waitFor(() => expect(input).toHaveAttribute("title", "Suche im Thema"));
    expect(input).toHaveAttribute("aria-label", "Volltextsuche");
  });

  it("keeps a <label> as the name of a value-less button input", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <label>
          Absenden <input type="button" title="Formular absenden" />
        </label>
      </>,
    );
    const input = screen.getByRole("button");
    await user.hover(input);
    await screen.findByRole("tooltip");
    expect(input).not.toHaveAttribute("aria-label");
  });

  it("describes a button whose title repeats its content but not its aria-label", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" aria-label="Dokument entfernen" title="Löschen">Löschen</button>
      </>,
    );
    const btn = screen.getByRole("button", { name: "Dokument entfernen" });
    await user.hover(btn);
    await screen.findByRole("tooltip");
    expect(btn).toHaveAccessibleDescription("Löschen");
  });

  it("ignores CSS-hidden content when deciding the title is the name", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" title="Suchen">
          <span style={{ display: "none" }}>Deko</span>
        </button>
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    await screen.findByRole("tooltip");
    expect(btn).toHaveAttribute("aria-label", "Suchen");
  });

  it("compares against an aria-labelledby name, not the content", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <span id="dok">Dokumentaktionen</span>
        <button type="button" aria-labelledby="dok" title="Löschen">Löschen</button>
      </>,
    );
    const btn = screen.getByRole("button", { name: "Dokumentaktionen" });
    await user.hover(btn);
    await screen.findByRole("tooltip");
    expect(btn).toHaveAccessibleDescription("Löschen");
  });

  it("names a role=img by its title despite text inside", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <div role="img" title="Umsatzdiagramm">Jan 42</div>
      </>,
    );
    const img = screen.getByRole("img");
    await user.hover(img);
    await screen.findByRole("tooltip");
    expect(img).toHaveAccessibleName("Umsatzdiagramm");
  });

  it("keeps the name a labelled svg gives a button", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" title="Mehr Optionen">
          <svg aria-label="Menü" role="img" />
        </button>
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    await screen.findByRole("tooltip");
    expect(btn).not.toHaveAttribute("aria-label");
  });

  it("ignores a labelled icon inside an aria-hidden wrapper", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <button type="button" title="Löschen">
          <span aria-hidden="true">
            <svg aria-label="Papierkorb" role="img" />
          </span>
        </button>
      </>,
    );
    const btn = screen.getByRole("button");
    await user.hover(btn);
    await screen.findByRole("tooltip");
    expect(btn).toHaveAccessibleName("Löschen");
  });

  it("names a caption-less table by its title", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <table title="Noten">
          <tbody>
            <tr>
              <td>1,3</td>
            </tr>
          </tbody>
        </table>
      </>,
    );
    const table = screen.getByRole("table");
    await user.hover(table);
    await screen.findByRole("tooltip");
    expect(table).toHaveAccessibleName("Noten");
  });

  it("opens at once when keyboard focus joins a pending hover", async () => {
    forceFocusVisible();
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips delayDuration={5000} />
        <button type="button" title="Hinweis">h</button>
      </>,
    );
    await user.hover(screen.getByRole("button"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    screen.getByRole("button").focus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Hinweis");
  });

  it("names a control with an empty aria-label by its title and keeps the empty label", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <input title="Suche" aria-label="" />
        <span>elsewhere</span>
      </>,
    );
    const input = screen.getByRole("textbox");
    await user.hover(input);
    await screen.findByRole("tooltip");
    expect(input).toHaveAccessibleName("Suche");
    await user.hover(screen.getByText("elsewhere"));
    await waitFor(() => expect(input).toHaveAttribute("title", "Suche"));
    expect(input).toHaveAttribute("aria-label", "");
  });

  it("keeps a title the app clears in the same task as the blur", async () => {
    forceFocusVisible();
    render(
      <>
        <TitleTooltips />
        <button type="button" title="Hinweis">h</button>
      </>,
    );
    const btn = screen.getByRole("button");
    btn.focus();
    await screen.findByRole("tooltip");
    btn.setAttribute("title", "");
    btn.blur();
    expect(btn).toHaveAttribute("title", "");
    expect(btn).not.toHaveAttribute("data-title");
  });

  it("names an input by its title when aria-labelledby resolves to nothing", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <input title="Suche" aria-labelledby="fehlt" />
      </>,
    );
    const input = screen.getByRole("textbox");
    await user.hover(input);
    await screen.findByRole("tooltip");
    expect(input).toHaveAccessibleName("Suche");
  });

  it("does not open on focus that follows a tap or click", async () => {
    forceFocusVisible();
    render(
      <>
        <TitleTooltips />
        <input title="Suche" />
      </>,
    );
    const input = screen.getByRole("textbox");
    input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    input.focus();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("title", "Suche");
  });

  it("keeps a progress element named by its title despite fallback text", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <progress title="Upload" value={25} max={100}>25%</progress>
      </>,
    );
    const bar = screen.getByRole("progressbar");
    await user.hover(bar);
    await screen.findByRole("tooltip");
    expect(bar).toHaveAccessibleName("Upload");
  });

  it("closes, and stays closed, when a click focuses a titled text field", async () => {
    forceFocusVisible();
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <input title="Suche" />
      </>,
    );
    const input = screen.getByRole("textbox");
    await user.hover(input);
    await screen.findByRole("tooltip");
    await user.click(input);
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    await user.keyboard("abc");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("names a nav landmark by its title despite its links", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <nav title="Hauptnavigation">
          <a href="#start">Start</a>
        </nav>
      </>,
    );
    const nav = screen.getByRole("navigation");
    await user.hover(nav);
    await screen.findByRole("tooltip");
    expect(nav).toHaveAccessibleName("Hauptnavigation");
  });

  it("opens on keyboard focus right after a click elsewhere", async () => {
    forceFocusVisible();
    const user = userEvent.setup();
    render(
      <>
        <TitleTooltips />
        <span>irgendwo</span>
        <button type="button" title="Hinweis">h</button>
      </>,
    );
    await user.click(screen.getByText("irgendwo"));
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Hinweis");
  });
});
