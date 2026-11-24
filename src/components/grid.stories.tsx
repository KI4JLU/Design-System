import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Grid } from "./grid";
import { Card, CardHeader, CardTitle, CardDescription } from "./card";

const meta = {
  title: "Primitives/Grid",
  component: Grid,
  argTypes: {
    cols: { control: "select", options: [1, 2, 3, 4, "auto"] },
    gap: { control: "select", options: ["sm", "md", "lg", "gutter"] },
    asChild: { control: false },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `cols` is the desktop column count; the wrap to 1 column (mobile) is built in. */
export const Playground: Story = {
  args: { cols: 3, gap: "gutter" },
  render: (args) => (
    <Grid {...args}>
      {["Element A", "Element B", "Element C"].map((name) => (
        <Card key={name}>
          <CardHeader>
            <CardTitle className="text-body-base">{name}</CardTitle>
            <CardDescription>Zuletzt aktiv vor 2 Std.</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </Grid>
  ),
};

/**
 * `cols="auto"` fills as many tracks as FIT, so the count follows the
 * container's width instead of Tailwind's breakpoints.
 *
 * WHY IT IS MEASURED AND NOT JUST SHOWN. This is the variant a card wall wants,
 * and the failure it exists to fix is invisible in a class-name assertion:
 * `cols={3}` reaches three columns only at `xl`, so every width from 768px to
 * 1279px renders TWO columns with room for three. Only a browser can say how
 * many tracks were actually created.
 *
 * ORACLE: Chromium's resolved `grid-template-columns`, read back through
 * `getComputedStyle` as a list of used track sizes. It is the browser's own
 * answer to "how many columns are there", not a value this repo reports about
 * itself, and it is what a class-only assertion would miss entirely.
 */
export const AutoFillsToWidth: Story = {
  args: { cols: "auto", gap: "gutter" },
  render: (args) => (
    <div style={{ width: 960 }}>
      <Grid {...args} data-testid="auto-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-body-base">Element {i + 1}</CardTitle>
              <CardDescription>Zuletzt aktiv vor 2 Std.</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Grid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement).getByTestId("auto-grid");
    const tracks = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean);

    /* 960px at a 280px minimum and a 24px gap fits three tracks
       (3*280 + 2*24 = 888 <= 960) and not four (4*280 + 3*24 = 1192). The
       numbered `cols={3}` would give TWO here, which is the bug. */
    await expect(tracks).toHaveLength(3);
  },
};
