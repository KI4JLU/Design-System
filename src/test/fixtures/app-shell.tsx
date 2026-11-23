import { useState, type ReactNode } from "react";
import {
  Compass,
  Download,
  FolderOpen,
  Globe,
  History,
  Home,
  LayoutGrid,
  ListChecks,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  Rss,
  Search,
  Settings,
  SquarePen,
  Trash2,
  Type,
  Upload,
  Users,
} from "lucide-react";
import { AppShellLayout, type AppShellLayoutProps } from "../../templates/app-shell-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/breadcrumb";
import { Button } from "../../components/button";
import { FileDropzone } from "../../components/file-dropzone";
import { Logo } from "../../components/logo";
import { NavItem } from "../../components/nav-item";
import { SidebarAction } from "../../components/sidebar-action";
import { SidebarCard, SidebarCardList } from "../../components/sidebar-card";
import { useSidebarCollapsed } from "../../components/sidebar-context";
import { SidebarPanel } from "../../components/sidebar-panel";
import { SidebarRail, SidebarRailItem } from "../../components/sidebar-rail";
import type { MobilePaneTab } from "../../lib/pane-layout";
import { usePersistedWidth } from "../../lib/persisted-width";
import { TopicSettingsDialog } from "./topic-settings";
import { UserMenuWithSettings } from "./user-menu";

/* ---------------------------------------------------------------------------
 * Story fixture — the ONE app shell every `Templates/AppShellLayout` story
 * renders (KI-847). Not part of the package: `src/test` is excluded from the
 * type build, and nothing in `src/index.ts` imports it.
 *
 * Every app view is one `AppShellLayout`, adapted to its context. The two
 * contexts below mirror the two call sites of the reference consumer, JLURAG
 * (`web/src/components/`), with neutral content — German labels, no app
 * strings beyond what makes the shape recognisable:
 *
 *  - `overview` — `AppChrome.tsx` (`development`, Nov 2026):
 *    `Logo product="RAG"`, NavItem rows in a `SidebarPanel` (`SidebarNav.tsx`)
 *    — „Suchen" (it opens the search palette there), „Mein Wissen",
 *    „Geteiltes Wissen", „Entdecken"; „Werkzeuge" is hidden in the app
 *    (`SHOW_TOOLS_NAV = false`) and left out here — the user menu as
 *    `sidebarFooter`, no `pageLabel`, no `headerActions`, two narrow-screen
 *    tabs. JLURAG renders this view with `bar={false}` (`Overview` does too);
 *    the mechanism stories keep the bar and pass a `search` to pin its
 *    behaviour, which other apps use.
 *  - `workspace` — `KbWorkspaceLayout.tsx` (`development`, Nov 2026): the
 *    chat history as the left column (`history/HistoryPanel.tsx`:
 *    `SidebarPanel` with „Neuer Chat" and „Suchen" in its head and the chats
 *    grouped by day, `SidebarRail` collapsed), the breadcrumb „Mein Wissen /
 *    ‹topic›" as `pageLabel`, a ghost gear in `headerActions`, the sources
 *    card as `rightPanel` — titled „Quellen hinzufügen" in its `header`, with
 *    its close button, the ways to add a source and the sources
 *    (`sources/SourcesPanel.tsx`) — with a `collapsedPreview` rail
 *    (`sidebar/SourcesRail.tsx`), three tabs. From `lg` up the sources float
 *    as a card (0.81.0), so only the history column is resizable. JLURAG's
 *    bar has no search here; the page stories pass `search={null}`. The page
 *    itself is the `topic-chat` fixture.
 *
 * The bar carries no central search: JustRAG's overview has no bar at all
 * (`bar={false}`) and its workspace bar holds the breadcrumb and the gear —
 * „Suchen" is a row of the column that opens a palette.
 *
 * Everything else a story passes overrides the context's value (spread last),
 * which is how the mechanism stories fix a width or add a label without a
 * second hand-built shell. Column state (open, width, active tab) is local
 * state here — in an app it is the app's (context, URL, `localStorage`).
 * ------------------------------------------------------------------------- */

export type ShellContext = "overview" | "workspace";

export interface AppShellFixtureProps
  extends Omit<Partial<AppShellLayoutProps>, "children" | "rightPanel"> {
  context: ShellContext;
  children: ReactNode;
  /** `workspace` only: a fixed sources-card width instead of the persisted one. */
  rightWidth?: number;
  /**
   * `workspace` only: this user may not see the sources — the card is locked
   * (`rightPanel.locked`), as JLURAG's `KbWorkspaceLayout.tsx` does without
   * the `seeSources` capability.
   */
  sourcesLocked?: boolean;
  /** `workspace` only: a new topic — no chats in the history, a dropzone for the sources. */
  emptyTopic?: boolean;
  /**
   * `workspace` only: the topic's name in the breadcrumb. Default
   * `WORKSPACE_TITLE`, long enough to truncate in every bar the mechanism
   * stories measure; the page stories pass the name their page shows.
   */
  topic?: string;
  /** `overview` only: the page the navigation marks as current. Default „Mein Wissen". */
  section?: OverviewSection;
}

/** The reason a locked sources card gives (JLURAG `sourcesLockedReason`). */
export const SOURCES_LOCKED_REASON =
  "Mit deiner Rolle in diesem Thema kannst du die Quellen nicht einsehen.";

/** The locked toggle's accessible name (JLURAG: „‹sources› – ‹locked›"). */
export const SOURCES_LOCKED_LABEL = "Quellen – gesperrt";

/** The workspace's topic title — long enough to truncate in every bar measured. */
export const WORKSPACE_TITLE = "Prüfungsordnung Informatik (Master of Science), Fassung 2026";

/** The overview section the workspace's breadcrumb leads back to. */
export const WORKSPACE_SECTION = "Mein Wissen";

export function AppShellFixture({
  context,
  rightWidth,
  sourcesLocked,
  emptyTopic,
  topic,
  section,
  ...props
}: AppShellFixtureProps) {
  return context === "overview" ? (
    <OverviewShell section={section} {...props} />
  ) : (
    <WorkspaceShell
      rightWidth={rightWidth}
      sourcesLocked={sourcesLocked}
      emptyTopic={emptyTopic}
      topic={topic}
      {...props}
    />
  );
}

type ContextProps = Omit<
  AppShellFixtureProps,
  "context" | "rightWidth" | "sourcesLocked" | "emptyTopic" | "topic" | "section"
>;

const userMenu = <UserMenuWithSettings initials="JL" name="Jamie Lee" role="Admin" />;

/* -- overview (AppChrome.tsx) ------------------------------------------------ */

const OVERVIEW_TABS: MobilePaneTab[] = [
  { id: "nav", icon: <Menu aria-hidden="true" />, label: "Navigation", pane: "left" },
  { id: "page", icon: <LayoutGrid aria-hidden="true" />, label: "Inhalt", pane: "main" },
];

/** The overview's pages, in JLURAG's order (`AppChrome.tsx`). */
const OVERVIEW_SECTIONS = [
  { id: "mine", label: "Mein Wissen", icon: Home },
  { id: "shared", label: "Geteiltes Wissen", icon: Users },
  { id: "discover", label: "Entdecken", icon: Compass },
] as const;

export type OverviewSection = (typeof OVERVIEW_SECTIONS)[number]["id"];

/**
 * The overview's NavItem rows, bare. Every row carries `label` and wraps its
 * text in a `<span>`: the first permits the icon-only form in the rail, the
 * second is what the collapsed variant hides.
 */
function OverviewNavRows({ section }: { section: OverviewSection }) {
  return (
    <>
      <NavItem type="button" label="Suchen">
        <Search size={20} aria-hidden="true" />
        <span>Suchen</span>
      </NavItem>
      {OVERVIEW_SECTIONS.map(({ id, label, icon: Icon }) => (
        <NavItem key={id} type="button" label={label} active={id === section}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </NavItem>
      ))}
    </>
  );
}

/**
 * The overview's `nav`: the rows in the column's `SidebarPanel` frame, and
 * bare in the 60px rail, where the panel's insets do not fit — JLURAG's
 * `SidebarNav.tsx`, one to one. The panel has no title, `head` or `nav`, so
 * it renders no head and its list starts on the rail's 16px inset (KI-852):
 * `CollapsedRailKeepsVerticalPositions` measures exactly this composition.
 */
function OverviewNav({ section }: { section: OverviewSection }) {
  const collapsed = useSidebarCollapsed();
  if (collapsed) return <OverviewNavRows section={section} />;
  return (
    <SidebarPanel>
      <div className="flex flex-col gap-2">
        <OverviewNavRows section={section} />
      </div>
    </SidebarPanel>
  );
}

function OverviewShell({ section = "mine", ...props }: ContextProps & { section?: OverviewSection }) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [tab, setTab] = useState("page");
  return (
    <AppShellLayout
      logo={<Logo product="RAG" />}
      nav={<OverviewNav section={section} />}
      navLabel="Hauptnavigation"
      sidebarFooter={userMenu}
      leftOpen={leftOpen}
      onLeftOpenChange={setLeftOpen}
      collapseLabel="Navigation einklappen"
      expandLabel="Navigation ausklappen"
      mobileTabs={OVERVIEW_TABS}
      activeMobileTab={tab}
      onMobileTabChange={setTab}
      mobileTabBarLabel="Bereich wechseln"
      {...props}
    />
  );
}

/* -- workspace (KbWorkspaceLayout.tsx) --------------------------------------- */

const WORKSPACE_TABS: MobilePaneTab[] = [
  { id: "history", icon: <History aria-hidden="true" />, label: "Verlauf", pane: "left" },
  { id: "chat", icon: <MessageSquare aria-hidden="true" />, label: "Chat", pane: "main" },
  { id: "files", icon: <FolderOpen aria-hidden="true" />, label: "Quellen", pane: "right" },
];

/** The history, grouped by day as JLURAG's `HistoryPanel.tsx` groups it. */
const CHAT_DAYS = [
  {
    day: "Heute",
    chats: [
      { id: "c1", title: "Zusammenfassung der Modulbeschreibungen", active: true },
      { id: "c2", title: "Fragen zur Anmeldung" },
    ],
  },
  { day: "Gestern", chats: [{ id: "c3", title: "Fristen im Wintersemester" }] },
];
const CHATS = CHAT_DAYS.flatMap((group) => group.chats);

const SOURCES = [
  { id: "s1", name: "Modulhandbuch_2026.pdf", type: "PDF" },
  { id: "s2", name: "Prüfungsordnung.docx", type: "DOCX" },
  { id: "s3", name: "Termine.xlsx", type: "XLSX", muted: true },
];

/** The ways to add a source, as the head of JLURAG's sources card lists them (`SourcesGrid.tsx`). */
const SOURCE_KINDS = [
  { id: "crawl", label: "Crawl", icon: Globe },
  { id: "rss", label: "RSS", icon: Rss },
  { id: "upload", label: "Datei hochladen", icon: Upload },
  { id: "text", label: "Text einfügen", icon: Type },
];

/** JLURAG's empty history line (`noHistory`). */
export const NO_HISTORY = "Noch kein Verlauf vorhanden.";

const chatActions = [
  { label: "Chat umbenennen", icon: <Pencil size={16} aria-hidden="true" />, onSelect: () => {} },
  {
    label: "Löschen",
    icon: <Trash2 size={16} aria-hidden="true" />,
    destructive: true,
    separatorBefore: true,
    onSelect: () => {},
  },
];

const sourceActions = [
  { label: "Auswählen", icon: <ListChecks size={16} aria-hidden="true" />, onSelect: () => {} },
  { label: "Herunterladen", icon: <Download size={16} aria-hidden="true" />, onSelect: () => {} },
  {
    label: "Entfernen",
    icon: <Trash2 size={16} aria-hidden="true" />,
    destructive: true,
    separatorBefore: true,
    onSelect: () => {},
  },
];

/**
 * The left column (JLURAG `history/HistoryPanel.tsx`): expanded, a
 * `SidebarPanel` whose head holds „Neuer Chat" and „Suchen" (the search
 * palette lives there, not in the bar) and whose list is the chats grouped by
 * day — one `SidebarCardList` per day inside `data-sidebar-card-groups`, so
 * the whole history is one Tab stop. Collapsed: the same two actions plus one
 * `SidebarRailItem` per chat. `empty`: a new topic, no chats yet.
 */
function HistoryNav({ empty = false }: { empty?: boolean }) {
  const collapsed = useSidebarCollapsed();
  const chats = empty ? [] : CHATS;
  if (collapsed) {
    return (
      <>
        <SidebarRailItem variant="action" title="Neuer Chat" aria-label="Neuer Chat">
          <SquarePen aria-hidden="true" />
        </SidebarRailItem>
        <SidebarRailItem title="Suchen" aria-label="Suchen" aria-haspopup="dialog">
          <Search aria-hidden="true" />
        </SidebarRailItem>
        <SidebarRail>
          {chats.map((chat) => (
            <li key={chat.id}>
              <SidebarRailItem active={chat.active} title={chat.title} aria-label={chat.title}>
                <MessageSquare aria-hidden="true" />
              </SidebarRailItem>
            </li>
          ))}
        </SidebarRail>
      </>
    );
  }
  return (
    <SidebarPanel
      title="Verlauf"
      head={
        <>
          <SidebarAction type="button" icon={<SquarePen />}>
            Neuer Chat
          </SidebarAction>
          <SidebarAction type="button" icon={<Search />} aria-haspopup="dialog">
            Suchen
          </SidebarAction>
        </>
      }
    >
      {empty ? (
        <p className="m-0 p-8 text-center text-sm text-on-surface-variant">{NO_HISTORY}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0" data-sidebar-card-groups="">
          {CHAT_DAYS.map((group, index) => (
            <li key={group.day}>
              {/* JLURAG's `.history-panel__group-label`: 12px, outline grey. */}
              <h3
                className={`m-0 px-2.5 pb-1 text-xs font-normal text-outline ${index === 0 ? "pt-1" : "pt-3.5"}`}
              >
                {group.day}
              </h3>
              <SidebarCardList>
                {group.chats.map((chat) => (
                  <SidebarCard
                    key={chat.id}
                    icon={<MessageSquare />}
                    title={chat.title}
                    onOpen={() => {}}
                    active={"active" in chat && chat.active}
                    actionsLabel="Chat-Aktionen"
                    actions={chatActions}
                  />
                ))}
              </SidebarCardList>
            </li>
          ))}
        </ul>
      )}
    </SidebarPanel>
  );
}

/**
 * The sources card's body (JLURAG `sources/SourcesPanel.tsx`): the ways to
 * add a source as two columns of buttons in the head, the sources below. The
 * card's title („Quellen hinzufügen") is `rightPanel.header`, beside its close
 * button. `empty`: a new topic — the list is a `FileDropzone`, as JLURAG
 * shows it while there are no sources yet. JLURAG's buttons are its own
 * (`sources-grid__item`: a 38px pill, 13px label); the fixture uses the DS
 * `Button`.
 */
function SourcesContent({ empty = false }: { empty?: boolean }) {
  return (
    <SidebarPanel
      head={
        <div className="grid grid-cols-2 gap-2">
          {SOURCE_KINDS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              variant="outline"
              size="sm"
              className="min-w-0 justify-start rounded-full"
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Button>
          ))}
        </div>
      }
    >
      {empty ? (
        <FileDropzone
          className="mt-1.5 min-h-48"
          title="Dateien hierher ziehen"
          hint="Dokumente, Präsentationen, Tabellen, Bilder, Audio und Textdateien, bis 500 MB"
          onFiles={() => {}}
          onBrowse={() => {}}
          aria-label="Datei hochladen"
        />
      ) : (
        <SidebarCardList iconSlot="badge">
          {SOURCES.map((source) => (
            <SidebarCard
              key={source.id}
              iconText={source.type}
              title={source.name}
              onOpen={() => {}}
              actionsLabel="Quellen-Aktionen"
              actions={sourceActions}
            />
          ))}
        </SidebarCardList>
      )}
    </SidebarPanel>
  );
}

/** The collapsed right rail: „add" leads, one icon per source (JLURAG `SourcesRail.tsx`). */
function SourcesRail({ empty = false }: { empty?: boolean }) {
  return (
    <>
      <SidebarRailItem variant="action" title="Quellen hinzufügen" aria-label="Quellen hinzufügen">
        <Plus aria-hidden="true" />
      </SidebarRailItem>
      <SidebarRail aria-label="Quellen">
        {(empty ? [] : SOURCES).map((source) => (
          <li key={source.id}>
            <SidebarRailItem iconText={source.type} muted={source.muted} aria-label={source.name} />
          </li>
        ))}
      </SidebarRail>
    </>
  );
}

/**
 * The fixture's `Storage`: in memory and per mount, so a story test never
 * writes into the runner's real `localStorage` and every story starts at the
 * default widths. An app omits `storage` — then it is `window.localStorage`.
 */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  } satisfies Storage;
}

/**
 * The workspace's `pageLabel`: the path back to the overview section and the
 * topic, as JLURAG's `KbWorkspaceLayout.tsx` renders it. The section is a real
 * link (the app opens it in a new tab on a modified click); the topic is the
 * current page and truncates, the section never does.
 */
function WorkspaceBreadcrumb({ topic }: { topic: string }) {
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink href="#" onClick={(event) => event.preventDefault()}>
            {WORKSPACE_SECTION}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate">{topic}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** JLURAG's bounds (`hooks/useSidebarResize.ts`): 320 by default, left 150–600, right 300–800. */
const LEFT_BOUNDS = { min: 150, max: 600 };
const RIGHT_BOUNDS = { min: 300, max: 800 };
const DEFAULT_COLUMN_WIDTH = 320;

function WorkspaceShell({
  rightWidth,
  sourcesLocked,
  emptyTopic,
  topic = WORKSPACE_TITLE,
  ...props
}: ContextProps & {
  rightWidth?: number;
  sourcesLocked?: boolean;
  emptyTopic?: boolean;
  topic?: string;
}) {
  const [storage] = useState(memoryStorage);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [tab, setTab] = useState("chat");
  // The gear opens the topic's settings (`topic-settings` fixture).
  const [settingsOpen, setSettingsOpen] = useState(false);
  // `usePersistedWidth` is exactly the wiring an app writes, except for the
  // injected `storage`; the consumer passes the WHOLE key.
  const [leftWidth, setLeftWidth] = usePersistedWidth("storybook.workspace.leftWidth", {
    defaultWidth: DEFAULT_COLUMN_WIDTH,
    minWidth: LEFT_BOUNDS.min,
    maxWidth: LEFT_BOUNDS.max,
    storage,
  });
  const [persistedRightWidth, setRightWidth] = usePersistedWidth(
    "storybook.workspace.rightWidth",
    {
      defaultWidth: DEFAULT_COLUMN_WIDTH,
      minWidth: RIGHT_BOUNDS.min,
      maxWidth: RIGHT_BOUNDS.max,
      storage,
    },
  );

  return (
    <AppShellLayout
      logo={<Logo product="RAG" />}
      nav={<HistoryNav empty={emptyTopic} />}
      navLabel="Verlauf"
      pageLabel={<WorkspaceBreadcrumb topic={topic} />}
      headerActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Einstellungen des Themas"
            aria-label="Einstellungen des Themas"
            aria-haspopup="dialog"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={20} aria-hidden="true" />
          </Button>
          <TopicSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} topic={topic} />
        </>
      }
      sidebarFooter={userMenu}
      leftOpen={leftOpen}
      onLeftOpenChange={setLeftOpen}
      leftWidth={leftWidth}
      leftResize={{
        minWidth: LEFT_BOUNDS.min,
        maxWidth: LEFT_BOUNDS.max,
        onWidthChange: setLeftWidth,
        label: "Breite des Verlaufs ändern",
      }}
      collapseLabel="Verlauf einklappen"
      expandLabel="Verlauf ausklappen"
      rightPanel={
        sourcesLocked
          ? {
              // The toggle keeps its place, locked; no card, no content.
              content: null,
              label: "Quellen",
              isOpen: false,
              onOpenChange: () => {},
              expandLabel: SOURCES_LOCKED_LABEL,
              collapseLabel: SOURCES_LOCKED_LABEL,
              locked: { description: SOURCES_LOCKED_REASON },
              toggleTooltip: (
                <>
                  <span className="block font-semibold">Quellen</span>
                  <span className="mt-1 block font-normal">{SOURCES_LOCKED_REASON}</span>
                </>
              ),
            }
          : {
              content: <SourcesContent empty={emptyTopic} />,
              // The card's title sits in its header row, beside the close
              // button (JLURAG `KbWorkspaceLayout.tsx`: 15px, medium).
              header: (
                <h2 className="m-0 truncate text-[15px] font-medium text-on-surface">
                  Quellen hinzufügen
                </h2>
              ),
              closeLabel: "Quellen schließen",
              collapsedPreview: <SourcesRail empty={emptyTopic} />,
              label: "Quellen",
              isOpen: rightOpen,
              onOpenChange: setRightOpen,
              width: rightWidth ?? persistedRightWidth,
              resize: {
                minWidth: RIGHT_BOUNDS.min,
                maxWidth: RIGHT_BOUNDS.max,
                onWidthChange: setRightWidth,
                label: "Breite der Quellen ändern",
              },
              expandLabel: "Quellen ausklappen",
              collapseLabel: "Quellen einklappen",
            }
      }
      mobileTabs={WORKSPACE_TABS}
      activeMobileTab={tab}
      onMobileTabChange={setTab}
      mobileTabBarLabel="Bereich wechseln"
      {...props}
    />
  );
}
