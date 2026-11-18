import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilePreview } from "./file-preview";
import { HoverPreview, HoverPreviewGroup } from "./hover-preview";

const meta = {
  title: "Components/HoverPreview",
  component: HoverPreview,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HoverPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

const files = [
  { name: "Pruefungsordnung-2026.pdf", text: "Prüfungsordnung\n\nDie Prüfung besteht aus einer Klausur von 90 Minuten. Wiederholungen sind zweimal möglich." },
  { name: "Modulhandbuch.md", text: "# Modulhandbuch\n\nPflichtmodule im ersten Studienjahr: Mathematik I, Informatik I, Physik." },
  { name: "Notizen.txt", text: "Sprechstunde: dienstags 10 bis 12 Uhr.\nRaum B 104." },
  { name: "Termine.md", text: "# Termine\n\nRückmeldung bis 15. Januar.\nVorlesungsbeginn 14. April." },
  { name: "FAQ.md", text: "# Häufige Fragen\n\nWie melde ich mich zur Prüfung an?\nÜber das Prüfungsportal." },
];

const row =
  "flex h-9 w-full cursor-pointer items-center rounded-lg border-0 bg-transparent px-3 text-left text-sm text-on-surface hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

/**
 * A list in a group. Move the pointer across the rows: nothing opens. Rest
 * on a row: its preview opens. From then on the one card follows the pointer
 * from row to row, until the pointer has left the list for a moment.
 */
export const List: Story = {
  args: { content: null, children: <span /> },
  render: () => (
    <div className="ml-56 flex w-64 flex-col gap-0.5">
      <HoverPreviewGroup side="left">
        {files.map((f) => (
          <HoverPreview key={f.name} content={<FilePreview filename={f.name} text={f.text} />}>
            <button type="button" className={row}>
              {f.name}
            </button>
          </HoverPreview>
        ))}
      </HoverPreviewGroup>
    </div>
  ),
};

/** One trigger without a group: the same rest trigger, a card of its own. */
export const Single: Story = {
  args: { content: null, children: <span /> },
  render: () => (
    <div className="pt-56">
      <HoverPreview content={<FilePreview filename={files[0].name} text={files[0].text} />}>
        <button type="button" className={`${row} w-64`}>
          {files[0].name}
        </button>
      </HoverPreview>
    </div>
  ),
};
