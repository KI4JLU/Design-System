import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";

// Oracles: the WAI-ARIA APG disclosure pattern (a focusable button with
// aria-expanded, Enter/Space toggle) — AI Elements' Task fails it, since it
// slots a <div> into the trigger — and HTML's content model (a chip that sits
// inside running text must be phrasing content, i.e. not a <div>).

function renderTask(props: React.ComponentProps<typeof Task> = {}) {
  return render(
    <Task {...props}>
      <TaskTrigger title="Suche in den Quellen" />
      <TaskContent>
        <TaskItem>
          Lese <TaskItemFile>Pruefungsordnung.pdf</TaskItemFile>
        </TaskItem>
      </TaskContent>
    </Task>,
  );
}

describe("Task", () => {
  it("is open by default; the trigger is a real button named by its title", () => {
    renderTask();
    const trigger = screen.getByRole("button", { name: "Suche in den Quellen" });
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Pruefungsordnung.pdf")).toBeInTheDocument();
  });

  it("toggles by click and from the keyboard", async () => {
    renderTask();
    const trigger = screen.getByRole("button", { name: "Suche in den Quellen" });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Pruefungsordnung.pdf")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("honours defaultOpen={false}", () => {
    renderTask({ defaultOpen: false });
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the file chip as an inline span inside the task line", () => {
    renderTask();
    const chip = screen.getByText("Pruefungsordnung.pdf");
    expect(chip.tagName).toBe("SPAN");
    expect(chip).toHaveClass("bg-secondary-container", "text-on-secondary-container", "border-outline-variant");
    expect(chip.parentElement).toHaveTextContent("Lese Pruefungsordnung.pdf");
  });

  // Same decision as ReasoningTrigger and ChainOfThoughtHeader (review
  // finding KI-916 r1): no asChild, the trigger is always the button.
  it("TaskTrigger has no asChild and stays a button if it is passed anyway", () => {
    render(
      <Task>
        {/* @ts-expect-error asChild is not part of TaskTriggerProps */}
        <TaskTrigger asChild title="Suche in den Quellen" />
      </Task>,
    );
    const trigger = screen.getByRole("button", { name: "Suche in den Quellen" });
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("takes a custom icon, rendered decorative", () => {
    const Icon = (props: { className?: string }) => <svg data-testid="icon" {...props} />;
    render(
      <Task>
        <TaskTrigger title="Rechnen" icon={Icon} />
      </Task>,
    );
    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button")).toHaveAccessibleName("Rechnen");
  });
});
