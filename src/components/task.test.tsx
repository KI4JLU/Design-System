import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";

// Oracle for this file: the AI Elements registry source of `task`
// (https://elements.ai-sdk.dev/api/registry/task.json, the revision the AI
// Elements CLI installed): `Task` is a Collapsible with `defaultOpen = true`;
// `TaskTrigger` is `CollapsibleTrigger asChild` around a `<div>` holding the
// `title` (or the caller's children instead); `TaskItemFile` and `TaskItem`
// are plain `<div>`s.
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

  it("renders the default trigger as a div slotted into the Collapsible trigger", () => {
    render(<Subject />);
    const trigger = triggerOf("Dokumente durchsuchen");
    expect(trigger.tagName).toBe("DIV");
    expect(trigger).toHaveAttribute("data-state", "open");
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

  it("renders a file chip as a div", () => {
    render(<TaskItemFile>bericht.pdf</TaskItemFile>);
    expect(screen.getByText("bericht.pdf").tagName).toBe("DIV");
  });
});
