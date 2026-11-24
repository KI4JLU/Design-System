import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { useState, type ReactNode } from "react";
import { BookOpen, Plus, Search, Star, Users } from "lucide-react";
import {
  SectionedGridLayout,
  type SectionedGridSection,
} from "./sectioned-grid-layout";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/card";
import * as menuItemStories from "../components/menu-item.stories";

// Portable story: the free-form section body (`body`) is an existing
// component story — the MenuItem list stands in here for a whole panel in the
// section body (catalog/discover) that isn't a card grid.
const { SelectMenu: PanelBody } = composeStories(menuItemStories, {});

// The grid cells are built locally here and deliberately app-neutral: no
// existing Card story has the shape of a grid cell (Card.Basic brings a
// `max-w-sm` and a stats body, Card.Interactive renders its own two-column
// grid). The density of a real cell is kept: title, meta line, a status
// badge, an action.
const CELLS = [
  { name: "Sammlung A", meta: "Zuletzt aktiv vor 2 Std.", tone: "primary", state: "Geteilt" },
  { name: "Sammlung B", meta: "Zuletzt aktiv vor 3 Tagen", tone: "neutral", state: "Privat" },
  { name: "Sammlung C", meta: "Zuletzt aktiv vor 1 Woche", tone: "neutral", state: "Privat" },
  { name: "Sammlung D", meta: "Zuletzt aktiv vor 2 Wochen", tone: "primary", state: "Geteilt" },
] as const;

function DemoCells({ count = CELLS.length }: { count?: number }) {
  return (
    <>
      {CELLS.slice(0, count).map((cell) => (
        <Card key={cell.name} interactive className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-stack-sm">
              <CardTitle className="text-body-base">{cell.name}</CardTitle>
              <Badge tone={cell.tone}>{cell.state}</Badge>
            </div>
            <CardDescription>{cell.meta}</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button variant="outline" size="sm">
              Öffnen
            </Button>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}

/** The "Neu anlegen" cell: the first cell of the same grid, not a row of its own. */
function CreateCell({ label }: { label: string }) {
  return (
    <Button
      variant="outline"
      className="h-full min-h-40 w-full flex-col gap-stack-sm border-dashed"
      aria-label={label}
    >
      <Plus width="1.5em" height="1.5em" aria-hidden />
      <span>{label}</span>
    </Button>
  );
}

const meta = {
  title: "Templates/SectionedGridLayout",
  component: SectionedGridLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
  // Base args only for the props table: every story renders through `render`
  // with its own state, because the open/closed state lives with the consumer
  // and can only exist as local state in Storybook.
  args: {
    label: "Sammlungen",
    title: "Sammlungen",
    sections: [],
    cols: 3,
  },
  argTypes: {
    sections: { control: false },
    title: { control: false },
    description: { control: false },
    actions: { control: false },
  },
} satisfies Meta<typeof SectionedGridLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Four sections, as an overview page has them — and all three body forms:
 * card grid with a create cell, free-form panel, empty state. The state lives
 * (as in an app) outside the template; here it is local story state instead
 * of a context.
 */
const Interactive = ({
  title,
  headingLevel,
}: {
  title?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}) => {
  const [open, setOpen] = useState<Record<string, boolean>>({
    favorites: true,
    discover: false,
    shared: false,
    mine: true,
  });
  const toggle = (id: string) => (isOpen: boolean) =>
    setOpen((prev) => ({ ...prev, [id]: isOpen }));

  const sections: SectionedGridSection[] = [
    {
      id: "favorites",
      title: "Favoriten",
      icon: <Star className="text-primary" width="1em" height="1em" aria-hidden />,
      count: 2,
      isOpen: open.favorites,
      onOpenChange: toggle("favorites"),
      items: <DemoCells count={2} />,
    },
    {
      id: "discover",
      title: "Entdecken",
      icon: <Search className="text-on-surface-variant" width="1em" height="1em" aria-hidden />,
      isOpen: open.discover,
      onOpenChange: toggle("discover"),
      body: <PanelBody />,
    },
    {
      id: "shared",
      title: "Mit mir geteilt",
      icon: <Users className="text-on-surface-variant" width="1em" height="1em" aria-hidden />,
      count: 0,
      isOpen: open.shared,
      onOpenChange: toggle("shared"),
      emptyState: "Noch nichts geteilt.",
    },
    {
      id: "mine",
      title: "Meine Sammlungen",
      icon: <BookOpen className="text-on-surface-variant" width="1em" height="1em" aria-hidden />,
      count: 4,
      isOpen: open.mine,
      onOpenChange: toggle("mine"),
      headerAction: (
        <Button variant="outline" size="sm">
          <Plus width="1em" height="1em" aria-hidden />
          <span>Neu</span>
        </Button>
      ),
      createCell: <CreateCell label="Neue Sammlung" />,
      items: <DemoCells />,
    },
  ];

  return (
    <SectionedGridLayout
      label="Sammlungen"
      title={title}
      headingLevel={headingLevel}
      description="Erklärzeile unter dem Titel — was auf dieser Seite gruppiert ist."
      actions={
        <span className="text-body-base text-on-surface-variant">6 Sammlungen</span>
      }
      sections={sections}
    />
  );
};

/**
 * Standard: a title row, then sections. Two are open, two closed — the state
 * comes from outside, and the template never changes it itself.
 */
export const Standard: Story = {
  render: () => <Interactive title="Sammlungen" />,
};

const AllClosed = () => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const sections: SectionedGridSection[] = ["Favoriten", "Entdecken", "Mit mir geteilt"].map(
    (name, index) => ({
      id: `s${index}`,
      title: name,
      count: index * 2,
      isOpen: open[`s${index}`] ?? false,
      onOpenChange: (isOpen: boolean) =>
        setOpen((prev) => ({ ...prev, [`s${index}`]: isOpen })),
      items: <DemoCells count={2} />,
    }),
  );
  return <SectionedGridLayout label="Sammlungen" title="Sammlungen" sections={sections} />;
};

/**
 * All sections closed: only the header rows remain. The body is
 * **unmounted**, not hidden with CSS — expanding mounts it again (and so
 * triggers a reload, if the body brings one).
 */
export const AllCollapsed: Story = {
  render: () => <AllClosed />,
};

/**
 * **One level lower, all of it.** `headingLevel={2}` shifts the page title
 * **and** every section heading together — title `h2`, sections `h3`. The two
 * levels are a single number and its successor, no longer two fixed values:
 * before, a forced `h1` and a forced `h2` stood side by side and couldn't move
 * together.
 *
 * For a page whose `<h1>` is elsewhere (admin frame, CMS) — there it is the
 * difference between a clean outline and a second `<h1>`.
 */
export const NestedHeadingLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-stack-md">
      <div className="px-margin-page pt-8">
        <h1 className="m-0 font-headline-md text-display-lg text-on-surface">Administration</h1>
      </div>
      <Interactive title="Sammlungen" headingLevel={2} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Oracle: the document outline (ARIA in HTML: h1–h6 -> `heading` + level).
    // Exactly one element at level 1, and it belongs to the frame, not the
    // template; the four sections are at level 3.
    const levels = [...canvasElement.querySelectorAll("h1, h2, h3, h4, h5, h6")].map(
      (heading) => heading.tagName,
    );
    await expect(levels).toEqual(["H1", "H2", "H3", "H3", "H3", "H3"]);
  },
};
