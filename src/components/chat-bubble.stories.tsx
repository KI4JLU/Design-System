import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatBubble } from "./chat-bubble";

const meta = {
  title: "Components/AI/ChatBubble",
  component: ChatBubble,
  args: { children: "Hallo, wie kann ich helfen?" },
  argTypes: {
    from: { control: "select", options: ["user", "assistant"] },
  },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A typical conversation: the column layout comes from the list, not from the bubble. */
export const Conversation: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-2">
      <ChatBubble from="user">Wann hat die Bibliothek geöffnet?</ChatBubble>
      <ChatBubble from="assistant">
        Die Universitätsbibliothek ist Mo–Fr von 8:00 bis 22:00 Uhr geöffnet, am
        Wochenende von 9:00 bis 20:00 Uhr.
      </ChatBubble>
      <ChatBubble from="user">Auch in den Semesterferien?</ChatBubble>
      <ChatBubble from="assistant">
        In den Semesterferien gelten verkürzte Zeiten: Mo–Fr 9:00–18:00 Uhr.
      </ChatBubble>
    </div>
  ),
};
