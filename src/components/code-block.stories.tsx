import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodeBlock } from "./code-block";

const EMBED_SNIPPET = `<!-- Chat-Widget Embed -->
<script
  src="https://example.com/widget.js"
  data-widget-id="w_a1b2c3"
  defer
></script>`;

const meta = {
  title: "Components/CodeBlock",
  component: CodeBlock,
  args: { code: EMBED_SNIPPET },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Bewusst fix-dunkel in BEIDEN Themes (Editor-Optik) — die `code-surface`-
 * Tokens haben absichtlich keinen Dark-Mode-Override. Der Kopieren-Button
 * schreibt den Code in die Zwischenablage und bestätigt für ~2 s.
 */
export const Playground: Story = {};

/** Mit Sprache im Kopf und einklappbar. */
export const WithLanguage: Story = {
  args: {
    code: 'print("Hello, World!")',
    language: "python",
    collapsible: true,
  },
};

/** Eigene Labels, z. B. für englischsprachige Oberflächen. */
export const CustomLabels: Story = {
  args: {
    code: 'npm install "@ki4jlu/design-system"',
    copyLabel: "Copy code",
    copiedLabel: "Copied",
  },
};
