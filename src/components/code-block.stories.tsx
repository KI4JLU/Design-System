import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodeBlock } from "./code-block";

const EMBED_SNIPPET = `<!-- Chat-Widget Embed -->
<script
  src="https://example.com/widget.js"
  data-widget-id="w_a1b2c3"
  defer
></script>`;

const meta = {
  title: "Components/Data Display/CodeBlock",
  component: CodeBlock,
  args: { code: EMBED_SNIPPET },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Deliberately fixed dark in BOTH themes (editor look) — the `code-surface`
 * tokens deliberately have no dark-mode override. The copy button writes the
 * code to the clipboard and confirms for ~2 s.
 */
export const Playground: Story = {};

/** With the language in the header, and collapsible. */
export const WithLanguage: Story = {
  args: {
    code: 'print("Hello, World!")',
    language: "python",
    collapsible: true,
  },
};

/** Custom labels, e.g. for English-language interfaces. */
export const CustomLabels: Story = {
  args: {
    code: 'npm install "@ki4jlu/design-system"',
    copyLabel: "Copy code",
    copiedLabel: "Copied",
  },
};
