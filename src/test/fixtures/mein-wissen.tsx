import { useState } from "react";
import { FolderPlus, LayoutGrid, List, Plus, Star } from "lucide-react";
import { Button } from "../../components/button";
import { FilterChips } from "../../components/filter-chips";
import { SegmentedControl } from "../../components/segmented-control";
import { GridLayout, type GridLayoutProps } from "../../templates/grid-layout";
import { TopicCard, TopicListHeader, TopicRow } from "./topic-card";
import { TOPICS, type Topic } from "./topics";

/* ---------------------------------------------------------------------------
 * Story fixture — JLURAG's „Mein Wissen" page as `GridLayout` content: the
 * filters, the „Karten / Liste" switch, „Neues Thema" and the topic cards.
 * Shared by `Templates/GridLayout` and the overview context of
 * `Templates/AppShellLayout`, so both show the same page. Not part of the
 * package: `src/test` is excluded from the type build.
 * ------------------------------------------------------------------------- */

const FILTERS = [
  { value: "all", label: "Alle" },
  { value: "favorites", label: "Favoriten", icon: <Star className="size-4" aria-hidden="true" /> },
  { value: "personal", label: "Privat" },
  { value: "shared", label: "Geteilt" },
  { value: "studium", label: "Studium", color: "var(--color-category-1)" },
  { value: "lehre", label: "Lehre", color: "var(--color-category-3)" },
  { value: "recherche", label: "Recherche", color: "var(--color-category-5)" },
];

type View = NonNullable<GridLayoutProps["view"]>;

/** The page, as „Mein Wissen" composes it — the view is local state here. */
export function MeinWissen({
  initialView = "cards",
  topics = TOPICS,
  withFavorites = true,
}: {
  initialView?: View;
  topics?: Topic[];
  withFavorites?: boolean;
}) {
  const [view, setView] = useState<View>(initialView);
  const [filter, setFilter] = useState("all");
  const cell = (t: Topic) => (view === "list" ? <TopicRow key={t.id} topic={t} /> : <TopicCard key={t.id} topic={t} />);
  const favorites = topics.filter((t) => t.favorite);
  const rest = topics.filter((t) => !t.favorite);
  return (
    <GridLayout
      label="Mein Wissen"
      title="Mein Wissen"
      description="Deine privaten Themen und Quellen. Du kannst dein Wissen jederzeit mit anderen teilen."
      filters={
        <FilterChips
          aria-label="Themen filtern"
          options={FILTERS}
          value={filter}
          onValueChange={setFilter}
          onAdd={() => {}}
          addLabel="Kategorie hinzufügen"
        />
      }
      toolbarActions={
        <>
          <SegmentedControl
            aria-label="Ansicht"
            value={view}
            onValueChange={(v) => setView(v as View)}
            options={[
              { value: "cards", label: "Karten", icon: <LayoutGrid className="size-4" aria-hidden="true" />, showLabel: true },
              { value: "list", label: "Liste", icon: <List className="size-4" aria-hidden="true" />, showLabel: true },
            ]}
          />
          <Button>
            <Plus size={16} />
            Neues Thema
          </Button>
        </>
      }
      view={view}
      listHeader={<TopicListHeader />}
      uniformRows
      {...(withFavorites
        ? {
            groups: [
              { id: "favorites", label: "Favoriten", items: favorites.map(cell) },
              { id: "rest", label: "Weitere Themen", items: rest.map(cell) },
            ],
          }
        : { items: topics.map(cell) })}
      emptyState={<NoTopics />}
    />
  );
}

/** „Mein Wissen" without any topic, as the app shows it. */
function NoTopics() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--ui-radius-box)] border border-dashed border-outline-variant px-6 py-12 text-center">
      <FolderPlus size={28} className="text-on-surface" />
      <p className="m-0 font-semibold text-on-surface">Noch keine eigenen Themen</p>
      <p className="m-0 text-sm text-on-surface-variant">
        Lege ein Thema an, füge Quellen hinzu und stelle Fragen dazu.
      </p>
      <Button variant="outline" className="mt-2">
        <Plus size={16} />
        Neues Thema
      </Button>
    </div>
  );
}
