import { useState } from "react";
import {
  Bot,
  Crown,
  Eye,
  FileCheck,
  History,
  House,
  LifeBuoy,
  Lock,
  MessagesSquare,
  Pencil,
  Plus,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "../../components/alert";
import { Avatar } from "../../components/avatar";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { Checkbox } from "../../components/checkbox";
import { FilterChips } from "../../components/filter-chips";
import { SelectableCard, SelectableCardGroup } from "../../components/selectable-card";
import { SettingsDialog } from "../../components/settings-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/table";

/* ---------------------------------------------------------------------------
 * Story fixture — a topic's settings as JLURAG renders them
 * (`KbSettingsDialog.tsx`, `development`, screenshots of 20.11.2026): the
 * gear in the topic view's bar opens a `SettingsDialog` („Thema-Einstellungen",
 * `size="xl"`, maximizable) with five sections — Startseite, Verhalten,
 * Berechtigungen, Mitglieder, Versionsverlauf — and a footer with the draft
 * state and „Abbrechen / Speichern" (none in Versionsverlauf).
 *
 * This is where JLURAG's tables and forms live: in this window and in the
 * admin console (also a `SettingsDialog`), not on pages of the app shell.
 * Built from DS parts only; JLURAG's own pieces are reduced — the start-page
 * preview (`StartPageParts.tsx`), the role cards (`BehaviorSection`), the
 * role header's hover card and the narrow one-role view of the rights
 * (`KbRolesRightsTab.tsx`). Not part of the package.
 * ------------------------------------------------------------------------- */

/** JLURAG's `kbSettingsTitle`: the dialog's name and its sections' group. */
export const TOPIC_SETTINGS_TITLE = "Thema-Einstellungen";

/* -- Startseite ------------------------------------------------------------ */

function StartPageSection({ topic }: { topic: string }) {
  return (
    <div className="flex flex-col gap-4 pt-6">
      <Alert tone="info">
        <AlertDescription>
          So sehen Mitglieder die Startseite. Mit „Bearbeiten" änderst du einen Bereich direkt an
          seiner Stelle.
        </AlertDescription>
      </Alert>
      <div className="relative flex flex-col items-center gap-2 rounded-[var(--ui-radius-box)] border border-outline-variant px-6 pt-16 pb-6 text-center">
        <Button variant="outline" size="sm" className="absolute top-3 right-3">
          <Pencil className="size-4" aria-hidden="true" />
          Bearbeiten
        </Button>
        <p className="m-0 font-display-lg text-display-lg text-on-surface">{topic}</p>
        <p className="m-0 text-xs text-on-surface-variant">1 Dokument · Stand 20.11.2026</p>
        <p className="m-0 max-w-xl text-sm text-on-surface-variant">
          Frage mich alles, was du über deine Quellen wissen möchtest. Ich kann dir helfen,
          Zusammenfassungen zu erstellen, Informationen zu finden und Ideen zu synthetisieren.
        </p>
        <p className="m-0 mt-8 text-xs text-on-surface-variant">
          Antworten werden basierend auf deinen hochgeladenen Quellen generiert. Die KI kann Fehler
          machen, überprüfe wichtige Informationen.
        </p>
      </div>
    </div>
  );
}

/* -- Verhalten -------------------------------------------------------------- */

const ROLES = [
  { id: "assistant", name: "Assistent", text: "Beantwortet Fragen aus den Quellen dieses Themas.", icon: Bot },
  { id: "summary", name: "Zusammenfassen", text: "Verdichtet lange Dokumente auf Kernaussagen.", icon: MessagesSquare },
  { id: "check", name: "Datei prüfen", text: "Prüft hochgeladene Dokumente auf Vollständigkeit.", icon: FileCheck },
  { id: "support", name: "Support", text: "Löst technische Probleme mit klaren Schritten.", icon: LifeBuoy },
];

function BehaviorSection() {
  const [filter, setFilter] = useState("all");
  const [role, setRole] = useState("summary");
  return (
    <div className="flex flex-col gap-4 pt-6">
      <h3 className="m-0 text-base font-semibold text-on-surface">Rolle</h3>
      <p className="m-0 text-sm text-on-surface-variant">
        Wähle eine Rolle – darunter siehst du sie im Chat und ihren Systemprompt. Übernommen wird
        sie erst mit „Diese Rolle verwenden".
      </p>
      <FilterChips
        aria-label="Rollen filtern"
        value={filter}
        onValueChange={setFilter}
        options={[
          { value: "all", label: "Alle (4)" },
          { value: "templates", label: "Vorlagen (4)" },
          { value: "own", label: "Eigene (0)" },
        ]}
      />
      <SelectableCardGroup
        aria-label="Rolle"
        value={role}
        onValueChange={setRole}
        className="grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3"
      >
        {ROLES.map(({ id, name, text, icon: Icon }) => (
          <SelectableCard key={id} value={id} selectedLook="outline" className="p-4 text-left">
            <span className="flex flex-col gap-2">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <span className="font-semibold text-on-surface">{name}</span>
              <span className="text-sm text-on-surface-variant">{text}</span>
              {id === role && (
                <Badge tone="primary" className="w-fit">
                  Aktiv
                </Badge>
              )}
            </span>
          </SelectableCard>
        ))}
      </SelectableCardGroup>
    </div>
  );
}

/* -- Berechtigungen --------------------------------------------------------- */

/** The columns: Besitzer and Admin always have every right (one muted band). */
const RIGHT_ROLES = [
  { role: "Besitzer", icon: Crown, fixed: true },
  { role: "Admin", icon: Shield, fixed: true },
  { role: "Bearbeiter", icon: Pencil, fixed: false },
  { role: "Leser", icon: Eye, fixed: false },
];

type Cell = boolean | "na" | string;

/** The rights by group (JLURAG `KB_RIGHT_GROUPS`); cells for Bearbeiter, Leser. */
const RIGHT_GROUPS: { group: string; rights: { right: string; fixed: Cell[]; cells: Cell[] }[] }[] = [
  {
    group: "Thema",
    rights: [
      { right: "Personen einladen", fixed: ["alle Rollen", "bis Admin"], cells: ["Nein", "Nein"] },
    ],
  },
  {
    group: "Quellen in der Sidebar",
    rights: [
      { right: "Sehen", fixed: [true, true], cells: [true, false] },
      { right: "Hinzufügen", fixed: [true, true], cells: [true, "na"] },
      { right: "Herunterladen", fixed: [true, true], cells: [true, false] },
      { right: "Bearbeiten", fixed: [true, true], cells: [true, "na"] },
    ],
  },
  {
    group: "Antworten",
    rights: [{ right: "Quellenangaben anzeigen", fixed: [true, true], cells: [true, false] }],
  },
];

function RightCell({ value, label, locked }: { value: Cell; label: string; locked: boolean }) {
  if (value === "na") return <span aria-label={`${label}: nicht möglich`}>–</span>;
  if (typeof value === "string") return <span>{value}</span>;
  return locked ? (
    <Checkbox locked checked={value} aria-label={`${label} (fest)`} />
  ) : (
    <Checkbox defaultChecked={value} aria-label={label} />
  );
}

function RightsSection({ onAssignPeople }: { onAssignPeople: () => void }) {
  const fixedCount = RIGHT_ROLES.filter((r) => r.fixed).length;
  const join = (j: number) =>
    j >= fixedCount ? undefined : j === 0 ? "start" : j === fixedCount - 1 ? "end" : "middle";
  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-on-surface-variant">
          Legt fest, was Bearbeiter und Leser in diesem Thema dürfen.
        </p>
        <Button variant="outline" onClick={onAssignPeople}>
          <UserPlus className="size-4" aria-hidden="true" />
          Personen zuweisen
        </Button>
      </div>
      <Table aria-label="Rechte je Rolle">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead wrap="words" className="align-bottom">
              Recht
            </TableHead>
            {RIGHT_ROLES.map(({ role, icon: Icon, fixed }, j) => (
              <TableHead
                key={role}
                wrap="words"
                muted={fixed}
                mutedEdge={fixed ? "top" : undefined}
                mutedJoin={join(j)}
                className="h-auto py-2 text-center align-top"
              >
                <span className="flex flex-col items-center gap-1">
                  <span
                    className="inline-flex size-8 items-center justify-center rounded-md bg-primary-fixed text-on-primary-fixed"
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="font-semibold text-on-surface">{role}</span>
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        {RIGHT_GROUPS.map((g, gi) => (
          <TableBody key={g.group}>
            <TableRow>
              <TableHead section="band" count={g.rights.length}>
                {g.group}
              </TableHead>
              {RIGHT_ROLES.map((r, j) => (
                <TableCell key={r.role} aria-hidden="true" muted={r.fixed} mutedJoin={join(j)} />
              ))}
            </TableRow>
            {g.rights.map((row, ri) => {
              const last = gi === RIGHT_GROUPS.length - 1 && ri === g.rights.length - 1;
              return (
                <TableRow key={row.right}>
                  <TableHead scope="row" wrap="words" className="font-normal text-on-surface">
                    {row.right}
                  </TableHead>
                  {RIGHT_ROLES.map((r, j) => (
                    <TableCell
                      key={r.role}
                      wrap="words"
                      muted={r.fixed}
                      mutedEdge={r.fixed && last ? "bottom" : undefined}
                      mutedJoin={join(j)}
                      className="text-center"
                    >
                      <RightCell
                        value={r.fixed ? row.fixed[j] : row.cells[j - fixedCount]}
                        label={`${r.role}: ${row.right}`}
                        locked={r.fixed}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        ))}
      </Table>
      <Alert tone="neutral" icon={<Lock aria-hidden="true" />}>
        <AlertDescription>
          <strong>Besitzer</strong> und <strong>Admin</strong> haben immer alle Rechte. Besitzer
          vergeben jede Rolle, Admins alle Rollen unterhalb von Admin.
        </AlertDescription>
      </Alert>
    </div>
  );
}

/* -- Mitglieder ------------------------------------------------------------- */

const MEMBERS = [
  { initials: "JL", name: "Jamie Lee", handle: "@jlee", role: "Besitzer", tone: "warning" as const },
  { initials: "MK", name: "Mira Kaya", handle: "@mkaya", role: "Bearbeiter", tone: "neutral" as const },
  { initials: "TB", name: "Tom Brandt", handle: "@tbrandt", role: "Leser", tone: "neutral" as const },
];

function MembersSection() {
  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-on-surface-variant">
          Folgende Personen haben Zugriff auf dieses Thema.
        </p>
        <Button variant="outline">
          <Plus className="size-4" aria-hidden="true" />
          Mitglieder hinzufügen
        </Button>
      </div>
      <h3 className="m-0 flex items-center gap-2 text-base font-semibold text-on-surface">
        Alle Mitglieder
        <Badge tone="neutral" aria-label={`${MEMBERS.length} Mitglieder`}>
          {MEMBERS.length}
        </Badge>
      </h3>
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Mitglieder">
        {MEMBERS.map((m) => (
          <li
            key={m.handle}
            className="flex items-center gap-3 rounded-[var(--ui-radius-box)] border border-outline-variant px-4 py-3"
          >
            <Avatar initials={m.initials} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-on-surface">{m.name}</span>
              <span className="truncate text-sm text-on-surface-variant">{m.handle}</span>
            </span>
            <Badge tone={m.tone}>
              {m.role === "Besitzer" && <Crown className="size-3.5" aria-hidden="true" />}
              {m.role}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -- Versionsverlauf -------------------------------------------------------- */

const VERSIONS = [
  { v: "v5", when: "06.11.2026, 12:23", what: "2 Änderungen an Startseite und Verhalten.", current: true },
  { v: "v4", when: "30.10.2026, 07:29", what: "Farben geändert." },
  { v: "v3", when: "30.10.2026, 07:19", what: "Kategorie geändert." },
];

function VersionsSection() {
  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex items-center gap-3 rounded-[var(--ui-radius-box)] border border-outline-variant p-4">
        <span
          className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-on-primary"
          aria-hidden="true"
        >
          <History className="size-5" />
        </span>
        <span className="flex flex-col">
          <span className="flex items-center gap-2 font-semibold text-on-surface">
            v5 <Badge tone="primary">Aktuell</Badge>
          </span>
          <span className="text-sm text-on-surface-variant">
            Gespeichert am 06.11.2026 um 12:23 von Jamie Lee · 5 Versionen insgesamt
          </span>
        </span>
      </div>
      <ol className="m-0 flex list-none flex-col gap-4 p-0" aria-label="Versionen">
        {VERSIONS.map((ver) => (
          <li key={ver.v} className="flex flex-col gap-1 border-l-2 border-outline-variant pl-4">
            <span className="flex items-center gap-2 text-sm text-on-surface-variant">
              <strong className="text-base text-on-surface">{ver.v}</strong> · {ver.when}
              {ver.current && <Badge tone="primary">Aktuell</Badge>}
            </span>
            <span className="text-on-surface">{ver.what}</span>
            {!ver.current && (
              <Button variant="ghost" size="sm" className="w-fit">
                <RotateCcw className="size-4" aria-hidden="true" />
                Wiederherstellen
              </Button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* -- The dialog ------------------------------------------------------------- */

/**
 * The topic's settings window. `section` is controlled here, as in JLURAG:
 * „Personen zuweisen" in Berechtigungen switches to Mitglieder.
 */
export function TopicSettingsDialog({
  open,
  onOpenChange,
  topic,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
}) {
  const [section, setSection] = useState("start");
  return (
    <SettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      value={section}
      onValueChange={setSection}
      size="xl"
      title={TOPIC_SETTINGS_TITLE}
      closeLabel="Schließen"
      maximizable
      maximizeLabel="Maximieren"
      restoreLabel="Verkleinern"
      searchPlaceholder="Einstellungen suchen"
      emptyLabel="Keine passende Einstellung"
      sections={[
        {
          value: "start",
          label: "Startseite",
          icon: <House aria-hidden="true" />,
          content: <StartPageSection topic={topic} />,
        },
        {
          value: "behavior",
          label: "Verhalten",
          icon: <SlidersHorizontal aria-hidden="true" />,
          keywords: ["Rolle", ...ROLES.map((r) => r.name)],
          content: <BehaviorSection />,
        },
        {
          value: "roles",
          label: "Berechtigungen",
          icon: <Shield aria-hidden="true" />,
          keywords: ["Rechte", "Besitzer", "Admin", "Bearbeiter", "Leser"],
          content: <RightsSection onAssignPeople={() => setSection("members")} />,
        },
        {
          value: "members",
          label: "Mitglieder",
          icon: <Users aria-hidden="true" />,
          content: <MembersSection />,
        },
        {
          value: "versions",
          label: "Versionsverlauf",
          icon: <History aria-hidden="true" />,
          content: <VersionsSection />,
        },
      ]}
      // Versionsverlauf has no footer: nothing there is a draft.
      footer={
        section === "versions" ? undefined : (
          <>
            <span className="text-sm text-on-surface-variant">Keine Änderungen</span>
            <span className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button disabled>Speichern</Button>
            </span>
          </>
        )
      }
    />
  );
}
