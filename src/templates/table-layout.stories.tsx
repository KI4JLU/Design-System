import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { TableLayout } from "./table-layout";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Input } from "../components/input";
import * as selectStories from "../components/select.stories";

// Portable stories: the toolbar's model filter is the Select's Basic story —
// reused instead of mocked anew.
const { Basic: ModelSelect } = composeStories(selectStories, {});

const meta = {
  title: "Templates/TableLayout",
  component: TableLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TableLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  ["Element A", "Gruppe 1", "online"],
  ["Element B", "Gruppe 2", "online"],
  ["Element C", "Gruppe 3", "offline"],
] as const;

export const Admin: Story = {
  args: {
    title: "Elemente",
    description: "Alle Elemente dieser Organisation.",
  },
  render: (args) => (
    <TableLayout
      {...args}
      actions={
        <Button>
          <Plus width="1em" height="1em" aria-hidden />
          Element anlegen
        </Button>
      }
      toolbar={
        <>
          <Input placeholder="Suchen…" aria-label="Elemente durchsuchen" className="max-w-xs" />
          <ModelSelect />
        </>
      }
      footer={
        <>
          <span className="text-sm text-on-surface-variant">1–3 von 12</span>
          <div className="flex gap-stack-sm">
            <Button variant="outline" size="sm">
              Zurück
            </Button>
            <Button variant="outline" size="sm">
              Weiter
            </Button>
          </div>
        </>
      }
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-outline-variant text-on-surface-variant">
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Bereich</th>
            <th className="p-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {rows.map(([name, bereich, status]) => (
            <tr key={name}>
              <td className="p-4 font-medium text-on-surface">{name}</td>
              <td className="p-4 text-on-surface-variant">{bereich}</td>
              <td className="p-4">
                {status === "online" ? (
                  <Badge tone="success">Online</Badge>
                ) : (
                  <Badge tone="neutral">Offline</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableLayout>
  ),
};
