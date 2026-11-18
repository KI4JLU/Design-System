import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";
import { BottomSheet } from "./bottom-sheet";
import { Button } from "./button";

/**
 * A sheet from the bottom edge, as tall as its content and no taller than
 * half the screen. Longer content gives it two stops — half the screen and
 * all of it — and scrolls inside the part on screen.
 */
const meta = {
  title: "Components/BottomSheet",
  component: BottomSheet,
  parameters: { viewport: { defaultViewport: "mobile1" } },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ rows }: { rows: number }) {
  const [open, setOpen] = React.useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Quellen öffnen</Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        label="Quellen"
        header={<h2 className="m-0 text-[15px] font-medium text-on-surface">Quellen</h2>}
      >
        <ul className="m-0 list-none px-4 pb-4">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="border-b border-outline-variant py-3 text-sm text-on-surface">
              Quelle {i + 1}
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}

const ARGS = { open: true, onOpenChange: () => {}, label: "Quellen" };

/** Three rows: the sheet is as tall as they are, with no stops. */
export const ShortContent: Story = {
  args: ARGS,
  render: () => <Demo rows={3} />,
  play: async () => {
    const sheet = await screen.findByRole("dialog", { name: "Quellen" });
    await expect(sheet).not.toHaveAttribute("data-snap");
    await expect(sheet.getBoundingClientRect().height).toBeLessThan(window.innerHeight / 2);
  },
};

/** Forty rows: stops at half the screen and at all of it; the list scrolls inside. */
export const LongContent: Story = {
  args: ARGS,
  render: () => <Demo rows={40} />,
  play: async () => {
    const sheet = await screen.findByRole("dialog", { name: "Quellen" });
    await expect(sheet).toHaveAttribute("data-snap");
  },
};
