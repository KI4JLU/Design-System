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

/** Untergeordnete Zeile (children) für Toolbars/Filter unter dem Titel. */
export const WithToolbarRow: Story = {
  args: { title: "Team" },
  render: (args) => (
    <PageHeader {...args} actions={<Button>Neu</Button>}>
      <Input placeholder="Suchen…" className="max-w-xs" />
    </PageHeader>
  ),
};

/**
 * `headingLevel` setzt die Stufe des Titels im Dokument-Outline. Standard ist
 * `1`; hier `2`, wie es eine Seite braucht, die ihr `<h1>` schon selbst trägt.
 * Die Typo-Tokens hängen **nicht** an der Stufe — die Überschrift sieht auf
 * jeder Stufe gleich aus, sie steht nur an anderer Stelle im Outline.
 */
export const AtHeadingLevelTwo: Story = {
  args: {
    title: "Elemente",
    description: "Dieselbe Optik, eine Stufe tiefer im Outline.",
    headingLevel: 2,
  },
  play: async ({ canvasElement }) => {
    const heading = canvasElement.querySelector("h2");
    // Orakel: die Elementstufe selbst, plus die aufgelöste Schriftgröße aus
    // tokens.css (`--text-headline-md: 24px`) — die Stufe darf die Typografie
    // nicht verändern, und ein `<h1>` darf nicht mehr entstehen.
    await expect(heading).not.toBeNull();
    await expect(canvasElement.querySelector("h1")).toBeNull();
    await expect(getComputedStyle(heading!).fontSize).toBe("24px");
    await expect(getComputedStyle(heading!).marginTop).toBe("0px");
  },
};
