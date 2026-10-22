import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CopyIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { expect, screen, waitFor } from "storybook/test";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "./message";

/**
 * AI Elements `Message` (https://elements.ai-sdk.dev/api/registry/message.json),
 * imported with the shadcn CLI. `MessageResponse` renders its children as given
 * (streamdown is not shipped; the app brings its own markdown rendering).
 */
const meta = {
  title: "Components/Message",
  component: Message,
  args: { from: "assistant" },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

const answer = (
  <MessageResponse>
    <p>
      Die Anmeldefrist für Prüfungen im Wintersemester endet am 15. November.
      Eine Abmeldung ist bis eine Woche vor dem Termin möglich.
    </p>
  </MessageResponse>
);

function Actions() {
  return (
    <MessageActions>
      <MessageAction tooltip="Kopieren">
        <CopyIcon className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Gute Antwort">
        <ThumbsUpIcon className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Schlechte Antwort">
        <ThumbsDownIcon className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Neu generieren">
        <RefreshCcwIcon className="size-4" />
      </MessageAction>
    </MessageActions>
  );
}

/** A question, the answer, and the answer's action row with tooltips. */
export const ActionsRow: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Message from="user">
        <MessageContent>Wann endet die Prüfungsanmeldung?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>{answer}</MessageContent>
        <Actions />
      </Message>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const copy = canvas.getByRole("button", { name: "Kopieren" });
    await userEvent.hover(copy);
    await waitFor(() => expect(copy).toHaveAttribute("aria-describedby"));
    await expect(await screen.findByRole("tooltip")).toHaveTextContent("Kopieren");
    await expect(canvas.getAllByRole("button")).toHaveLength(4);
  },
};

/** The same in the dark theme. */
export const ActionsRowDark: Story = {
  ...ActionsRow,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await ActionsRow.play!(context);
  },
};

/** Three versions of one answer, a toolbar with the branch selector and the actions. */
export const ToolbarWithBranches: Story = {
  render: () => (
    <MessageBranch>
      <MessageBranchContent>
        {[
          <Message from="assistant" key="v1">
            <MessageContent>
              <MessageResponse>
                <p>Version 1: Die Frist endet am 15. November.</p>
              </MessageResponse>
            </MessageContent>
          </Message>,
          <Message from="assistant" key="v2">
            <MessageContent>
              <MessageResponse>
                <p>Version 2: Anmeldeschluss ist der 15. November.</p>
              </MessageResponse>
            </MessageContent>
          </Message>,
          <Message from="assistant" key="v3">
            <MessageContent>
              <MessageResponse>
                <p>Version 3: Bis zum 15. November.</p>
              </MessageResponse>
            </MessageContent>
          </Message>,
        ]}
      </MessageBranchContent>
      <MessageToolbar>
        <MessageBranchSelector>
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
        <Actions />
      </MessageToolbar>
    </MessageBranch>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText("1 von 3")).toBeVisible();
    await expect(canvas.getByText(/^Version 1/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Nächste Version" }));
    await expect(canvas.getByText("2 von 3")).toBeVisible();
    await expect(canvas.getByText(/^Version 2/)).toBeVisible();
    await expect(canvas.getByText(/^Version 1/)).not.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Vorherige Version" }));
    await expect(canvas.getByText("1 von 3")).toBeVisible();
  },
};

/** The same in the dark theme. */
export const ToolbarWithBranchesDark: Story = {
  ...ToolbarWithBranches,
  globals: { theme: "dark" },
  play: async (context) => {
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    await ToolbarWithBranches.play!(context);
  },
};
