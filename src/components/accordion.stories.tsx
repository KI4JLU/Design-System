import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import { Badge } from "./badge";

/**
 * The shadcn/ui `accordion` (https://ui.shadcn.com/r/styles/new-york-v4/accordion.json),
 * imported with the shadcn CLI: Radix Accordion — items fold under their
 * trigger, `type="single"` keeps one open, `type="multiple"` several. The
 * trigger takes any children before its chevron, so a second line (a summary
 * of what is folded) or a trailing count are composed there, not props.
 */
const meta = {
  title: "Components/Accordion",
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { type: "single", collapsible: true },
  render: (args) => (
    <Accordion {...args} className="w-full max-w-xl">
      <AccordionItem value="frist">
        <AccordionTrigger>Wann endet die Anmeldefrist?</AccordionTrigger>
        <AccordionContent>Vier Wochen vor der Prüfung.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="ruecktritt">
        <AccordionTrigger>Kann ich von einer Prüfung zurücktreten?</AccordionTrigger>
        <AccordionContent>Bis eine Woche vor dem Termin, ohne Angabe von Gründen.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="wiederholung">
        <AccordionTrigger>Wie oft darf ich eine Prüfung wiederholen?</AccordionTrigger>
        <AccordionContent>Zweimal; die dritte Wiederholung braucht einen Antrag.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: /Anmeldefrist/ });
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(first);
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(/Vier Wochen/)).toBeVisible();
  },
};

const groups = [
  { id: "stil", title: "Antwortstil", active: ["Kurz und prägnant", "Strukturiert antworten"], total: 4 },
  { id: "sprache", title: "Sprache & Ton", active: [], total: 3 },
];

/** A summary under the title and a count before the chevron: composed in the trigger's children. */
export const WithSummaryAndCount: Story = {
  args: { type: "multiple" },
  render: (args) => (
    <Accordion {...args} className="w-full max-w-xl">
      {groups.map((g) => (
        <AccordionItem key={g.id} value={g.id}>
          <AccordionTrigger className="items-center">
            <span className="min-w-0 flex-1">
              <span className="block">{g.title}</span>
              <span className="block truncate text-xs font-normal text-on-surface-variant">
                {g.active.length ? g.active.join(" · ") : "Keine aktiv"}
              </span>
            </span>
            <Badge>{`${g.active.length} / ${g.total} aktiv`}</Badge>
          </AccordionTrigger>
          <AccordionContent>Die Regeln der Gruppe.</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};
