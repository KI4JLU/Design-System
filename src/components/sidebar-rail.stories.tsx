import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageSquare, Plus } from "lucide-react";
import { expect } from "storybook/test";
import { SIDE_PANEL_RAIL_WIDTH } from "./side-panel-variants";
import { SidebarRail, SidebarRailItem } from "./sidebar-rail";

/**
 * The collapsed side column: the rail's leading action, then one entry per
 * chat or source. Apps pass it as a column's `collapsedPreview`; here it
 * stands in a box as wide as the rail.
 */
const meta = {
  title: "Components/Navigation/SidebarRail",
  component: SidebarRailItem,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div
        className="flex flex-col items-center gap-1 border-r border-outline-variant py-2"
        style={{ width: SIDE_PANEL_RAIL_WIDTH }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SidebarRailItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * **Every kind of entry** — JLURAG's `HistoryPanel.tsx` and `SourcesRail.tsx`
 * collapsed: the leading action, the open chat (`active`), a chat, sources as
 * type labels (`iconText`), a source left out of answers (`muted`) and one the
 * user may see but not open (`interactive={false}`).
 *
 * `play` (Chromium), oracles in brackets:
 * 1. the open chat is `aria-current`, the others are not [ARIA];
 * 2. the display-only source is an image, not a button, and takes no focus
 *    [ARIA role; the tab order];
 * 3. the left-out source is dimmed [the computed opacity];
 * 4. every entry fits the rail [the boxes against the exported rail width].
 */
export const Entries: Story = {
  render: () => (
    <>
      <SidebarRailItem variant="action" title="Neuer Chat" aria-label="Neuer Chat">
        <Plus aria-hidden="true" />
      </SidebarRailItem>
      <SidebarRail aria-label="Verlauf">
        <li>
          <SidebarRailItem active aria-label="Fragen zur Anmeldung">
            <MessageSquare aria-hidden="true" />
          </SidebarRailItem>
        </li>
        <li>
          <SidebarRailItem aria-label="Fristen im Wintersemester">
            <MessageSquare aria-hidden="true" />
          </SidebarRailItem>
        </li>
      </SidebarRail>
      <SidebarRail aria-label="Quellen">
        <li>
          <SidebarRailItem iconText="PDF" aria-label="Modulhandbuch_2026.pdf" />
        </li>
        <li>
          <SidebarRailItem iconText="XLSX" muted aria-label="Termine.xlsx" />
        </li>
        <li>
          <SidebarRailItem iconText="DOCX" interactive={false} aria-label="Prüfungsordnung.docx" />
        </li>
      </SidebarRail>
    </>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "Fragen zur Anmeldung" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(
      canvas.getByRole("button", { name: "Fristen im Wintersemester" }),
    ).not.toHaveAttribute("aria-current");

    const staticEntry = canvas.getByRole("img", { name: "Prüfungsordnung.docx" });
    await expect(canvas.queryByRole("button", { name: "Prüfungsordnung.docx" })).toBeNull();
    canvas.getByRole("button", { name: "Termine.xlsx" }).focus();
    await userEvent.tab();
    await expect(staticEntry).not.toHaveFocus();

    const muted = canvas.getByRole("button", { name: "Termine.xlsx" });
    await expect(Number(getComputedStyle(muted).opacity)).toBeLessThan(1);

    for (const entry of canvasElement.querySelectorAll("[data-slot='sidebar-rail-item']")) {
      await expect(entry.getBoundingClientRect().width).toBeLessThanOrEqual(SIDE_PANEL_RAIL_WIDTH);
    }
  },
};
