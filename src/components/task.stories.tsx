import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTextIcon } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { keyboardFocusRings } from "../test/fixtures/focus-ring";
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
    // The default trigger row is a native button (DS fix on top of AI Elements):
    // focusable, and Enter toggles it.
    const trigger = canvas.getByRole("button", { name: "Prüfungsordnungen durchsuchen" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    trigger.focus();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{Enter}");
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

/**
 * Keyboard focus: the trigger shows the DS focus ring — the same computed
 * ring as the `Button` before it (DS fix on top of AI Elements).
 */
export const KeyboardFocus: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Button variant="outline">Referenz</Button>
      <Task>
        <TaskTrigger title="Prüfungsordnungen durchsuchen" />
        <TaskContent>
          <TaskItem>Suche nach „Anmeldefrist" in der Wissensdatenbank</TaskItem>
        </TaskContent>
      </Task>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reference = canvas.getByRole("button", { name: "Referenz" });
    const target = canvas.getByRole("button", { name: "Prüfungsordnungen durchsuchen" });
    const rings = await keyboardFocusRings(reference, target);
    if (!rings) return; // outside Vitest: no real keyboard
    // The Button recipe: a 2px ring outside a 2px offset, i.e. a 4px spread shadow.
    await expect(rings.reference.boxShadow).toMatch(/rgb\(\d+, \d+, \d+\) 0px 0px 0px 4px/);
    await expect(rings.target).toEqual(rings.reference);
  },
};
