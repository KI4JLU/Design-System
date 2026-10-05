import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookOpen, FileQuestion, LayoutDashboard, Plus, Search, Users } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import { EmptyState } from "./empty-state";
import { Input } from "./input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const ICON = { "aria-hidden": true, width: "1em", height: "1em" } as const;

const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: { a11y: { test: "error" } },
  args: {
    icon: <LayoutDashboard />,
    title: "Noch keine Widgets",
    description: "Füge Widgets hinzu, um dein Dashboard zusammenzustellen.",
    size: "default",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["default", "compact"] },
    headingLevel: { control: "select", options: [undefined, 1, 2, 3, 4, 5, 6] },
    icon: { control: false },
    actions: { control: false },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Seitenebene in einer `Card`: das leere Dashboard. Der Titel ist hier ein
 * Abschnitt der Seite (`headingLevel={2}`), die Aktion führt zum ersten Inhalt.
 */
export const PageInCard: Story = {
  render: () => (
    <Card className="max-w-2xl">
      <EmptyState
        icon={<LayoutDashboard />}
        title="Noch keine Widgets"
        description="Füge Widgets hinzu, um dein Dashboard zusammenzustellen. Du kannst sie danach frei anordnen."
        headingLevel={2}
        actions={
          <Button>
            <Plus {...ICON} />
            Widget hinzufügen
          </Button>
        }
      />
    </Card>
  ),
};

/** Ganze Seite statt Inhalt: nicht gefunden. Der Titel ist die Seitenüberschrift. */
export const NotFound: Story = {
  render: () => (
    <Card className="max-w-xl">
      <EmptyState
        icon={<FileQuestion />}
        title="Seite nicht gefunden"
        description="Die Adresse ist veraltet oder die Komponente wurde entfernt."
        headingLevel={1}
        actions={
          <>
            <Button variant="outline">Zurück</Button>
            <Button>Zum Dashboard</Button>
          </>
        }
      />
    </Card>
  ),
};

/**
 * `compact` in der Leerzeile einer Tabelle: eine `TableCell` mit `colSpan`
 * über alle Spalten, Kopfzeile bleibt stehen. Titel als `<p>`.
 */
export const CompactInTable: Story = {
  render: () => (
    <Card className="max-w-3xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Rolle</TableHead>
            <TableHead>Letzte Anmeldung</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>
              <EmptyState
                size="compact"
                icon={<Users />}
                title="Noch keine Nutzer"
                description="Nutzer erscheinen hier nach ihrer ersten Anmeldung."
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  ),
};

/** Nur ein Titel, `compact`: die leere Glossarliste im Dialog des Übersetzers. */
export const CompactTitleOnly: Story = {
  render: () => (
    <Card className="max-w-sm">
      <EmptyState size="compact" icon={<BookOpen />} title="Noch keine Glossare" />
    </Card>
  ),
};

const APPS = ["Mail", "Moodle", "Stud.IP", "FlexNow", "Übersetzer", "Transkription"];

function SearchWithoutHits() {
  const [query, setQuery] = useState("Stundenplan");
  const matches = APPS.filter((app) => app.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Card className="flex max-w-sm flex-col gap-stack-sm p-4">
      <Input
        type="search"
        aria-label="Apps durchsuchen"
        leadingIcon={<Search {...ICON} />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {matches.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<Search />}
          title="Keine Treffer"
          description={`Keine App passt zu „${query.trim()}“.`}
          actions={
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              Suche zurücksetzen
            </Button>
          }
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-on-surface">
          {matches.map((app) => (
            <li key={app}>{app}</li>
          ))}
        </ul>
      )}
      {/* The count is announced by the call site, not by EmptyState. */}
      <p role="status" className="sr-only">
        {query.trim() ? `${matches.length} Treffer` : ""}
      </p>
    </Card>
  );
}

/**
 * Suche ohne Treffer (Popover „Weitere Apps"), mit Aktion. Die Trefferzahl
 * sagt ein eigenes `role="status"` am Aufrufort an.
 */
export const SearchNoResults: Story = {
  render: () => <SearchWithoutHits />,
};
