import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { expect } from "storybook/test";
import { PageHeader } from "./page-header";
import { Button } from "./button";
import { Input } from "./input";

const meta = {
  title: "Primitives/PageHeader",
  component: PageHeader,
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    title: "Elemente",
    description: "Alle Elemente dieser Organisation.",
  },
  render: (args) => (
    <PageHeader
      {...args}
      actions={
        <>
          <Button variant="outline">Importieren</Button>
          <Button>
            <Plus width="1em" height="1em" aria-hidden />
            Element anlegen
          </Button>
        </>
      }
    />
  ),
};

/** A subordinate row (children) for toolbars/filters below the title. */
export const WithToolbarRow: Story = {
  args: { title: "Team" },
  render: (args) => (
    <PageHeader {...args} actions={<Button>Neu</Button>}>
      <Input placeholder="Suchen…" className="max-w-xs" />
    </PageHeader>
  ),
};

/**
 * `headingLevel` sets the title's level in the document outline. The default
 * is `1`; here `2`, as a page needs that already carries its own `<h1>`. The
 * typography tokens do **not** depend on the level — the heading looks the
 * same at every level, it just sits at a different place in the outline.
 */
export const AtHeadingLevelTwo: Story = {
  args: {
    title: "Elemente",
    description: "Dieselbe Optik, eine Stufe tiefer im Outline.",
    headingLevel: 2,
  },
  play: async ({ canvasElement }) => {
    const heading = canvasElement.querySelector("h2");
    // Oracle: the element level itself, plus the resolved font size from
    // tokens.css (`--text-headline-md: 24px`) — the level must not change the
    // typography, and no `<h1>` may be produced any more.
    await expect(heading).not.toBeNull();
    await expect(canvasElement.querySelector("h1")).toBeNull();
    await expect(getComputedStyle(heading!).fontSize).toBe("24px");
    await expect(getComputedStyle(heading!).marginTop).toBe("0px");
  },
};
