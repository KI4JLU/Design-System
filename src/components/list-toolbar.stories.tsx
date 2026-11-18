import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ArrowUpDown, ListFilter, Search } from "lucide-react";
import { Input } from "./input";
import { FilterMenu } from "./filter-menu";
import { ListToolbar } from "./list-toolbar";

const FILTER_OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pause" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "conversations", label: "Gespräche" },
  { value: "rating", label: "Bewertung" },
];

const meta = {
  title: "Components/Lists & Filters/ListToolbar",
  component: ListToolbar,
} satisfies Meta<typeof ListToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveExample = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name");
  return (
    <ListToolbar
      search={
        <Input
          leadingIcon={<Search aria-hidden />}
          placeholder="Durchsuchen…"
          aria-label="Durchsuchen"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      }
      filters={
        <>
          <FilterMenu
            icon={ListFilter}
            label="Filter"
            options={FILTER_OPTIONS}
            value={statusFilter}
            defaultValue="all"
            onChange={setStatusFilter}
          />
          <FilterMenu
            icon={ArrowUpDown}
            label="Sortieren"
            options={SORT_OPTIONS}
            value={sortOption}
            defaultValue="name"
            onChange={setSortOption}
          />
        </>
      }
    />
  );
};

/** Typischer Einsatz: Suche links, Filter/Sortieren rechts — z. B. als `DashboardLayout`s `toolbar`. */
export const Playground: Story = {
  render: () => <InteractiveExample />,
};
