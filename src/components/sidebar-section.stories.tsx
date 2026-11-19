import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { Home, MessageSquare, Pencil, Trash2, Users } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { SidebarCard, SidebarCardList } from "./sidebar-card";
import { SidebarCardGroup, SidebarSection } from "./sidebar-section";
import { SidebarFilterMenu } from "./sidebar-filter-menu";
import { Sortable, SortableGroup, SortableItem, SortableOverlay } from "./sortable";

/**
 * A side panel's list in named, foldable sections: "Angepinnt", sections of
 * the user's own, and the plain history. Rows are dragged between them
 * (`Sortable`); the user's own sections are sorted by their heading and
 * renamed in it.
 */
const meta = {
  title: "Components/Navigation/SidebarSection",
  component: SidebarSection,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SidebarSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const TITLES: Record<string, string> = {
  a: "Wer ist für KI zuständig?", b: "Budget 2027", c: "Shibboleth für 8 Universitäten", d: "Datei-Browser",
  e: "Agenten-Repository", f: "Offene Punkte",
};
const LOCKED = ["recent"];

function History() {
  const [value, setValue] = useState<Record<string, string[]>>({
    pinned: ["a", "b"], work: ["c"], home: [], recent: ["d", "e", "f"],
  });
  const [names, setNames] = useState<Record<string, string>>({ pinned: "Angepinnt", work: "Arbeit", home: "Privat", recent: "Verlauf" });
  const [folded, setFolded] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [activity, setActivity] = useState("all");
  const listRef = useRef<HTMLUListElement>(null);
  const row = (id: string, shared = false) => (
    <SortableItem key={id} value={id} asChild>
      <SidebarCard
        title={TITLES[id]}
        icon={<MessageSquare />}
        indicator={shared ? <Users aria-hidden="true" className="size-4" /> : <Home aria-hidden="true" className="size-4" />}
        onOpen={() => {}}
        actionsLabel="Aktionen für"
        actions={[{ label: "Umbenennen", icon: <Pencil aria-hidden="true" className="size-4" />, onSelect: () => {} }]}
      />
    </SortableItem>
  );
  return (
    <div className="w-80">
      <Sortable
        value={value}
        onValueCommit={setValue}
        strategy="vertical"
        lockedGroups={LOCKED}
        sortableGroups={["work", "home"]}
        placement="start"
        outside={{ boundsRef: listRef, group: "recent" }}
      >
        <ul ref={listRef} className="m-0 flex list-none flex-col p-0" data-sidebar-card-groups="">
          {Object.keys(value).filter((key) => key !== "recent").map((key) => (
            <SortableGroup key={key} value={key} items={value[key]} asChild unstyled>
              <SidebarSection
                label={names[key]}
                open={!folded.includes(key)}
                onOpenChange={(open) => setFolded((prev) => (open ? prev.filter((k) => k !== key) : [...prev, key]))}
                empty="Hier ist noch nichts"
                renaming={renaming === key}
                renameLabel="Name des Abschnitts"
                onRename={(name) => {
                  setRenaming(null);
                  if (name) setNames((prev) => ({ ...prev, [key]: name }));
                }}
                actionsLabel={`Aktionen für ${names[key]}`}
                actions={key === "pinned" ? [] : [
                  { label: "Abschnitt umbenennen", icon: <Pencil aria-hidden="true" className="size-4" />, onSelect: () => setTimeout(() => setRenaming(key), 0) },
                  { label: "Abschnitt löschen", icon: <Trash2 aria-hidden="true" className="size-4" />, destructive: true, separatorBefore: true, onSelect: () => {} },
                ]}
              >
                {value[key].length > 0 && <SidebarCardList>{value[key].map((id) => row(id))}</SidebarCardList>}
              </SidebarSection>
            </SortableGroup>
          ))}
          <SortableGroup value="recent" items={value.recent} asChild unstyled>
            <SidebarSection
              label={names.recent}
              open={!folded.includes("recent")}
              onOpenChange={(open) => setFolded((prev) => (open ? prev.filter((k) => k !== "recent") : [...prev, "recent"]))}
              aside={(
                <SidebarFilterMenu
                  label="Filter"
                  activeLabel="Filter aktiv"
                  active={activity !== "all"}
                  filters={[{ key: "activity", label: "Letzte Aktivität", value: activity, options: [{ value: "all", label: "Alle" }, { value: "week", label: "Diese Woche" }] }]}
                  onValueChange={(_, next) => setActivity(next)}
                  resetLabel="Zurücksetzen"
                  resetDisabled={activity === "all"}
                  onReset={() => setActivity("all")}
                />
              )}
            >
              <SidebarCardGroup label="Heute">
                <SidebarCardList>{value.recent.map((id) => row(id, true))}</SidebarCardList>
              </SidebarCardGroup>
            </SidebarSection>
          </SortableGroup>
        </ul>
        <SortableOverlay lift="row">
          {({ value: id }) => (
            <ul className="m-0 list-none rounded-[var(--ui-radius-row)] bg-surface-container p-0">
              <SidebarCard title={TITLES[id]} icon={<MessageSquare />} onOpen={() => {}} />
            </ul>
          )}
        </SortableOverlay>
      </Sortable>
    </div>
  );
}

/** Sections, an empty one, and the plain history with its filter. */
export const Sections: Story = {
  args: { label: "Angepinnt" },
  render: () => <History />,
  // Oracle: the heading folds its section, and a section is renamed in its heading.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pinned = canvas.getByRole("button", { name: "Angepinnt" });
    await expect(canvas.getByText("Budget 2027")).toBeVisible();
    await userEvent.click(pinned);
    await expect(canvas.queryByText("Budget 2027")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Angepinnt" }));
    await expect(canvas.getByText("Hier ist noch nichts")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Aktionen für Arbeit" }));
    await userEvent.click(await within(document.body).findByRole("menuitem", { name: "Abschnitt umbenennen" }));
    const field = await canvas.findByRole("textbox", { name: "Name des Abschnitts" });
    await expect(field).toHaveValue("Arbeit");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByRole("button", { name: "Arbeit" })).toBeVisible();
  },
};
