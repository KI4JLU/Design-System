import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, within } from "storybook/test";
import {
  ArrowLeft,
  AudioLines,
  Folder,
  HardDrive,
  Languages,
  LayoutGrid,
  LayoutTemplate,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { NavGroup } from "./nav-group";
import { NavItem } from "./nav-item";
import { SidePanel } from "./side-panel";
import { SidebarPanel } from "./sidebar-panel";

const meta = {
  title: "Components/NavGroup",
  component: NavGroup,
  // axe violations fail the story test instead of being reported as todo.
  parameters: { a11y: { test: "error" } },
  args: { title: "Verwaltung", children: null },
  argTypes: {
    headingLevel: { control: "select", options: [1, 2, 3, 4, 5, 6] },
    children: { control: false },
  },
} satisfies Meta<typeof NavGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const MANAGE: [string, LucideIcon][] = [
  ["Komponenten", LayoutGrid],
  ["Ordner-Vorlagen", Folder],
  ["Layout-Vorlagen", LayoutTemplate],
  ["Nutzende", UserCog],
];
const MODULES: [string, LucideIcon][] = [
  ["Übersetzer", Languages],
  ["Transkription", AudioLines],
  ["Dateien & Laufwerke", HardDrive],
];

const row = ([label, Icon]: [string, LucideIcon], active: string) => (
  <NavItem key={label} asChild label={label} active={label === active}>
    <a href={`#${label}`} onClick={(e) => e.preventDefault()}>
      <Icon width="1em" height="1em" aria-hidden />
      <span className="truncate">{label}</span>
    </a>
  </NavItem>
);

/** The justCampus admin sidebar: way back, then the two groups. */
const AdminNav = ({ active = "Komponenten" }: { active?: string }) => (
  <>
    <NavItem asChild label="Zurück zur App">
      <a href="#app" onClick={(e) => e.preventDefault()}>
        <ArrowLeft width="1em" height="1em" aria-hidden />
        <span>Zurück zur App</span>
      </a>
    </NavItem>
    <NavGroup title="Verwaltung">{MANAGE.map((r) => row(r, active))}</NavGroup>
    <NavGroup title="Module">{MODULES.map((r) => row(r, active))}</NavGroup>
  </>
);

/**
 * The nav column as `AppShellLayout` renders it: the same nav node in the pane
 * body (`p-4`) while open, in `collapsedPreview` while collapsed — never in
 * both, so ids and `aria-current` exist once.
 */
const AdminSidebar = ({ initialOpen, active }: { initialOpen: boolean; active: string }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  return (
    <div className="flex h-140 overflow-hidden rounded-xl border border-outline-variant bg-surface">
      <SidePanel
        side="left"
        isOpen={isOpen}
        width={256}
        onExpand={() => setIsOpen(true)}
        onCollapse={() => setIsOpen(false)}
        expandLabel="Navigation ausklappen"
        collapseLabel="Navigation einklappen"
        aria-label="Administration"
        collapsedPreview={
          isOpen ? undefined : (
            <nav aria-label="Administration" className="flex w-full flex-col items-center gap-2">
              <AdminNav active={active} />
            </nav>
          )
        }
      >
        {isOpen ? (
          <nav aria-label="Administration" className="flex flex-col gap-2 p-4">
            <AdminNav active={active} />
          </nav>
        ) : null}
      </SidePanel>
      <div className="flex flex-1 items-center justify-center font-body-base text-body-base text-on-surface-variant">
        Seiteninhalt
      </div>
    </div>
  );
};

export const Playground: Story = {
  render: (args) => (
    <nav aria-label="Administration" className="flex w-64 flex-col gap-2">
      <NavGroup {...args}>{MANAGE.map((r) => row(r, "Komponenten"))}</NavGroup>
    </nav>
  ),
};

/**
 * **Admin sidebar, open.** Two groups with an active row. The `play` function
 * pins the inset against the browser's layout: the heading's text starts on
 * the same x as the rows' icons (the oracle is the row, not a number here).
 */
export const AdminSidebarOpen: Story = {
  render: () => <AdminSidebar initialOpen active="Komponenten" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Verwaltung" });
    await expect(canvas.getByRole("group", { name: "Module" })).toBeInTheDocument();
    await expect(within(group).getByRole("link", { name: "Komponenten" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const heading = canvas.getByRole("heading", { name: "Verwaltung" });
    const range = document.createRange();
    range.selectNodeContents(heading);
    const textLeft = range.getBoundingClientRect().left;
    const iconLeft = within(group)
      .getByRole("link", { name: "Nutzende" })
      .querySelector("svg")!
      .getBoundingClientRect().left;
    await expect(Math.abs(textLeft - iconLeft)).toBeLessThanOrEqual(1);
  },
};

/**
 * **Collapsed rail.** Headings are visually hidden but still name their
 * groups; a short rule marks each group boundary. Expand with the toggle.
 */
export const AdminSidebarCollapsed: Story = {
  render: () => <AdminSidebar initialOpen={false} active="Transkription" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Verwaltung" })).toBeInTheDocument();
    const heading = canvas.getByRole("heading", { name: "Module" });
    // sr-only really compiles to a 1px clipped box.
    await expect(heading.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    const separators = canvasElement.querySelectorAll<HTMLElement>(
      "[data-slot=nav-group-separator]",
    );
    await expect(separators).toHaveLength(2);
    for (const s of separators) {
      await expect(getComputedStyle(s).display).not.toBe("none");
      await expect(s.getBoundingClientRect().height).toBe(1);
    }
  },
};

/**
 * Inside a `SidebarPanel`'s `nav` slot, under the panel's own `<h2>` title —
 * so the groups pass `headingLevel={3}`.
 */
export const InSidebarPanel: Story = {
  render: () => (
    <div className="h-120 w-64 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <SidebarPanel
        title="Administration"
        nav={
          <>
            <NavGroup title="Verwaltung" headingLevel={3}>
              {MANAGE.map((r) => row(r, "Nutzende"))}
            </NavGroup>
            <NavGroup title="Module" headingLevel={3}>
              {MODULES.map((r) => row(r, "Nutzende"))}
            </NavGroup>
          </>
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 2, name: "Administration" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  },
};
