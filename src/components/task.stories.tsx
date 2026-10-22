import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTextIcon } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";

/**
 * AI Elements `Task` (https://elements.ai-sdk.dev/api/registry/task.json),
 * imported with the AI Elements CLI. Open by default.
 */
const meta = {
  title: "Components/Task",
  component: Task,
} satisfies Meta<typeof Task>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One agent task with its items; file names as `TaskItemFile` chips. */
export const WithFiles: Story = {
  render: () => (
    <Task>
      <TaskTrigger title="Prüfungsordnungen durchsuchen" />
      <TaskContent>
        <TaskItem>Suche nach „Anmeldefrist" in der Wissensdatenbank</TaskItem>
        <TaskItem>
          Gelesen:{" "}
          <TaskItemFile>
            <FileTextIcon className="size-4" />
            <span>po-informatik-2024.pdf</span>
          </TaskItemFile>{" "}
          <TaskItemFile>
            <FileTextIcon className="size-4" />
            <span>po-mathematik-2023.pdf</span>
          </TaskItemFile>
        </TaskItem>
        <TaskItem>Zwei Fristen gefunden</TaskItem>
      </TaskContent>
    </Task>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("po-informatik-2024.pdf")).toBeVisible();
    const trigger = canvas.getByText("Prüfungsordnungen durchsuchen").closest("[aria-expanded]");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};

/** The same in the dark theme. */
export const WithFilesDark: Story = {
  ...WithFiles,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await WithFiles.play!(context);
  },
};
