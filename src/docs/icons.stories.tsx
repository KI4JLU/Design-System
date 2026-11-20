import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, within } from "storybook/test";
import {
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  CircleCheck,
  CircleX,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  Info,
  Lock,
  Maximize2,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "../components/alert";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Input } from "../components/input";
import { NavItem } from "../components/nav-item";
import { PANE_TOGGLE_CLASS } from "../components/side-panel-variants";
import { SidebarAction } from "../components/sidebar-action";
import { SidebarCard, SidebarCardList } from "../components/sidebar-card";
import { SidebarRailItem } from "../components/sidebar-rail";

/* ---------------------------------------------------------------------------
 * The stories behind `Foundations/Icons` (Icons.mdx). They render real DS
 * components and measure their icons in Chromium, so the sizes the page
 * states are checked against what the components draw: a component that
 * changes its icon size fails `Sizes`, and the page cannot quietly drift.
 * ------------------------------------------------------------------------- */

const meta = {
  title: "Foundations/Icons",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** One measured sample: the context's name, the expected size, the component. */
interface Sample {
  id: string;
  label: string;
  /** The size in px the component gives its icon. */
  size: number;
  node: ReactNode;
}

/**
 * Every context where the component sets the icon size itself. The call site
 * passes no size (or a different one, as `NavItem` shows) — the component
 * decides. Grouped by size, largest first.
 */
const SIZED_BY_COMPONENT: Sample[] = [
  {
    id: "pane-toggle",
    label: "Column toggle (AppShell)",
    size: 20,
    node: (
      <Button variant="ghost" size="icon" className={PANE_TOGGLE_CLASS} aria-label="Verlauf einklappen">
        <Settings />
      </Button>
    ),
  },
  {
    id: "alert",
    label: "Alert",
    size: 20,
    node: (
      <Alert tone="info">
        <AlertDescription>Wartung am Freitag ab 18 Uhr.</AlertDescription>
      </Alert>
    ),
  },
  {
    id: "nav-item",
    label: "NavItem",
    size: 18,
    node: (
      // `size={20}` from the call site, as JLURAG passes it — the row wins.
      <NavItem type="button" label="Mein Wissen">
        <Home size={20} />
        <span>Mein Wissen</span>
      </NavItem>
    ),
  },
  {
    id: "sidebar-action",
    label: "SidebarAction",
    size: 18,
    node: <SidebarAction icon={<Plus />}>Neuer Chat</SidebarAction>,
  },
  {
    id: "rail-item",
    label: "SidebarRailItem",
    size: 18,
    node: (
      <SidebarRailItem aria-label="Fragen zur Anmeldung">
        <MessageSquare />
      </SidebarRailItem>
    ),
  },
  {
    id: "sidebar-card",
    label: "SidebarCard",
    size: 16,
    node: (
      <SidebarCardList>
        <SidebarCard icon={<MessageSquare />} title="Fragen zur Anmeldung" onOpen={() => {}} />
      </SidebarCardList>
    ),
  },
  {
    id: "nav-item-sub",
    label: "NavItem, second level",
    size: 16,
    node: (
      <NavItem type="button" level="sub" label="Archiv">
        <Home size={20} />
        <span>Archiv</span>
      </NavItem>
    ),
  },
  {
    id: "input",
    label: "Input leadingIcon",
    size: 16,
    node: <Input aria-label="Suchen" placeholder="Suchen …" leadingIcon={<Search />} />,
  },
];

const measured = (root: HTMLElement, id: string) =>
  root.querySelector(`[data-sample='${id}'] svg`)!.getBoundingClientRect();

/**
 * **Sizes the components set.** Each sample is the real component with an
 * unsized icon (or, for `NavItem`, the 20px JLURAG passes).
 *
 * `play` (Chromium), oracle in brackets: every icon is drawn at the size the
 * page states — square [its box against `SIZED_BY_COMPONENT`]. The dropdown
 * item (18px) is measured in `MenuSizes`, since its content is portalled.
 */
export const Sizes: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-[180px_1fr] items-center gap-x-6 gap-y-3">
      {SIZED_BY_COMPONENT.map((s) => (
        <div key={s.id} className="contents">
          <span className="text-sm text-on-surface-variant">
            {s.label} · {s.size}px
          </span>
          <div data-sample={s.id} className="w-80">
            {s.node}
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const sample of SIZED_BY_COMPONENT) {
      const box = measured(canvasElement, sample.id);
      await expect({ id: sample.id, width: box.width, height: box.height }).toEqual({
        id: sample.id,
        width: sample.size,
        height: sample.size,
      });
    }
  },
};

/**
 * **Menus.** A `DropdownMenuItem` — and `ActionMenu`, built on it — draws its
 * icon at 18px whatever the call site passes.
 *
 * `play` oracle: the open item's icon is 18 × 18 [its box].
 */
export const MenuSizes: Story = {
  render: () => (
    <DropdownMenu defaultOpen modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Menü</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <Pencil size={16} />
          Umbenennen…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const item = await within(canvasElement.ownerDocument.body).findByRole("menuitem", {
      name: "Umbenennen…",
    });
    const box = item.querySelector("svg")!.getBoundingClientRect();
    await expect([box.width, box.height]).toEqual([18, 18]);
  },
};

/**
 * **Sizes the call site sets.** `Button`, `MenuItem` and `Badge` do not size
 * an icon: without a size lucide draws 24px, too large next to their text.
 * The sizes JLURAG uses: 20 in an icon-only button in a bar, 16 beside a
 * button's text, 12 in a filled badge.
 *
 * `play` oracles: an unsized icon in a `Button` is 24px — the reason the call
 * site has to pass one — and the three passed sizes are drawn as passed
 * [the boxes].
 */
export const SizesFromTheCallSite: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <span data-sample="unsized">
        <Button variant="ghost" size="icon" aria-label="Einstellungen (ohne Größe)">
          <Settings />
        </Button>
      </span>
      <span data-sample="bar">
        <Button variant="ghost" size="icon" aria-label="Einstellungen">
          <Settings size={20} />
        </Button>
      </span>
      <span data-sample="with-text">
        <Button variant="outline">
          <Download size={16} />
          Herunterladen
        </Button>
      </span>
      <span data-sample="badge">
        <Badge tone="info">
          <Info size={12} />
          Beta
        </Badge>
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(measured(canvasElement, "unsized").width).toBe(24);
    await expect(measured(canvasElement, "bar").width).toBe(20);
    await expect(measured(canvasElement, "with-text").width).toBe(16);
    await expect(measured(canvasElement, "badge").width).toBe(12);
  },
};

/**
 * **Colour comes from the text.** lucide strokes with `currentColor`, so an
 * icon takes the colour of the text around it — in every tone and theme. Pass
 * no `color`; change the text colour instead.
 *
 * `play` oracle: in each tone the icon's computed colour equals its
 * container's text colour [computed styles against each other].
 */
export const ColourFromText: Story = {
  render: () => (
    <div className="flex w-[520px] flex-col gap-3">
      <Alert tone="success" data-sample="success">
        <AlertDescription>Gespeichert.</AlertDescription>
      </Alert>
      <Alert tone="warning" data-sample="warning">
        <AlertDescription>Die Quelle ist älter als 180 Tage.</AlertDescription>
      </Alert>
      <Alert tone="error" data-sample="error">
        <AlertDescription>Die Datei konnte nicht gelesen werden.</AlertDescription>
      </Alert>
      <div className="flex gap-3">
        <Badge tone="success" data-sample="badge-success">
          <CircleCheck size={12} />
          Aktiv
        </Badge>
        <Button variant="ghost-destructive" data-sample="delete">
          <Trash2 size={16} />
          Löschen
        </Button>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const id of ["success", "warning", "error", "badge-success", "delete"]) {
      const host = canvasElement.querySelector<HTMLElement>(`[data-sample='${id}']`)!;
      const svg = host.querySelector("svg")!;
      await expect({ id, stroke: getComputedStyle(svg).color }).toEqual({
        id,
        stroke: getComputedStyle(svg.parentElement!).color,
      });
    }
  },
};

/**
 * **Naming.** An icon beside text is decoration: lucide marks it
 * `aria-hidden` itself. An icon-only button is named with `aria-label` — the
 * icon cannot name it.
 *
 * `play` (Chromium), oracles in brackets: every icon here is hidden from
 * assistive technology [`aria-hidden`]; each icon-only button has a name
 * [ARIA role and name].
 */
export const Naming: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" aria-label="Quelle entfernen">
        <Trash2 size={20} />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Weitere Aktionen">
        <Ellipsis size={20} />
      </Button>
      <Button variant="outline">
        <Plus size={16} />
        Neues Thema
      </Button>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    for (const svg of canvasElement.querySelectorAll("svg")) {
      await expect(svg).toHaveAttribute("aria-hidden", "true");
    }
    await expect(canvas.getByRole("button", { name: "Quelle entfernen" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Weitere Aktionen" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Neues Thema" })).toBeVisible();
  },
};

/** One row of the dictionary. */
interface Entry {
  action: string;
  icon: ReactNode;
  name: string;
}

/** The dictionary's icons, drawn — the table with the usage counts is in the MDX. */
const DICTIONARY: Entry[] = [
  { action: "Add, create", icon: <Plus size={20} />, name: "Plus" },
  { action: "Delete", icon: <Trash2 size={20} />, name: "Trash2" },
  { action: "Close, remove from a list", icon: <X size={20} />, name: "X" },
  { action: "Edit, rename", icon: <Pencil size={20} />, name: "Pencil" },
  { action: "Search", icon: <Search size={20} />, name: "Search" },
  { action: "Download", icon: <Download size={20} />, name: "Download" },
  { action: "Upload", icon: <Upload size={20} />, name: "Upload" },
  { action: "Copy", icon: <Copy size={20} />, name: "Copy" },
  { action: "Reload, retry", icon: <RefreshCw size={20} />, name: "RefreshCw" },
  { action: "Reset to default", icon: <RotateCcw size={20} />, name: "RotateCcw" },
  { action: "Restore, undo", icon: <Undo2 size={20} />, name: "Undo2" },
  { action: "Settings of an item", icon: <Settings size={20} />, name: "Settings" },
  { action: "View options", icon: <SlidersHorizontal size={20} />, name: "SlidersHorizontal" },
  { action: "More actions", icon: <Ellipsis size={20} />, name: "Ellipsis" },
  { action: "Opens another page", icon: <ArrowUpRight size={20} />, name: "ArrowUpRight" },
  { action: "Opens outside the app", icon: <ExternalLink size={20} />, name: "ExternalLink" },
  { action: "Back (direction)", icon: <ChevronLeft size={20} />, name: "ChevronLeft" },
  { action: "Expand, collapse", icon: <ChevronDown size={20} />, name: "ChevronDown" },
  { action: "Full screen", icon: <Maximize2 size={20} />, name: "Maximize2" },
  { action: "Show / hide", icon: <><Eye size={20} /><EyeOff size={20} /></>, name: "Eye · EyeOff" },
  { action: "Locked", icon: <Lock size={20} />, name: "Lock" },
  { action: "Send", icon: <ArrowUp size={20} />, name: "ArrowUp" },
  { action: "Information", icon: <Info size={20} />, name: "Info" },
  { action: "Success", icon: <CircleCheck size={20} />, name: "CircleCheck" },
  { action: "Warning", icon: <TriangleAlert size={20} />, name: "TriangleAlert" },
  { action: "Error", icon: <CircleX size={20} />, name: "CircleX" },
];

/** **The dictionary, drawn.** One icon per action, at 20px. */
export const Dictionary: Story = {
  render: () => (
    <div className="grid w-[720px] grid-cols-3 gap-x-6 gap-y-2">
      {DICTIONARY.map((e) => (
        <div key={e.name} className="flex items-center gap-3 text-sm text-on-surface">
          <span className="flex w-11 shrink-0 gap-1 text-on-surface-variant">{e.icon}</span>
          <span className="min-w-0">
            {e.action}
            <span className="block font-mono text-xs text-on-surface-variant">{e.name}</span>
          </span>
        </div>
      ))}
    </div>
  ),
};
