import type { Meta, StoryObj } from "@storybook/react-vite";
import { XIcon } from "lucide-react";
import { expect, screen, waitFor } from "storybook/test";
import { Button } from "./button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { PreviewContent } from "./inline-citation.stories";

/**
 * shadcn/ui `drawer` (https://ui.shadcn.com/r/styles/new-york-v4/drawer.json),
 * imported with the shadcn CLI, on vaul: a bottom sheet with scrim and grab
 * handle; swipe down, the scrim, Esc or a `DrawerClose` closes it. A Radix
 * Dialog underneath: `role="dialog"`, named by `DrawerTitle`.
 */
const meta = {
  title: "Components/Drawer",
  component: Drawer,
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mobile: the source preview as a bottom sheet (mobil.png). */
export const MobileSourceSheet: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <Drawer>
      <p className="max-w-sm text-base text-on-surface">
        Laut Anforderungsliste ist eine Abstimmung zwischen beiden nötig.{" "}
        <DrawerTrigger className="inline-flex h-5 min-w-5 items-center justify-center rounded-[var(--ui-radius-tile,6px)] bg-primary-fixed px-1.5 text-[11px] font-semibold text-on-primary-fixed-variant">
          <span className="sr-only">Quelle </span>1
        </DrawerTrigger>
      </p>
      <DrawerContent>
        <DrawerHeader className="flex-row items-start justify-between p-0 pr-2 text-left">
          <DrawerTitle className="sr-only">Quelle 1: Anforderungen JLU RAG</DrawerTitle>
          <DrawerDescription className="sr-only">Vorschau der Quelle</DrawerDescription>
          <PreviewContent />
          <DrawerClose asChild>
            <Button aria-label="Schließen" className="mt-3 size-11" size="icon" variant="ghost">
              <XIcon className="size-5" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <DrawerFooter className="flex-row">
          <Button className="h-12 flex-1" variant="outline">Alle 5 Quellen</Button>
          <Button className="h-12 flex-1">In Quelle öffnen</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Quelle 1" }));
    const sheet = await screen.findByRole("dialog", { name: "Quelle 1: Anforderungen JLU RAG" });
    for (const button of screen.getAllByRole("button").filter((b) => sheet.contains(b))) {
      await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  },
};
