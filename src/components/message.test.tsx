import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useState } from "react";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "./message";

// Oracles for this file.
// Upstream behaviour: the AI Elements registry source of `message`
// (https://elements.ai-sdk.dev/api/registry/message.json, the revision the
// shadcn CLI installed), read independently of the DS file:
// - `Message` puts `is-user` on a `from="user"` message, `is-assistant` otherwise.
// - `MessageAction` is a `type="button"` Button named by `label || tooltip`;
//   with `tooltip` it is wrapped in a Tooltip.
// - `MessageBranch` keeps the current index (from `defaultBranch`), and
//   previous/next wrap around at both ends and call `onBranchChange`.
// - `MessageBranchContent` renders every branch, only the current one without
//   `hidden`; `MessageBranchSelector` renders nothing for one branch.
// - `MessageBranchPage` reads "{current + 1} of {total}" ("von" here).
// The DS fixes are checked against the defect, not against the code:
// - accname: a description that repeats the name adds nothing (APG tooltip
//   pattern: the tooltip *describes*); WCAG 4.1.2: every button has a name;
//   APG/ARIA: a group has a name; ARIA live regions: a polite region that
//   persists across the change announces it.
// - React: list children need keys; HTML: an `id` is unique in a document.
// - First paint: what is in the DOM when the task that committed the first
//   render ends — the browser cannot paint inside a task.

function Branches(props: {
  defaultBranch?: number;
  onBranchChange?: (index: number) => void;
}) {
  return (
    <MessageBranch {...props}>
      <MessageBranchContent>
        {[
          <Message from="assistant" key="a">
            <MessageContent>Antwort A</MessageContent>
          </Message>,
          <Message from="assistant" key="b">
            <MessageContent>Antwort B</MessageContent>
          </Message>,
          <Message from="assistant" key="c">
            <MessageContent>Antwort C</MessageContent>
          </Message>,
        ]}
      </MessageBranchContent>
      <MessageToolbar>
        <MessageBranchSelector>
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
      </MessageToolbar>
    </MessageBranch>
  );
}

/** The branch wrapper of a text is the `MessageBranchContent` div around its Message. */
const branchOf = (text: string) =>
  screen.getByText(text).closest(".group")!.parentElement as HTMLElement;

describe("Message", () => {
  it("marks a user message with is-user and an assistant message with is-assistant", () => {
    render(
      <>
        <Message from="user" data-testid="u">
          <MessageContent>Frage</MessageContent>
        </Message>
        <Message from="assistant" data-testid="a">
          <MessageContent>Antwort</MessageContent>
        </Message>
      </>,
    );
    expect(screen.getByTestId("u")).toHaveClass("is-user");
    expect(screen.getByTestId("u")).not.toHaveClass("is-assistant");
    expect(screen.getByTestId("a")).toHaveClass("is-assistant");
    expect(screen.getByTestId("a")).not.toHaveClass("is-user");
  });

  it("MessageResponse renders its children as given", () => {
    render(
      <MessageResponse>
        <p>Absatz eins</p>
      </MessageResponse>,
    );
    expect(screen.getByText("Absatz eins").parentElement?.tagName).toBe("DIV");
  });

  it("MessageResponse re-renders a changed className with unchanged children (fix #8)", () => {
    const children = <p>Absatz</p>;
    const { rerender } = render(
      <MessageResponse className="erste">{children}</MessageResponse>,
    );
    rerender(<MessageResponse className="zweite">{children}</MessageResponse>);
    const root = screen.getByText("Absatz").parentElement!;
    expect(root).toHaveClass("zweite");
    expect(root).not.toHaveClass("erste");
  });
});

describe("MessageAction", () => {
  it("is a type=button whose name is the tooltip when no label is given", () => {
    render(
      <MessageActions>
        <MessageAction tooltip="Kopieren">
          <svg aria-hidden="true" />
        </MessageAction>
      </MessageActions>,
    );
    const button = screen.getByRole("button", { name: "Kopieren" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("takes its name from label over tooltip", () => {
    render(
      <MessageAction label="Antwort kopieren" tooltip="Kopieren">
        <svg aria-hidden="true" />
      </MessageAction>,
    );
    expect(screen.getByRole("button", { name: "Antwort kopieren" })).toBeInTheDocument();
  });

  it("shows the tooltip on hover", async () => {
    render(
      <MessageAction tooltip="Neu generieren">
        <svg aria-hidden="true" />
      </MessageAction>,
    );
    await userEvent.hover(screen.getByRole("button", { name: "Neu generieren" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Neu generieren");
  });

  it("is not described by a tooltip that repeats its name (fix #1)", async () => {
    render(
      <MessageAction tooltip="Neu generieren">
        <svg aria-hidden="true" />
      </MessageAction>,
    );
    const button = screen.getByRole("button", { name: "Neu generieren" });
    await userEvent.hover(button);
    await screen.findByRole("tooltip");
    expect(button).toHaveAccessibleDescription("");
  });

  it("is described by the tooltip when a distinct label names it (fix #1)", async () => {
    render(
      <MessageAction label="Antwort kopieren" tooltip="In die Zwischenablage">
        <svg aria-hidden="true" />
      </MessageAction>,
    );
    const button = screen.getByRole("button", { name: "Antwort kopieren" });
    await userEvent.hover(button);
    await waitFor(() =>
      expect(button).toHaveAccessibleDescription("In die Zwischenablage"),
    );
  });

  it("requires label or tooltip in its type (fix #2)", () => {
    // @ts-expect-error -- a MessageAction without label and tooltip has no name (WCAG 4.1.2)
    const unnamed = <MessageAction><svg aria-hidden="true" /></MessageAction>;
    expect(unnamed).toBeTruthy();
  });

  it("renders no tooltip without the tooltip prop", async () => {
    render(
      <MessageAction label="Bearbeiten">
        <svg aria-hidden="true" />
      </MessageAction>,
    );
    const button = screen.getByRole("button", { name: "Bearbeiten" });
    await userEvent.hover(button);
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(
      <MessageAction label="Gut" onClick={onClick}>
        <svg aria-hidden="true" />
      </MessageAction>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Gut" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("MessageBranch", () => {
  afterEach(() => vi.restoreAllMocks());

  it("starts on the first branch and shows only it", async () => {
    render(<Branches />);
    expect(await screen.findByText("1 von 3")).toBeInTheDocument();
    expect(branchOf("Antwort A")).not.toHaveClass("hidden");
    expect(branchOf("Antwort B")).toHaveClass("hidden");
    expect(branchOf("Antwort C")).toHaveClass("hidden");
  });

  it("starts on defaultBranch", async () => {
    render(<Branches defaultBranch={1} />);
    expect(await screen.findByText("2 von 3")).toBeInTheDocument();
    expect(branchOf("Antwort B")).not.toHaveClass("hidden");
    expect(branchOf("Antwort A")).toHaveClass("hidden");
  });

  it("steps forward and wraps from the last branch to the first", async () => {
    const onBranchChange = vi.fn();
    render(<Branches defaultBranch={1} onBranchChange={onBranchChange} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Nächste Version/ }));
    expect(screen.getByText("3 von 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Nächste Version/ }));
    expect(screen.getByText("1 von 3")).toBeInTheDocument();
    expect(onBranchChange.mock.calls).toEqual([[2], [0]]);
    expect(branchOf("Antwort A")).not.toHaveClass("hidden");
  });

  it("steps back and wraps from the first branch to the last", async () => {
    const onBranchChange = vi.fn();
    render(<Branches onBranchChange={onBranchChange} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Vorherige Version/ }));
    expect(screen.getByText("3 von 3")).toBeInTheDocument();
    expect(onBranchChange).toHaveBeenCalledWith(2);
    expect(branchOf("Antwort C")).not.toHaveClass("hidden");
  });

  it("renders no selector for a single branch", async () => {
    render(
      <MessageBranch>
        <MessageBranchContent>
          <Message from="assistant" key="only">
            <MessageContent>Einzige Antwort</MessageContent>
          </Message>
        </MessageBranchContent>
        <MessageBranchSelector data-testid="selector">
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
      </MessageBranch>,
    );
    expect(await screen.findByText("Einzige Antwort")).toBeVisible();
    expect(screen.queryByTestId("selector")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("throws when a branch part is used outside MessageBranch", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<MessageBranchPage />)).toThrow(
      "MessageBranch components must be used within MessageBranch",
    );
  });

  it("names the selector group „Versionen“, overridable (fix #3)", async () => {
    const { unmount } = render(<Branches />);
    const group = await screen.findByRole("group", { name: "Versionen" });
    expect(group).toHaveAttribute("data-slot", "button-group");
    unmount();
    render(
      <MessageBranch>
        <MessageBranchContent>
          <span key="1">eins</span>
          <span key="2">zwei</span>
        </MessageBranchContent>
        <MessageBranchSelector aria-label="Antwortversionen">
          <MessageBranchPage />
        </MessageBranchSelector>
      </MessageBranch>,
    );
    expect(await screen.findByRole("group", { name: "Antwortversionen" })).toBeInTheDocument();
  });

  it("announces the page in one persistent polite live region (fix #4)", async () => {
    render(<Branches />);
    const page = await screen.findByText("1 von 3");
    expect(page).toHaveAttribute("aria-live", "polite");
    expect(page).toHaveAttribute("aria-atomic", "true");
    await userEvent.click(screen.getByRole("button", { name: /^Nächste Version/ }));
    expect(screen.getByText("2 von 3")).toBe(page);
  });

  it("names Previous/Next by the version they go to, wrapping like the buttons (fix #4)", async () => {
    render(<Branches />);
    expect(
      await screen.findByRole("button", { name: "Vorherige Version (3 von 3)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nächste Version (2 von 3)" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Nächste Version (2 von 3)" }));
    expect(screen.getByRole("button", { name: "Vorherige Version (1 von 3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nächste Version (3 von 3)" })).toBeInTheDocument();
  });

  it("needs no keys on static branch children (fix #6)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MessageBranch>
        <MessageBranchContent>
          <p>eins</p>
          <p>zwei</p>
        </MessageBranchContent>
      </MessageBranch>,
    );
    await screen.findByText("zwei");
    const keyWarnings = error.mock.calls.filter((c) => String(c[0]).includes("key"));
    expect(keyWarnings).toEqual([]);
  });

  it("puts its props (an id) on the shown branch only, so the id is unique (fix #6)", async () => {
    render(
      <MessageBranch defaultBranch={1}>
        <MessageBranchContent id="antwort" className="extra">
          <p>eins</p>
          <p>zwei</p>
          <p>drei</p>
        </MessageBranchContent>
      </MessageBranch>,
    );
    await screen.findByText("zwei");
    const withId = document.querySelectorAll("#antwort");
    expect(withId).toHaveLength(1);
    expect(withId[0]).toHaveTextContent("zwei");
    expect(withId[0]).toHaveClass("extra", "block");
    expect(screen.getByText("eins").parentElement).toHaveClass("hidden");
  });

  it("follows branch children that shrink below the current index (fix #7)", async () => {
    function Shrinking() {
      const [n, setN] = useState(3);
      return (
        <>
          <button type="button" onClick={() => setN(2)}>
            kürzen
          </button>
          <MessageBranch defaultBranch={2}>
            <MessageBranchContent>
              {["eins", "zwei", "drei"].slice(0, n).map((t) => (
                <p key={t}>{t}</p>
              ))}
            </MessageBranchContent>
            <MessageBranchSelector>
              <MessageBranchPage />
            </MessageBranchSelector>
          </MessageBranch>
        </>
      );
    }
    render(<Shrinking />);
    expect(await screen.findByText("3 von 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "kürzen" }));
    expect(screen.getByText("2 von 2")).toBeInTheDocument();
    expect(screen.getByText("zwei").parentElement).not.toHaveClass("hidden");
  });

  it("has the selector in the DOM when the first render's task ends (fix #7)", async () => {
    const actEnv = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = actEnv.IS_REACT_ACT_ENVIRONMENT;
    actEnv.IS_REACT_ACT_ENVIRONMENT = false;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      // A MutationObserver callback runs at the end of the task that mutated
      // the DOM — before the browser could paint that task's result.
      const firstFrame = new Promise<boolean>((resolve) => {
        const observer = new MutationObserver(() => {
          observer.disconnect();
          resolve(container.querySelector('[role="group"]') !== null);
        });
        observer.observe(container, { childList: true, subtree: true });
      });
      root.render(<Branches />);
      expect(await firstFrame).toBe(true);
    } finally {
      root.unmount();
      container.remove();
      actEnv.IS_REACT_ACT_ENVIRONMENT = previous;
    }
  });
});

describe("MessageBranch controlled (consumer addition)", () => {
  it("shows the controlled branch and reports steps without moving by itself", async () => {
    const onBranchChange = vi.fn();
    render(
      <MessageBranch branch={1} onBranchChange={onBranchChange}>
        <MessageBranchContent>
          <p key="1">eins</p>
          <p key="2">zwei</p>
          <p key="3">drei</p>
        </MessageBranchContent>
        <MessageBranchSelector>
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
      </MessageBranch>,
    );
    expect(await screen.findByText("2 von 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Nächste Version/ }));
    expect(onBranchChange).toHaveBeenCalledWith(2);
    expect(screen.getByText("2 von 3")).toBeInTheDocument();
  });

  it("with totalBranches renders only the given current branch and counts from the prop", async () => {
    function ServerTree() {
      const versions = ["eins", "zwei", "drei", "vier"];
      const [branch, setBranch] = useState(3);
      return (
        <MessageBranch branch={branch} onBranchChange={setBranch} totalBranches={versions.length}>
          <MessageBranchContent>
            <p>{versions[branch]}</p>
          </MessageBranchContent>
          <MessageBranchSelector>
            <MessageBranchPrevious />
            <MessageBranchPage />
            <MessageBranchNext />
          </MessageBranchSelector>
        </MessageBranch>
      );
    }
    render(<ServerTree />);
    expect(screen.getByText("4 von 4")).toBeInTheDocument();
    expect(screen.getByText("vier").parentElement).not.toHaveClass("hidden");
    await userEvent.click(screen.getByRole("button", { name: "Nächste Version (1 von 4)" }));
    expect(screen.getByText("1 von 4")).toBeInTheDocument();
    expect(screen.getByText("eins").parentElement).not.toHaveClass("hidden");
  });

  it("stays uncontrolled without branch", async () => {
    await act(async () => {
      render(<Branches defaultBranch={2} />);
    });
    expect(screen.getByText("3 von 3")).toBeInTheDocument();
  });
});

describe("MessageBranch before the count is known (Codex review)", () => {
  // Oracle: the requested branch is what the server sends and what the first
  // frame shows — `defaultBranch={1}` means the second branch, whether or not
  // MessageBranchContent has registered its children yet.
  it("server-renders the requested defaultBranch, not branch 0", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Branches defaultBranch={1} />);
    const view = within(container);
    const wrapper = (text: string) => view.getByText(text).closest(".group")!.parentElement!;
    expect(wrapper("Antwort B")).not.toHaveClass("hidden");
    expect(wrapper("Antwort A")).toHaveClass("hidden");
    expect(wrapper("Antwort C")).toHaveClass("hidden");
    // The selector needs the registered count; if it is rendered, it agrees.
    const selector = container.querySelector('[role="group"]');
    if (selector) expect(selector).toHaveTextContent("2 von");
  });

  // Oracle: HTML — an `id` is unique in a document.
  it("count-only mode renders its children in one wrapper, so an id occurs once", () => {
    render(
      <MessageBranch branch={0} totalBranches={3}>
        <MessageBranchContent id="answer">
          <p>Absatz 1</p>
          <p>Absatz 2</p>
        </MessageBranchContent>
      </MessageBranch>,
    );
    const withId = document.querySelectorAll("#answer");
    expect(withId).toHaveLength(1);
    expect(withId[0]).toContainElement(screen.getByText("Absatz 1"));
    expect(withId[0]).toContainElement(screen.getByText("Absatz 2"));
    expect(withId[0]).not.toHaveClass("hidden");
  });
});

describe("MessageBranchPage format (consumer translation)", () => {
  // Oracle: a consumer's formatter replaces the default text and receives the
  // 1-based current branch and the total, as the default „N von M" shows them.
  it("renders format(current, total) instead of „N von M“ and follows steps", async () => {
    render(
      <MessageBranch>
        <MessageBranchContent>
          <p key="1">eins</p>
          <p key="2">zwei</p>
          <p key="3">drei</p>
        </MessageBranchContent>
        <MessageBranchSelector aria-label="Versions">
          <MessageBranchNext aria-label="Next version" />
          <MessageBranchPage format={(current, total) => `${current} of ${total}`} />
        </MessageBranchSelector>
      </MessageBranch>,
    );
    expect(await screen.findByText("1 of 3")).toBeInTheDocument();
    expect(screen.queryByText(/von/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next version" }));
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
  });
});

describe("MessageBranchPrevious/Next formatLabel (consumer translation)", () => {
  // Oracle: the consumer's formatter names the buttons from the 1-based version
  // each one goes to and the total — the same numbers the German default uses.
  it("names Previous/Next through formatLabel and follows steps", async () => {
    render(
      <MessageBranch>
        <MessageBranchContent>
          <p key="1">eins</p>
          <p key="2">zwei</p>
          <p key="3">drei</p>
        </MessageBranchContent>
        <MessageBranchSelector aria-label="Versions">
          <MessageBranchPrevious formatLabel={(t, n) => `Previous version (${t} of ${n})`} />
          <MessageBranchNext formatLabel={(t, n) => `Next version (${t} of ${n})`} />
        </MessageBranchSelector>
      </MessageBranch>,
    );
    expect(await screen.findByRole("button", { name: "Previous version (3 of 3)" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next version (2 of 3)" }));
    expect(screen.getByRole("button", { name: "Previous version (1 of 3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next version (3 of 3)" })).toBeInTheDocument();
  });
});
