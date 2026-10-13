import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Button } from "./button";
import {
  Breadcrumb,
  BreadcrumbBack,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  parameters: { a11y: { test: "error" } },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full trail of a page inside a hierarchy. */
export const Trail: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#">Themen</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbLink href="#">Tetris</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Mitglieder</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

/**
 * The default back navigation of a sub-view: "‹ Tetris · Mitglieder" above the
 * view's title, back one level. Shown here as a dialog's second view — the
 * header (back link + title) and the footer, whose "Abbrechen" also returns to
 * the parent view; only the ✕ would close the dialog.
 */
const onBack = fn();

export const BackInSubView: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4 rounded-xl border border-outline-variant bg-surface p-6">
      <div className="flex flex-col gap-1">
        <BreadcrumbBack trail={["Tetris", "Mitglieder"]} onClick={onBack} />
        <h2 className="m-0 text-2xl font-semibold text-on-surface">Mitglieder hinzufügen</h2>
      </div>
      <p className="m-0 text-sm text-on-surface-variant">Inhalt der Unteransicht.</p>
      <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
        <Button variant="ghost">Abbrechen</Button>
        <Button>2 Personen hinzufügen</Button>
      </div>
    </div>
  ),
  // ORACLES: the browser's layout and colour resolution, and the spy.
  play: async ({ canvas, canvasElement, userEvent }) => {
    onBack.mockClear();
    const back = canvas.getByRole("button", { name: "Zurück zu Tetris, Mitglieder" });
    await expect(canvas.getByRole("navigation", { name: "Navigationspfad" })).toContainElement(back);
    // Above the title, left-aligned with it.
    const title = canvas.getByRole("heading", { name: "Mitglieder hinzufügen" });
    await expect(back.getBoundingClientRect().bottom).toBeLessThanOrEqual(title.getBoundingClientRect().top);
    await expect(Math.round(back.getBoundingClientRect().left)).toBe(Math.round(title.getBoundingClientRect().left));
    // In the primary colour, as the browser resolves the token.
    const probe = document.createElement("span");
    probe.style.color = "var(--color-primary)";
    canvasElement.appendChild(probe);
    await expect(getComputedStyle(back).color).toBe(getComputedStyle(probe).color);
    probe.remove();
    // The visible trail and the chevron.
    await expect(back).toHaveTextContent("Tetris · Mitglieder");
    await expect(back.querySelector("svg")).not.toBeNull();
    await userEvent.click(back);
    await expect(onBack).toHaveBeenCalledTimes(1);
  },
};

/** As a link, for a back navigation that is a URL (a sub-page). */
export const BackAsLink: Story = {
  render: () => <BreadcrumbBack trail={["Themen"]} href="#" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Zurück zu Themen" })).toHaveAttribute("href", "#");
  },
};
