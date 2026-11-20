import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import { SidebarFilterMenu } from "./sidebar-filter-menu";

/**
 * The filter menu beside a side column's list heading. In an app it sits in
 * `SidebarSection`'s `aside` (see `Components/Navigation/SidebarSection →
 * Sections`); here it stands alone with its own state.
 */
const meta = {
  title: "Components/Navigation/SidebarFilterMenu",
  component: SidebarFilterMenu,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SidebarFilterMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const ACTIVITY = [
  { value: "all", label: "Alle" },
  { value: "week", label: "Diese Woche" },
  { value: "month", label: "Diesen Monat" },
];
const ORDER = [
  { value: "recent", label: "Zuletzt aktiv" },
  { value: "name", label: "Name" },
];

function HistoryFilter({ onSection }: { onSection?: () => void }) {
  const [activity, setActivity] = useState("all");
  const [order, setOrder] = useState("recent");
  const isDefault = activity === "all" && order === "recent";
  return (
    <SidebarFilterMenu
      label="Filter"
      activeLabel="Filter aktiv"
      active={activity !== "all"}
      filters={[
        { key: "activity", label: "Letzte Aktivität", value: activity, options: ACTIVITY },
        { key: "order", label: "Sortierung", value: order, options: ORDER, separatorBefore: true },
      ]}
      onValueChange={(key, value) => (key === "activity" ? setActivity(value) : setOrder(value))}
      resetLabel="Zurücksetzen"
      resetDisabled={isDefault}
      onReset={() => {
        setActivity("all");
        setOrder("recent");
      }}
      actions={[{ label: "Neuen Abschnitt erstellen", onSelect: onSection ?? (() => {}) }]}
    />
  );
}

/** Portalled menus render into `<body>`, outside the canvas. */
const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/**
 * **The history's filter** — JLURAG's `HistoryFilterMenu`: a setting per row
 * with its current value, a reset, and a further action.
 *
 * `play` (Chromium), oracles in brackets:
 * 1. each row shows its setting and its current value [the menu's text];
 * 2. choosing a value keeps the menu open, so several can be set in one go
 *    [ARIA `menu` still present];
 * 3. a hiding filter renames the trigger, and the reset turns on [ARIA name;
 *    `aria-disabled`];
 * 4. the reset restores the default [the row's value].
 */
export const History: Story = {
  args: { label: "Filter", filters: [], onValueChange: () => {} },
  render: () => <HistoryFilter />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = page(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Filter" }));
    const menu = await body.findByRole("menu");
    const activityRow = within(menu).getByRole("menuitem", { name: /Letzte Aktivität/ });
    await expect(activityRow).toHaveTextContent("Alle");
    await expect(within(menu).getByRole("menuitem", { name: "Zurücksetzen" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    activityRow.focus();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.click(await body.findByRole("menuitemradio", { name: "Diese Woche" }));

    // Still open: the main menu is there (the sub-menu may be too).
    await expect(body.getAllByRole("menu").length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(within(body.getAllByRole("menu")[0]).getByRole("menuitem", { name: /Letzte Aktivität/ }))
        .toHaveTextContent("Diese Woche"),
    );
    // While the menu is open Radix hides the page behind it from the
    // accessibility tree, the trigger included — hence `hidden: true`.
    await expect(
      canvas.getByRole("button", { name: "Filter aktiv", hidden: true }),
    ).toBeInTheDocument();

    const reset = within(body.getAllByRole("menu")[0]).getByRole("menuitem", { name: "Zurücksetzen" });
    await expect(reset).not.toHaveAttribute("aria-disabled");
    await userEvent.click(reset);
    await expect(
      canvas.getByRole("button", { name: "Filter", hidden: true }),
    ).toBeInTheDocument();
  },
};
