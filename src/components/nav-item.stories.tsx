import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Languages,
  LayoutDashboard,
  Settings,
  Subtitles,
  Users,
} from "lucide-react";
import { NavItem } from "./nav-item";
import { SidePanel } from "./side-panel";

const meta = {
  title: "Components/NavItem",
  component: NavItem,
  argTypes: {
    level: { control: "select", options: ["top", "sub"] },
    active: { control: "boolean" },
    disabled: { control: "boolean" },
    description: { control: "text" },
    asChild: { control: false },
  },
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: (
      <>
        <LayoutDashboard width="1em" height="1em" aria-hidden />
        <span>Übersicht</span>
      </>
    ),
    active: false,
  },
};

/** Die komplette Sidebar-Navigation, 1:1 wie in den Apps. */
export const SidebarExample: Story = {
  render: () => (
    <nav className="flex w-64 flex-col gap-2 rounded-xl bg-surface-container-low border border-outline-variant p-4">
      <NavItem>
        <LayoutDashboard width="1em" height="1em" aria-hidden />
        <span>Übersicht</span>
      </NavItem>
      <NavItem active>
        <Users width="1em" height="1em" aria-hidden />
        <span>Team</span>
        <ChevronDown width="1em" height="1em" aria-hidden className="ml-auto" />
      </NavItem>
      <div className="ml-4 flex flex-col gap-1 border-l border-outline-variant pl-3">
        <NavItem level="sub" active>
          <Users width="1em" height="1em" aria-hidden />
          <span className="truncate">Mitglieder</span>
        </NavItem>
        <NavItem level="sub">
          <Users width="1em" height="1em" aria-hidden />
          <span className="truncate">Rollen</span>
        </NavItem>
      </div>
      <NavItem>
        <Settings width="1em" height="1em" aria-hidden />
        <span>Einstellungen</span>
      </NavItem>
    </nav>
  ),
};

/** Mit asChild rendert NavItem einen Router-Link statt eines Buttons. */
export const AsLink: Story = {
  render: () => (
    <NavItem asChild active className="w-64">
      <a href="#uebersicht">
        <LayoutDashboard width="1em" height="1em" aria-hidden />
        <span>Übersicht</span>
      </a>
    </NavItem>
  ),
};

/**
 * **Collapsed, in the 60px rail.** A row with `label`, inside a collapsed
 * `SidePanel`'s `collapsedPreview`, which is where `AppShellLayout` moves its
 * nav when the column collapses. The row shows its icon only; its name is the
 * `aria-label`, and hovering it shows a tooltip with the same text.
 *
 * The `play` function checks what jsdom cannot: that the arbitrary variant
 * `[&>*:not(svg)]:hidden` really compiles to `display: none`, and that the
 * icon-only row fits inside the rail and sits on its axis. This check lived in
 * the legacy `Sidebar`'s `Collapsed` story until that component was removed
 * (KI-846). Oracles: the browser's computed style, and the rail's own
 * bounding box measured in the same layout. No expected pixel value is
 * written here.
 */
export const CollapsedInRail: Story = {
  render: () => (
    <div className="flex h-120 overflow-hidden rounded-xl border border-outline-variant bg-surface">
      <SidePanel
        side="left"
        isOpen={false}
        width={256}
        onExpand={() => {}}
        onCollapse={() => {}}
        expandLabel="Expand navigation"
        collapseLabel="Collapse navigation"
        collapsedPreview={
          <nav aria-label="Main navigation" className="flex w-full flex-col items-center gap-2">
            <NavItem label="Overview" active>
              <LayoutDashboard width="1em" height="1em" aria-hidden />
              <span>Overview</span>
            </NavItem>
            <NavItem label="Team" data-testid="row-team">
              <Users width="1em" height="1em" aria-hidden />
              <span>Team</span>
            </NavItem>
          </nav>
        }
      >
        {null}
      </SidePanel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector("[data-testid='row-team']") as HTMLElement;
    await expect(row).toHaveAttribute("aria-label", "Team");

    // 1. The hide utility compiles. A class-name check (as in the jsdom test)
    //    would stay green even if the arbitrary variant compiled to nothing.
    await expect(getComputedStyle(row.querySelector("span")!).display).toBe("none");
    await expect(getComputedStyle(row.querySelector("svg")!).display).not.toBe("none");

    // 2. Nothing sticks out of the rail, and the icon sits on its axis.
    const rail = (canvasElement.querySelector("aside") as HTMLElement).getBoundingClientRect();
    for (const [el, what] of [
      [row, "row"],
      [row.querySelector("svg")!, "row icon"],
    ] as const) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) throw new Error(`${what} is not visible`);
      if (r.left < rail.left || r.right > rail.right) {
        throw new Error(`${what} overflows the rail: ${r.left}–${r.right} vs ${rail.left}–${rail.right}`);
      }
    }
    const icon = row.querySelector("svg")!.getBoundingClientRect();
    const off = Math.abs((icon.left + icon.right) / 2 - (rail.left + rail.right) / 2);
    await expect(off).toBeLessThanOrEqual(1);
  },
};

const ICON = { width: "1em", height: "1em", "aria-hidden": true } as const;

const FORMATS = [
  { icon: <Subtitles {...ICON} />, title: "SRT", description: "Untertitel mit Zeitstempeln" },
  { icon: <Subtitles {...ICON} />, title: "VTT", description: "Untertitel für Web-Player" },
  { icon: <FileText {...ICON} />, title: "DOCX", description: "Word-Dokument mit Sprechern" },
  { icon: <FileText {...ICON} />, title: "TXT", description: "Reiner Text ohne Zeitstempel" },
];

/**
 * `disabled` (Button-Zeile) bzw. `aria-disabled` (Link mit `asChild`): Text und
 * Icon in `on-disabled`, `cursor-not-allowed`, keine Hover-Fläche — z. B. ein
 * Übersetzungsmodus, für den kein Backend eingerichtet ist.
 */
export const Disabled: Story = {
  render: () => (
    <nav aria-label="Modi" className="flex w-72 flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <NavItem level="sub">
        <Languages {...ICON} />
        <span className="min-w-0 flex-1 truncate text-left">Text übersetzen</span>
        <ChevronRight {...ICON} />
      </NavItem>
      <NavItem level="sub" disabled data-testid="disabled-row">
        <FileText {...ICON} />
        <span className="min-w-0 flex-1 truncate text-left">Dokument übersetzen</span>
        <ChevronRight {...ICON} />
      </NavItem>
      <NavItem asChild level="sub" aria-disabled="true">
        <a href="#glossar" onClick={(event) => event.preventDefault()}>
          <BookOpen {...ICON} />
          <span>Glossar</span>
        </a>
      </NavItem>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector("[data-testid='disabled-row']") as HTMLElement;
    const probe = document.createElement("span");
    probe.className = "text-on-disabled";
    canvasElement.append(probe);
    const onDisabled = getComputedStyle(probe).color;
    probe.remove();
    await expect(row).toBeDisabled();
    await expect(getComputedStyle(row).color).toBe(onDisabled);
    await expect(getComputedStyle(row).cursor).toBe("not-allowed");
    const link = canvasElement.querySelector("a[aria-disabled='true']") as HTMLElement;
    await expect(getComputedStyle(link).color).toBe(onDisabled);
  },
};

/**
 * `description` setzt eine zweite, kleinere Zeile unter das Label — die
 * Exportformate der Transkription. Sie beschreibt die Zeile
 * (`aria-describedby`) statt ihren Namen zu verlängern.
 */
export const WithDescription: Story = {
  render: () => (
    <nav aria-label="Exportformat" className="flex w-80 flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container-low p-4">
      {FORMATS.map((format, i) => (
        <NavItem
          key={format.title}
          active={i === 0}
          description={format.description}
          data-testid={`format-${format.title}`}
        >
          {format.icon}
          <span>{format.title}</span>
        </NavItem>
      ))}
      <NavItem level="sub" description="Kein Export-Backend eingerichtet" disabled>
        <FileText {...ICON} />
        <span>PDF</span>
      </NavItem>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    // The line sits under the label, not under the icon.
    const row = canvasElement.querySelector("[data-testid='format-VTT']") as HTMLElement;
    const label = row.querySelector("span:not([data-slot])")!.getBoundingClientRect();
    const line = row.querySelector("[data-slot='nav-item-description']")!.getBoundingClientRect();
    await expect(Math.abs(line.left - label.left)).toBeLessThanOrEqual(0.5);
    await expect(line.top).toBeGreaterThanOrEqual(label.bottom - 0.5);
    await expect(row).toHaveAccessibleName("VTT");
    await expect(row).toHaveAccessibleDescription("Untertitel für Web-Player");
  },
};

/**
 * In einer `SidePanel`-Spalte, ausgeklappt und eingeklappt: in der Leiste
 * verschwindet die Beschreibung mit dem übrigen Text, das Icon bleibt.
 */
export const InSidePanel: Story = {
  render: () => (
    <div className="flex h-96 gap-4">
      {[true, false].map((isOpen) => (
        <div key={String(isOpen)} className="flex overflow-hidden rounded-xl border border-outline-variant bg-surface">
          <SidePanel
            side="left"
            isOpen={isOpen}
            aria-label={isOpen ? "Export, ausgeklappt" : "Export, eingeklappt"}
            width={288}
            onExpand={() => {}}
            onCollapse={() => {}}
            expandLabel="Export ausklappen"
            collapseLabel="Export einklappen"
            collapsedPreview={
              isOpen ? undefined : (
                <nav aria-label="Exportformat, eingeklappt" className="flex w-full flex-col items-center gap-2">
                  {FORMATS.slice(0, 2).map((format) => (
                    <NavItem key={format.title} label={format.title} description={format.description} data-testid={`rail-${format.title}`}>
                      {format.icon}
                      <span>{format.title}</span>
                    </NavItem>
                  ))}
                </nav>
              )
            }
          >
            {isOpen ? (
              <nav aria-label="Exportformat" className="flex flex-col gap-1 p-4">
                {FORMATS.map((format, i) => (
                  <NavItem key={format.title} label={format.title} active={i === 0} description={format.description}>
                    {format.icon}
                    <span>{format.title}</span>
                  </NavItem>
                ))}
                <NavItem label="PDF" description="Kein Export-Backend eingerichtet" disabled>
                  <FileText {...ICON} />
                  <span>PDF</span>
                </NavItem>
              </nav>
            ) : null}
          </SidePanel>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector("[data-testid='rail-SRT']") as HTMLElement;
    const line = row.querySelector("[data-slot='nav-item-description']") as HTMLElement;
    await expect(getComputedStyle(line).display).toBe("none");
    await expect(getComputedStyle(row).display).toBe("flex");
    await expect(row).toHaveAccessibleName("SRT");
  },
};
