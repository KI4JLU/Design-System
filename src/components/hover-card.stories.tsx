import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info, ShieldCheck } from "lucide-react";
import { expect, waitFor, within } from "storybook/test";
import { Button } from "./button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

/**
 * A card that opens while the pointer rests on its trigger — for a short
 * explanation the reader may want and may skip. JLURAG explains each role in
 * the rights matrix this way (`KbRolesRightsTab.tsx`, `AdminRolesTab.tsx`).
 * The content is portalled, so a scroll container does not clip it.
 */
const meta = {
  title: "Components/Overlays/HoverCard",
  component: HoverCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const DESCRIPTION = "Kann Quellen hinzufügen und bearbeiten, aber keine Mitglieder verwalten.";

/**
 * **A role explained** — the info button next to a role name, as in the rights
 * matrix. The button names what it explains and points at the text, so the
 * explanation also reaches a screen reader that never hovers.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. resting on the button opens the card with the role's text [the text in
 *    `<body>`, where it is portalled];
 * 2. the card lies below the button [the boxes, `side="bottom"`];
 * 3. leaving closes it [the text gone].
 */
export const RoleInfo: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
      Bearbeiten
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label="Bearbeiten: Was darf diese Rolle?"
            aria-describedby="role-edit-desc"
          >
            <Info size={14} aria-hidden="true" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent side="bottom" className="w-72 text-left">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck size={16} aria-hidden="true" />
            Bearbeiten
          </div>
          <p className="m-0 mt-2 text-sm text-on-surface-variant">{DESCRIPTION}</p>
        </HoverCardContent>
      </HoverCard>
      <span id="role-edit-desc" className="sr-only">
        {DESCRIPTION}
      </span>
    </span>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Bearbeiten: Was darf diese Rolle?" });
    await expect(trigger).toHaveAccessibleDescription(DESCRIPTION);

    await userEvent.hover(trigger);
    const card = await waitFor(() => {
      const el = body
        .getAllByText(DESCRIPTION)
        .find((node) => !node.classList.contains("sr-only"));
      if (!el) throw new Error("card not open yet");
      return el;
    });
    await expect(card).toBeVisible();
    await expect(card.getBoundingClientRect().top).toBeGreaterThan(
      trigger.getBoundingClientRect().bottom,
    );

    await userEvent.unhover(trigger);
    await waitFor(() =>
      expect(
        body.getAllByText(DESCRIPTION).filter((node) => !node.classList.contains("sr-only")),
      ).toHaveLength(0),
    );
  },
};
