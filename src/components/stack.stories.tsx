import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Stack } from "./stack";

const meta = {
  title: "Primitives/Stack",
  component: Stack,
  argTypes: {
    direction: { control: "select", options: ["column", "row"] },
    gap: { control: "select", options: ["none", "sm", "md", "lg", "gutter"] },
    align: { control: "select", options: ["start", "center", "end", "stretch", "baseline"] },
    justify: { control: "select", options: ["start", "center", "end", "between"] },
    asChild: { control: false },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ children }: { children: ReactNode }) => (
  <div className="rounded bg-surface-container p-4 text-sm text-on-surface">{children}</div>
);

export const Playground: Story = {
  args: { gap: "md" },
  render: (args) => (
    <Stack {...args} className="max-w-sm">
      <Box>Element 1</Box>
      <Box>Element 2</Box>
      <Box>Element 3</Box>
    </Stack>
  ),
};

/** Die Gap-Stufen sind die Spacing-Tokens: stack-sm (8), md (16), lg (32), gutter (24). */
export const GapScale: Story = {
  render: () => (
    <Stack gap="gutter" className="max-w-sm">
      {(["sm", "md", "lg", "gutter"] as const).map((gap) => (
        <Stack key={gap} gap={gap}>
          <Box>gap=&quot;{gap}&quot;</Box>
          <Box>…</Box>
        </Stack>
      ))}
    </Stack>
  ),
};

/** Zeile mit auseinandergeschobenen Enden — das Kopfzeilen-Muster. */
export const RowBetween: Story = {
  render: () => (
    <Stack direction="row" justify="between" align="center" className="max-w-sm">
      <Box>Titel</Box>
      <Box>Aktion</Box>
    </Stack>
  ),
};
