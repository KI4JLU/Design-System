import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";

// Oracle for this file: the AI Elements registry source of `task`
// (https://elements.ai-sdk.dev/api/registry/task.json, the revision the AI
// Elements CLI installed): `Task` is a Collapsible with `defaultOpen = true`;
// `TaskTrigger` is `CollapsibleTrigger asChild` around a default row holding
// the `title` (or the caller's children instead); `TaskItemFile` and
// `TaskItem` are plain `<div>`s. One deviation, tested in "keyboard": the
// default row is a native <button> (WAI-ARIA APG disclosure pattern: the
// control is a button, focusable, Enter and Space toggle it) instead of
// upstream's unfocusable <div>.
function Subject(props: { defaultOpen?: boolean }) {
  return (
    <Task {...props}>
      <TaskTrigger title="Dokumente durchsuchen" />
      <TaskContent>
        <TaskItem>
          Gelesen: <TaskItemFile>po.pdf</TaskItemFile>
        </TaskItem>
      </TaskContent>
    </Task>
  );
}

const triggerOf = (title: string) => screen.getByText(title).closest("[aria-expanded]")!;

describe("Task", () => {
  it("is open by default and shows its items", () => {
    render(<Subject />);
    expect(triggerOf("Dokumente durchsuchen")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("po.pdf")).toBeInTheDocument();
  });

  describe("keyboard (WAI-ARIA disclosure: a focusable button toggled by Enter and Space)", () => {
    it("renders the default trigger as a native button named by the title", () => {
      render(<Subject />);
      const trigger = screen.getByRole("button", { name: "Dokumente durchsuchen" });
      expect(trigger.tagName).toBe("BUTTON");
      expect(trigger).toHaveAttribute("type", "button");
      expect(trigger).toHaveAttribute("data-state", "open");
    });

    it("is reached with Tab and toggles with Enter and Space", async () => {
      const user = userEvent.setup();
      render(<Subject />);
      const trigger = screen.getByRole("button", { name: "Dokumente durchsuchen" });
      await user.tab();
      expect(trigger).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await user.keyboard(" ");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("collapses when the trigger is clicked", () => {
    render(<Subject />);
    fireEvent.click(triggerOf("Dokumente durchsuchen"));
    expect(triggerOf("Dokumente durchsuchen")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("po.pdf")).not.toBeInTheDocument();
  });

  it("starts closed with defaultOpen={false}", () => {
    render(<Subject defaultOpen={false} />);
    expect(triggerOf("Dokumente durchsuchen")).toHaveAttribute("aria-expanded", "false");
  });

  it("uses trigger children instead of the default markup", () => {
    render(
      <Task>
        <TaskTrigger title="unbenutzt">
          <button type="button">Eigener Auslöser</button>
        </TaskTrigger>
      </Task>,
    );
    expect(screen.getByRole("button", { name: "Eigener Auslöser" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.queryByText("unbenutzt")).not.toBeInTheDocument();
  });

  it("ignores asChild={false} instead of nesting the default button in a second one", () => {
    // Oracle: the defect — spread props overrode the outer asChild, so Radix
    // rendered its own button around the default button (nested interactive
    // elements). asChild is not a prop any more (the directive fails tsc if
    // it becomes one again) and is forced at runtime: exactly one button.
    const { container } = render(
      <Task>
        {/* @ts-expect-error asChild is not a TaskTrigger prop */}
        <TaskTrigger asChild={false} title="Dokumente durchsuchen" />
      </Task>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(container.querySelector("button button")).toBeNull();
    expect(screen.getByRole("button", { name: "Dokumente durchsuchen" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("renders a file chip as a div", () => {
    render(<TaskItemFile>bericht.pdf</TaskItemFile>);
    expect(screen.getByText("bericht.pdf").tagName).toBe("DIV");
  });
});
