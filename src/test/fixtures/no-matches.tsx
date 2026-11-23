import { SearchX } from "lucide-react";
import { Button } from "../../components/button";

/**
 * Story fixture — what an overview page shows when its collection has items
 * but the selected filter matches none of them. Distinct from the page's own
 * empty state („Noch nichts geteilt"), which is for a collection that is
 * empty: a filter with no matches must not claim there is nothing at all, and
 * it offers the way back to „Alle".
 */
export function NoMatches({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--ui-radius-box)] border border-dashed border-outline-variant px-6 py-12 text-center">
      <SearchX size={28} className="text-on-surface" aria-hidden="true" />
      <p className="m-0 font-semibold text-on-surface">Keine Themen für diesen Filter</p>
      <Button variant="outline" className="mt-2" onClick={onReset}>
        Filter zurücksetzen
      </Button>
    </div>
  );
}
