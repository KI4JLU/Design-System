import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
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
