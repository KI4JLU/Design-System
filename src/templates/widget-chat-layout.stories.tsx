import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { SendHorizontal } from "lucide-react";
import { WidgetChatLayout } from "./widget-chat-layout";
import { Avatar } from "../components/avatar";
import { Button } from "../components/button";
import { Textarea } from "../components/textarea";
import * as chatBubbleStories from "../components/chat-bubble.stories";

// Portable stories: the conversation comes 1:1 from the ChatBubble stories.
const { Conversation } = composeStories(chatBubbleStories, {});

const meta = {
  title: "Templates/WidgetChatLayout",
  component: WidgetChatLayout,
  tags: ["!autodocs"],
} satisfies Meta<typeof WidgetChatLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The widget fills its parent container — here an h-96 frame, as in the embedding context. */
export const Widget: Story = {
  render: () => (
    <div className="h-96 max-w-md">
      <WidgetChatLayout
        header={
          <>
            <Avatar initials="AS" online aria-label="Assistent, online" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-on-surface">Assistent</span>
              <span className="text-xs text-on-surface-variant">Online</span>
            </div>
          </>
        }
        composer={
          <div className="flex items-end gap-stack-sm">
            <Textarea
              variant="inline"
              rows={1}
              placeholder="Nachricht schreiben…"
              aria-label="Nachricht"
              className="flex-1"
            />
            <Button size="icon" aria-label="Senden">
              <SendHorizontal width="1em" height="1em" aria-hidden />
            </Button>
          </div>
        }
      >
        <Conversation />
      </WidgetChatLayout>
    </div>
  ),
};

/** Without a header — embedded in a context that already shows the identity. */
export const Headless: Story = {
  render: () => (
    <div className="h-96 max-w-md">
      <WidgetChatLayout
        composer={
          <div className="flex items-end gap-stack-sm">
            <Textarea
              variant="inline"
              rows={1}
              placeholder="Nachricht schreiben…"
              aria-label="Nachricht"
              className="flex-1"
            />
            <Button size="icon" aria-label="Senden">
              <SendHorizontal width="1em" height="1em" aria-hidden />
            </Button>
          </div>
        }
      >
        <Conversation />
      </WidgetChatLayout>
    </div>
  ),
};
