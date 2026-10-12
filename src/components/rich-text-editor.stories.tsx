import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect } from "storybook/test";
import { RichTextEditor } from "./rich-text-editor";
import { TooltipProvider } from "./tooltip";

const meta = {
  title: "Components/RichTextEditor",
  component: RichTextEditor,
  decorators: [(Story) => <TooltipProvider><Story /></TooltipProvider>],
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const sample = `# Prüfungsordnung

Die Anmeldung läuft über **FlexNow**, spätestens *zwei Wochen* vor der Prüfung.

> Fristen sind Ausschlussfristen.

- Modul wählen
- Termin bestätigen

| Prüfung | Dauer |
| --- | --- |
| mündlich | 30 min |
`;

export const Playground: Story = {
  args: { value: sample, placeholder: "Text eingeben …", "aria-label": "Inhalt" },
};

/** The markdown the editor reports, live. */
export const WithMarkdownOutput: Story = {
  render: function Render() {
    const [md, setMd] = React.useState(sample);
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <RichTextEditor value={sample} onChange={setMd} aria-label="Inhalt" />
        <pre className="m-0 overflow-auto rounded-xl bg-surface-container-high p-4 font-mono text-sm text-on-surface">{md}</pre>
      </div>
    );
  },
};

/*
 * ORACLE for the two invalid stories: the error token as the browser resolves
 * it on the message, an element styled by `text-error` alone.
 */
const errorColor = (root: HTMLElement) => getComputedStyle(root.querySelector("#content-error")!).color;

/** Invalid, framed: the frame turns red and the textbox points at the message. */
export const Invalid: Story = {
  render: () => (
    <div className="grid gap-2">
      <RichTextEditor className="h-64" aria-label="Inhalt" placeholder="Text eingeben …" aria-invalid aria-describedby="content-error" />
      <span id="content-error" className="text-sm text-error">Inhalt ist erforderlich</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>("[data-slot=rich-text-editor]")!;
    await expect(getComputedStyle(frame).borderTopColor).toBe(errorColor(canvasElement));
  },
};

/** Invalid, `bare` (inside a dialog that frames it): no border, so the placeholder turns red. */
export const InvalidBare: Story = {
  render: () => (
    <div className="grid h-72 gap-2 rounded-xl border border-outline-variant p-0">
      <RichTextEditor bare className="min-h-0 flex-1" aria-label="Inhalt" placeholder="Text eingeben …" aria-invalid aria-describedby="content-error" />
      <span id="content-error" className="px-4 pb-2 text-sm text-error">Inhalt ist erforderlich</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const empty = canvasElement.querySelector("[role=textbox] p.is-editor-empty")!;
    await expect(getComputedStyle(empty, "::before").color).toBe(errorColor(canvasElement));
  },
};
