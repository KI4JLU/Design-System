import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// Oracle for this file: the AI Elements registry source of `message`
// (https://elements.ai-sdk.dev/api/registry/message.json, the revision the
// shadcn CLI installed), read independently of the DS file:
// - `Message` puts `is-user` on a `from="user"` message, `is-assistant` otherwise.
// - `MessageAction` is a `type="button"` Button whose screen-reader name is a
//   sr-only `label || tooltip`; with `tooltip` it is wrapped in a Tooltip.
// - `MessageBranch` keeps the current index (from `defaultBranch`), and
//   `goToPrevious`/`goToNext` wrap around at both ends and call `onBranchChange`.
// - `MessageBranchContent` renders every branch, only the current one without
//   `hidden`; `MessageBranchSelector` renders nothing for one branch.
// - `MessageBranchPage` reads "{current + 1} of {total}" (German literal here:
//   "von", the only change the import makes to it).
// - `MessageResponse` renders its children (streamdown dropped in the import).

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
    const button = screen.getByRole("button", { name: "Neu generieren" });
    await userEvent.hover(button);
    await waitFor(() => expect(button).toHaveAttribute("aria-describedby"));
    const tooltip = document.getElementById(button.getAttribute("aria-describedby")!);
    expect(tooltip).toHaveAttribute("role", "tooltip");
    expect(tooltip).toHaveTextContent("Neu generieren");
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
    const next = await screen.findByRole("button", { name: "Nächste Version" });
    await userEvent.click(next);
    expect(screen.getByText("3 von 3")).toBeInTheDocument();
    await userEvent.click(next);
    expect(screen.getByText("1 von 3")).toBeInTheDocument();
    expect(onBranchChange.mock.calls).toEqual([[2], [0]]);
    expect(branchOf("Antwort A")).not.toHaveClass("hidden");
  });

  it("steps back and wraps from the first branch to the last", async () => {
    const onBranchChange = vi.fn();
    render(<Branches onBranchChange={onBranchChange} />);
    await userEvent.click(await screen.findByRole("button", { name: "Vorherige Version" }));
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

  it("puts the selector in a role=group", async () => {
    render(<Branches />);
    const previous = await screen.findByRole("button", { name: "Vorherige Version" });
    expect(previous.closest('[role="group"]')).toHaveAttribute("data-slot", "button-group");
  });

  it("throws when a branch part is used outside MessageBranch", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<MessageBranchPage />)).toThrow(
      "MessageBranch components must be used within MessageBranch",
    );
    spy.mockRestore();
  });
});
