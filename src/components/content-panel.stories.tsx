import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContentPanel, PanelSection } from "./content-panel";
import { Button } from "./button";
import { Textarea } from "./textarea";

const meta = {
  title: "Components/ContentPanel",
  component: ContentPanel,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ContentPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsEditor: Story = {
  args: { title: "Verhalten der Wissensdatenbank" },
  render: (args) => (
    <div className="flex h-[640px] flex-col">
      <ContentPanel
        {...args}
        onClose={() => {}}
        footer={
          <>
            <Button variant="ghost-destructive">Löschen</Button>
            <div className="flex gap-2"><Button variant="outline">Abbrechen</Button><Button>Speichern</Button></div>
          </>
        }
      >
        <PanelSection title="System-Prompt" aside="0 / 8000" hint="Gib dem Assistenten eine Persona." grow>
          <Textarea className="min-h-48 flex-1" placeholder="z.B. Du bist ein freundlicher Experte …" />
        </PanelSection>
        <PanelSection title="RAG-Anweisungen (fest)" hint="Werden nach deinem Prompt angehängt.">
          <pre className="m-0 whitespace-pre-wrap text-sm text-on-surface-variant">Du bist JustRAG …</pre>
        </PanelSection>
      </ContentPanel>
    </div>
  ),
};
