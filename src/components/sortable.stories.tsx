import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { Card, CardContent, CardTitle } from "./card";
import { Sortable, SortableDropZone, SortableGroup, SortableItem, SortableItemHandle, SortableOverlay } from "./sortable";

/**
 * Drag-to-reorder in groups: a card sorts within its group, and is carried
 * into the other one — whose cards make room and which is marked while it is
 * the target. The order changes on a drop (`onValueCommit`). The whole card
 * is the mouse and touch handle; the grip is the keyboard handle.
 */
const meta = {
  title: "Components/Data Display/Sortable",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const card = (id: string) => (
  <Card className="group/card relative">
    <SortableItemHandle
      label={`Verschieben: ${id}`}
      className="absolute top-0.5 left-1/2 h-5 w-9 -translate-x-1/2 cursor-grab opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100"
    />
    <CardContent className="pt-6">
      <CardTitle>{id}</CardTitle>
    </CardContent>
  </Card>
);

function Board({ favorites = ["Biochemie", "Statistik"] }: { favorites?: string[] }) {
  const [value, setValue] = useState<Record<string, string[]>>({ favorites, rest: ["Physik", "Recht", "Informatik"] });
  const grid = "grid grid-cols-3 gap-4";
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Sortable value={value} onValueCommit={setValue}>
        {value.favorites.length > 0 ? (
          <SortableGroup value="favorites" items={value.favorites} className={grid}>
            {value.favorites.map((id) => <SortableItem key={id} value={id}>{card(id)}</SortableItem>)}
          </SortableGroup>
        ) : (
          <SortableDropZone group="favorites">Hierher ziehen, um ein Thema zu favorisieren</SortableDropZone>
        )}
        <SortableGroup value="rest" items={value.rest} className={grid}>
          {value.rest.map((id) => <SortableItem key={id} value={id}>{card(id)}</SortableItem>)}
        </SortableGroup>
        <SortableOverlay>{({ value: id }) => card(id)}</SortableOverlay>
      </Sortable>
    </div>
  );
}

/** Two groups of cards. */
export const Groups: Story = {
  render: () => <Board />,
  // Oracle: every card has a named keyboard handle; the groups are marked as such.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Verschieben: Physik" })).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll("[data-slot='sortable-group']")).toHaveLength(2);
    await expect(canvasElement.querySelectorAll("[data-slot='sortable-item']")).toHaveLength(5);
  },
};

/** An empty group shows a drop zone only while a card is dragged. */
export const EmptyGroup: Story = {
  render: () => <Board favorites={[]} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText("Hierher ziehen, um ein Thema zu favorisieren")).toBeNull();
  },
};
