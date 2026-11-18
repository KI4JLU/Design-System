import type { Meta, StoryObj } from "@storybook/react-vite";
import { Logo } from "./logo";

const meta = {
  title: "Components/Data Display/Logo",
  component: Logo,
  args: { product: "App" },
  argTypes: {
    size: { control: "select", options: ["sm", "default", "lg"] },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Die JLU-Plattformen — ein Wortmarken-Muster, Produktname als Badge. */
export const Platforms: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-stack-md">
      <Logo product="App" />
      <Logo product="API" />
      <Logo product="RAG" />
    </div>
  ),
};

/** `sm` für Sidebar/Top-Bar, `lg` für Auth-/Marketing-Seiten. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-stack-md">
      <Logo product="App" size="sm" />
      <Logo product="App" />
      <Logo product="App" size="lg" />
    </div>
  ),
};
