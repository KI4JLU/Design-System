import type { Meta, StoryObj } from "@storybook/react-vite";
import { createElement, type ReactNode } from "react";
import { expect, within } from "storybook/test";
import {
  CircleCheck,
  Download,
  Ellipsis,
  Home,
  Info,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
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
import { Spinner } from "../components/spinner";
import { ICON_DICTIONARY } from "./icon-dictionary";
import { ICON_REGISTRY } from "./icon-registry";
import iconUsage from "./icon-usage.json";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/table";

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

/* -- The dictionary and the inventory -------------------------------------- */

/** Which glyphs the DS components and JustRAG use — scripts/icon-usage.mjs writes both files. */
const USAGE = iconUsage as {
  ds: Record<string, string[]>;
  justrag: { ref: string; icons: Record<string, { files: number; names: string[] }> };
};

/** JustRAG files importing this glyph, under any of its names. */
const justragFiles = (name: string) => USAGE.justrag.icons[name]?.files ?? 0;

/** `code` spans in a note, as the rest of the page sets them. */
function withCode(text: string) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith("`") ? (
      <code key={i} className="font-mono text-xs">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

function DictionaryIcon({ name }: { name: string }) {
  // A looked-up lucide component, the same object on every render.
  const glyph = ICON_REGISTRY[name];
  return (
    <span data-slot="dictionary-icon" className="flex items-center gap-2">
      <span className="flex size-5 shrink-0 items-center justify-center text-on-surface">
        {name === "Spinner" ? <Spinner label="Beispiel: wird geladen" /> : glyph && createElement(glyph, { size: 20, "aria-hidden": true })}
      </span>
      <code className="font-mono text-xs text-on-surface-variant">{name}</code>
    </span>
  );
}

/**
 * **The dictionary.** Every icon in use and what it means, drawn at 20px
 * beside its name, in groups (`icon-dictionary.ts`) — and in how many JustRAG
 * files each is imported (any of its names).
 *
 * `play` oracle: every row draws as many icons as it names [the DOM].
 */
export const Dictionary: Story = {
  render: () => (
    <Table aria-label="Icon per action" className="max-w-[56rem]">
      <TableHeader>
        <TableRow>
          <TableHead>Meaning</TableHead>
          <TableHead>Icon</TableHead>
          <TableHead>JustRAG files</TableHead>
        </TableRow>
      </TableHeader>
      {ICON_DICTIONARY.map(({ group, entries }) => (
        <TableBody key={group}>
          <TableRow>
            <TableHead section colSpan={3}>
              {group}
            </TableHead>
          </TableRow>
            {entries.map((e) => (
              <TableRow key={e.meaning} data-icons={e.icons.length}>
                <TableCell>{e.meaning}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {e.icons.map((name) => (
                      <DictionaryIcon key={name} name={name} />
                    ))}
                  </div>
                  {e.note && <div className="mt-1 text-xs text-on-surface-variant">{withCode(e.note)}</div>}
                </TableCell>
                <TableCell className="text-on-surface-variant">
                  {e.icons.map((name) => (name === "Spinner" ? "—" : String(justragFiles(name)))).join(" / ")}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      ))}
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLTableRowElement>("tr[data-icons]")];
    await expect(rows).toHaveLength(ICON_DICTIONARY.flatMap((g) => g.entries).length);
    for (const row of rows) {
      const drawn = row.querySelectorAll("[data-slot=dictionary-icon] svg").length;
      await expect([row.cells[0].textContent, drawn]).toEqual([row.cells[0].textContent, Number(row.dataset.icons)]);
    }
  },
};

interface InventoryItem {
  name: string;
  aliases: string[];
  components: string[];
  justrag: number;
}

/** Every glyph a DS component draws or JustRAG imports, by its current name. */
const INVENTORY: InventoryItem[] = Object.keys(ICON_REGISTRY)
  .sort()
  .map((name) => ({
    name,
    aliases: (USAGE.justrag.icons[name]?.names ?? []).filter((n) => n !== name),
    components: USAGE.ds[name] ?? [],
    justrag: justragFiles(name),
  }));

function InventoryGlyph({ name }: { name: string }) {
  return createElement(ICON_REGISTRY[name], { size: 20, "aria-hidden": true, className: "mt-0.5 shrink-0" });
}

/**
 * **Every icon in use** — each one a DS component draws or JustRAG imports
 * (`src/docs/icon-usage.json`, written by `scripts/icon-usage.mjs`). One tile
 * per glyph: its current name, the other names JustRAG imports it as, the
 * components that draw it, the JustRAG files that import it.
 *
 * `play` oracle: every tile draws its icon, and `SidebarSection`'s chevrons
 * and `Sortable`'s grips are among them [the DOM].
 */
export const Inventory: Story = {
  render: () => (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-6 gap-y-3 p-0">
      {INVENTORY.map(({ name, aliases, components, justrag }) => (
        <li key={name} data-slot="inventory-icon" data-name={name} className="flex items-start gap-3 text-sm text-on-surface">
          <InventoryGlyph name={name} />
          <span className="min-w-0">
            <code className="font-mono text-xs">{name}</code>
            {aliases.length > 0 && (
              <span className="block text-xs text-on-surface-variant">imported as {aliases.join(", ")}</span>
            )}
            <span className="block text-xs text-on-surface-variant">
              {[components.length > 0 && `DS: ${components.join(", ")}`, justrag > 0 && `JustRAG: ${justrag}`]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    const tiles = [...canvasElement.querySelectorAll<HTMLElement>("[data-slot=inventory-icon]")];
    for (const tile of tiles) await expect([tile.dataset.name, tile.querySelectorAll("svg").length]).toEqual([tile.dataset.name, 1]);
    const names = tiles.map((t) => t.dataset.name);
    for (const name of ["ChevronDown", "ChevronRight", "GripVertical", "GripHorizontal", "ListFilter"]) {
      await expect(names).toContain(name);
    }
  },
};
