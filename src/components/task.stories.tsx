import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileSpreadsheet, FileText, ListChecks } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";

const meta = {
  title: "Components/Task",
  component: Task,
  decorators: [
    (Story) => (
      <div className="max-w-xl space-y-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Task>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two tasks of an agent run: the files each line touched as inline chips.
 * The second task is folded (`defaultOpen={false}`) and uses its own icon.
 */
export const WithFiles: Story = {
  render: () => (
    <>
      <Task>
        <TaskTrigger title="Suche in den Quellen" />
        <TaskContent>
          <TaskItem>Suche nach „Anmeldefrist Modulprüfung“</TaskItem>
          <TaskItem>
            Lese{" "}
            <TaskItemFile>
              <FileText aria-hidden="true" />
              PO_Informatik_2024.pdf
            </TaskItemFile>{" "}
            und{" "}
            <TaskItemFile>
              <FileText aria-hidden="true" />
              PO_Mathematik_2023.pdf
            </TaskItemFile>
          </TaskItem>
          <TaskItem>
            Prüfe{" "}
            <TaskItemFile>
              <FileSpreadsheet aria-hidden="true" />
              Termine_WS.xlsx
            </TaskItemFile>
          </TaskItem>
        </TaskContent>
      </Task>
      <Task defaultOpen={false}>
        <TaskTrigger title="Antwort prüfen" icon={ListChecks} />
        <TaskContent>
          <TaskItem>3 Zitate gegen die Quellen geprüft</TaskItem>
        </TaskContent>
      </Task>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: "Suche in den Quellen" });
    const second = canvas.getByRole("button", { name: "Antwort prüfen" });
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(second).toHaveAttribute("aria-expanded", "false");

    const chip = canvas.getByText("PO_Informatik_2024.pdf");
    await expect(chip.tagName).toBe("SPAN");
    // The chip sits on the text line, not on a line of its own.
    const line = chip.parentElement as HTMLElement;
    await expect(chip.getBoundingClientRect().top).toBeLessThan(line.getBoundingClientRect().top + 8);

    second.focus();
    await userEvent.keyboard("{Enter}");
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("3 Zitate gegen die Quellen geprüft")).toBeVisible();
    await userEvent.click(first);
    await expect(canvas.queryByText("PO_Informatik_2024.pdf")).not.toBeInTheDocument();
  },
};
