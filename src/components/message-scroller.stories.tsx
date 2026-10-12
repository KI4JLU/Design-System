import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "./message-scroller";
import { Button } from "./button";
import { Shimmer } from "./shimmer";

const meta = {
  title: "Components/MessageScroller",
  component: MessageScroller,
} satisfies Meta<typeof MessageScroller>;

export default meta;
type Story = StoryObj<typeof meta>;

type Turn = { id: string; role: "user" | "ai"; text: string };

const seed: Turn[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i}`,
  role: i % 2 === 0 ? "user" : "ai",
  text:
    i % 2 === 0
      ? `Frage ${i / 2 + 1}: Wie melde ich mich für die Prüfung an?`
      : "Die Anmeldung läuft über FlexNow. ".repeat(12),
}));

/** Send a turn and watch the answer stream in; scroll up mid-stream to release the follow. */
export const Streaming: Story = {
  render: function Render() {
    const [turns, setTurns] = React.useState(seed);
    const [busy, setBusy] = React.useState(false);
    const send = () => {
      const n = turns.length;
      setBusy(true);
      setTurns((t) => [...t, { id: `t${n}`, role: "user", text: "Und wann ist die Frist?" }]);
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        setTurns((t) => {
          const rest = t.filter((x) => x.id !== `t${n + 1}`);
          return [...rest, { id: `t${n + 1}`, role: "ai", text: "Die Frist endet zwei Wochen vor der Prüfung. ".repeat(i) }];
        });
        if (i >= 20) {
          clearInterval(timer);
          setBusy(false);
        }
      }, 150);
    };
    return (
      <div className="flex h-[480px] flex-col gap-3 bg-surface p-4 text-body-base">
        <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
          <MessageScroller className="rounded-container border border-outline-variant">
            <MessageScrollerViewport>
              <MessageScrollerContent className="p-4">
                {turns.map((t) => (
                  <MessageScrollerItem
                    key={t.id}
                    messageId={t.id}
                    scrollAnchor={t.role === "user"}
                    className={t.role === "user" ? "self-end rounded-container bg-surface-container-high px-4 py-2" : ""}
                  >
                    {t.text}
                  </MessageScrollerItem>
                ))}
                {busy && <Shimmer as="span">Denke nach …</Shimmer>}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
        <Button className="self-start" onClick={send} disabled={busy}>
          Senden
        </Button>
      </div>
    );
  },
};
