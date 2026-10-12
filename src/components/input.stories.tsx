import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Search } from "lucide-react";
import { Input } from "./input";

const meta = {
  title: "Components/Input",
  component: Input,
  args: { placeholder: "Suchen…" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "inline", "title"],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
  args: { disabled: true, value: "Nicht editierbar" },
};

/**
 * Suchfeld-Muster: dekoratives Icon im Feld (`leadingIcon`). Der zugängliche
 * Name kommt weiterhin vom Label bzw. `aria-label`.
 */
export const LeadingIcon: Story = {
  args: {
    leadingIcon: <Search />,
    type: "search",
    "aria-label": "Konversationen durchsuchen",
    placeholder: "Suchen…",
  },
};

/** `aria-invalid` steuert die Fehler-Optik (rot + roter Fokusring). */
export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "not-an-email", type: "email" },
};

/**
 * Randloses In-Flow-Feld für die Bearbeitung direkt in der Zeile — der Rahmen
 * kommt von der umgebenden Zeile, nicht vom Feld (z. B. Regel-Editor).
 */
export const Inline: Story = {
  render: () => (
    <div className="flex max-w-sm items-center gap-3 rounded-field border border-outline-variant bg-surface px-4 py-3">
      <input type="checkbox" defaultChecked aria-label="Regel aktiv" />
      <Input
        variant="inline"
        defaultValue="Antworte immer auf Deutsch."
        aria-label="Regel bearbeiten"
      />
    </div>
  ),
};

/**
 * `title`: an editable heading in a dialog's header row. Borderless, so an
 * invalid title has no frame to turn red — its placeholder does instead (a
 * required title left empty is when the placeholder shows). The message beside
 * it is the caller's; `aria-describedby` points the field at it.
 */
export const TitleInvalid: Story = {
  render: () => (
    <div className="flex h-14 max-w-xl items-center gap-3 border-b border-outline-variant px-5">
      <div className="min-w-0 flex-1">
        <Input variant="title" placeholder="Titel" aria-label="Titel" aria-invalid aria-describedby="title-error" />
      </div>
      <span id="title-error" className="shrink-0 text-sm text-error">Titel ist erforderlich</span>
    </div>
  ),
  // ORACLE: the error token as the browser resolves it on the message, an
  // element styled by `text-error` alone, not by the variant under test.
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input")!;
    const message = canvasElement.querySelector("#title-error")!;
    await expect(getComputedStyle(input, "::placeholder").color).toBe(getComputedStyle(message).color);
  },
};

/** The same field while valid keeps the muted placeholder. */
export const Title: Story = {
  render: () => (
    <div className="flex h-14 max-w-xl items-center gap-3 border-b border-outline-variant px-5">
      <Input variant="title" placeholder="Titel" aria-label="Titel" />
      <span id="title-ref" className="sr-only text-error">ref</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector("input")!;
    const errorRef = canvasElement.querySelector("#title-ref")!;
    await expect(getComputedStyle(input, "::placeholder").color).not.toBe(getComputedStyle(errorRef).color);
  },
};
