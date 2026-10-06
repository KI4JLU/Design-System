import type { Meta, StoryObj } from "@storybook/react-vite";
import { Shimmer } from "./shimmer";

const meta = {
  title: "Components/Shimmer",
  component: Shimmer,
  args: { children: "Denke nach …" },
} satisfies Meta<typeof Shimmer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Status line under the last message while the answer is being prepared. */
export const InChat: Story = {
  render: () => (
    <div className="flex flex-col gap-3 bg-surface p-6 text-body-base">
      <Shimmer as="span">Denke nach …</Shimmer>
      <Shimmer as="span" duration={2.5}>
        Suche tiefer in den Dokumenten …
      </Shimmer>
    </div>
  ),
};
