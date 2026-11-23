import { useState } from "react";
import { LayoutGrid, List, Plus, Star, Users } from "lucide-react";
import { Button } from "../../components/button";
import { FilterChips, type FilterChipsOption } from "../../components/filter-chips";
import { SegmentedControl } from "../../components/segmented-control";
import { GridLayout, type GridLayoutProps } from "../../templates/grid-layout";
import {
  CatalogCard,
  CatalogListHeader,
  CatalogRow,
  TopicCard,
  TopicListHeader,
  TopicRow,
} from "./topic-card";
import { CATALOG, CATEGORIES, SHARED_TOPICS, type CatalogEntry, type Topic } from "./topics";

/* ---------------------------------------------------------------------------
 * Story fixture — JLURAG's other two overview pages as `GridLayout` content
 * (`development`, Nov 2026), beside „Mein Wissen" (`./mein-wissen`):
 *
 *  - „Geteiltes Wissen" (`SharedTopicsView.tsx`): topics somebody shared with
 *    you and public topics you subscribed to, as topic cards with „von …";
 *    no „Privat / Geteilt" chips (every topic here is shared), „Thema
 *    hinzufügen" leads to „Entdecken".
 *  - „Entdecken" (`DiscoverView.tsx`, `KbCatalogPanel.tsx`): the catalog of
 *    public topics, with „Abonnieren" / „Abonniert"; no „Favoriten" chip and
 *    no primary action. JLURAG renders this page with `Container` and
 *    `PageHeader` and its own list, at most two cards per row — a catalog
 *    card's band holds the name AND the subscribe button, and in a 17.5rem
 *    cell the name is cut after a word or two. `GridLayout` has no option
 *    for wider cells, so the fixture sets the two columns through
 *    `renderGroup` (an open point for the template, see the story).
 *
 * Not part of the package: `src/test` is excluded from the type build.
 * ------------------------------------------------------------------------- */

type View = NonNullable<GridLayoutProps["view"]>;

/** The platform's categories, as every overview page offers them. */
const CATEGORY_CHIPS: FilterChipsOption[] = Object.entries(CATEGORIES).map(([value, c]) => ({
  value,
  label: c.name,
  color: c.color,
}));

const FAVORITES_CHIP: FilterChipsOption = {
  value: "favorites",
  label: "Favoriten",
  icon: <Star className="size-4" aria-hidden="true" />,
};

/** „Alle", optionally „Favoriten", the categories, and „+" for the category manager. */
function TopicFilters({ favorites }: { favorites: boolean }) {
  const [filter, setFilter] = useState("all");
  return (
    <FilterChips
      aria-label="Themen filtern"
      options={[{ value: "all", label: "Alle" }, ...(favorites ? [FAVORITES_CHIP] : []), ...CATEGORY_CHIPS]}
      value={filter}
      onValueChange={setFilter}
      onAdd={() => {}}
      addLabel="Kategorie hinzufügen"
    />
  );
}

/** „Karten / Liste". */
function ViewSwitch({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <SegmentedControl
      aria-label="Ansicht"
      value={view}
      onValueChange={(v) => onChange(v as View)}
      options={[
        { value: "cards", label: "Karten", icon: <LayoutGrid className="size-4" aria-hidden="true" />, showLabel: true },
        { value: "list", label: "Liste", icon: <List className="size-4" aria-hidden="true" />, showLabel: true },
      ]}
    />
  );
}

/** „Geteiltes Wissen" — `topics` empty shows the page's empty state. */
export function GeteiltesWissen({
  initialView = "cards",
  topics = SHARED_TOPICS,
}: {
  initialView?: View;
  topics?: Topic[];
}) {
  const [view, setView] = useState<View>(initialView);
  const addTopic = (
    <>
      <Plus className="size-4" aria-hidden="true" />
      Thema hinzufügen
    </>
  );
  return (
    <GridLayout
      label="Geteiltes Wissen"
      title="Geteiltes Wissen"
      description="Themen, die andere mit dir oder deinen Gruppen geteilt haben, und öffentliche Themen, die du abonniert hast."
      filters={<TopicFilters favorites />}
      toolbarActions={
        <>
          <ViewSwitch view={view} onChange={setView} />
          <Button>{addTopic}</Button>
        </>
      }
      view={view}
      listHeader={<TopicListHeader />}
      uniformRows
      items={topics.map((t) =>
        view === "list" ? <TopicRow key={t.id} topic={t} /> : <TopicCard key={t.id} topic={t} />,
      )}
      emptyState={
        <div className="flex flex-col items-center gap-2 rounded-[var(--ui-radius-box)] border border-dashed border-outline-variant px-6 py-12 text-center">
          <Users size={28} className="text-on-surface" aria-hidden="true" />
          <p className="m-0 font-semibold text-on-surface">Noch nichts geteilt</p>
          <p className="m-0 text-sm text-on-surface-variant">
            Hier erscheinen Themen, die andere mit dir teilen, und öffentliche Themen, die du
            hinzufügst.
          </p>
          <Button variant="outline" className="mt-2">
            {addTopic}
          </Button>
        </div>
      }
    />
  );
}

/** „Entdecken" — `entries` empty shows the catalog's empty state. */
export function Entdecken({
  initialView = "cards",
  entries = CATALOG,
}: {
  initialView?: View;
  entries?: CatalogEntry[];
}) {
  const [view, setView] = useState<View>(initialView);
  return (
    <GridLayout
      label="Entdecken"
      title="Entdecken"
      description="Entdecke Themen, die von Mitgliedern der JLU für alle bereitgestellt wurden."
      filters={<TopicFilters favorites={false} />}
      toolbarActions={<ViewSwitch view={view} onChange={setView} />}
      view={view}
      listHeader={<CatalogListHeader />}
      // Two cards per row from `lg` up, as JLURAG lays the catalog out.
      renderGroup={(grid) =>
        view === "cards" ? (
          <div className="contents [&>[data-slot=grid-layout-grid]]:lg:grid-cols-2">{grid}</div>
        ) : (
          grid
        )
      }
      items={entries.map((e) =>
        view === "list" ? <CatalogRow key={e.id} entry={e} /> : <CatalogCard key={e.id} entry={e} />,
      )}
      emptyState={
        <div className="flex flex-col gap-2">
          <p className="m-0 text-lg font-semibold text-on-surface">Keine weiteren Themen verfügbar</p>
          <p className="m-0 text-on-surface-variant">
            Sobald neue Themen für alle Mitglieder der JLU bereitgestellt werden, findest du sie hier.
          </p>
        </div>
      }
    />
  );
}
