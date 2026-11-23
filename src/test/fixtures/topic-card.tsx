import type { ReactNode } from "react";
import {
  Check,
  Clock,
  FileText,
  Globe,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { ActionMenu } from "../../components/action-menu";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import {
  Card,
  CardBand,
  CardContent,
  CardDescription,
  CardFooter,
  CardHairline,
  CardMeta,
  CardTitle,
} from "../../components/card";
import { cardNeutralAccent } from "../../components/card-variants";
import { ScrollingText } from "../../components/scrolling-text";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/tooltip";
import { cn } from "../../lib/utils";
import type { CatalogEntry, Topic } from "./topics";

/* ---------------------------------------------------------------------------
 * Story fixture — the topic card of JLURAG's overview pages („Mein Wissen",
 * „Geteiltes Wissen"), built from design-system parts only. Not part of the
 * package: `src/test` is excluded from the type build.
 *
 * It mirrors JLURAG's `KbCard.tsx` (`PrivateKbCard`, card and `compact` row):
 * the hairline card in the category's colour, the meta lines, the count chips
 * and the visibility badge; on hover the description takes the place of the
 * activity. App things are left out — translation, routing, the drag handle,
 * the line-fitting hook. Labels are German, as in the app.
 * ------------------------------------------------------------------------- */

const VISIBILITY = {
  personal: { tone: "neutral", icon: Lock, label: () => "Privat" },
  shared: { tone: "primary", icon: Users, label: (t: Topic) => `Geteilt (${t.members ?? 2})` },
  public: { tone: "success", icon: Globe, label: () => "Öffentlich" },
} as const;

function VisibilityBadge({ topic }: { topic: Topic }) {
  const v = VISIBILITY[topic.visibility];
  const Icon = v.icon;
  return (
    <Badge tone={v.tone} className="ml-auto shrink-0">
      <Icon size={10} aria-hidden="true" />
      {v.label(topic)}
    </Badge>
  );
}

/** An icon and a number; the full phrase is the tooltip and the screen-reader text. */
function CountChip({ icon, n, label }: { icon: ReactNode; n: number; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge>
          {icon}
          <span aria-hidden="true">{n}</span>
          <span className="sr-only">{label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function CategoryPill({ category, onHairline = false }: { category: NonNullable<Topic["category"]>; onHairline?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-surface-container-lowest px-2 py-0.5 text-xs font-semibold text-on-surface",
        onHairline ? "border-[var(--card-accent,var(--color-outline-variant))]" : "border-outline-variant",
      )}
    >
      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: category.color }} />
      {category.name}
    </span>
  );
}

function MetaLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
      <span className="flex shrink-0">{icon}</span>
      <span className="truncate">
        {label} <span className="font-semibold text-on-surface">{value}</span>
      </span>
    </div>
  );
}

const actions = (topic: Topic) => [
  { label: "Umbenennen…", icon: <Pencil size={16} aria-hidden="true" />, onSelect: () => {} },
  { label: "Teilen…", icon: <UserPlus size={16} aria-hidden="true" />, onSelect: () => {} },
  {
    label: "Einstellungen",
    icon: <Settings size={16} aria-hidden="true" />,
    opensPage: true,
    separatorBefore: true,
    onSelect: () => {},
  },
  {
    label: topic.owner ? "Aus meiner Ansicht entfernen…" : "Löschen…",
    icon: <Trash2 size={16} aria-hidden="true" />,
    destructive: true,
    separatorBefore: true,
    onSelect: () => {},
  },
];

function FavoriteButton({ topic, className }: { topic: Topic; className?: string }) {
  const label = topic.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${label}: ${topic.name}`}
      title={label}
      className={cn("size-7 shrink-0 rounded-[var(--ui-radius-control)] text-on-surface-variant", className)}
    >
      <Star size={16} aria-hidden="true" fill={topic.favorite ? "currentColor" : "none"} />
    </Button>
  );
}

function NameButton({ topic }: { topic: Topic }) {
  return (
    <ScrollingText asChild>
      <button type="button" className="cursor-pointer text-left" aria-label={`Thema öffnen: ${topic.name}`}>
        {topic.name}
      </button>
    </ScrollingText>
  );
}

/** At rest the activity shows; under the pointer or the focus, the description. */
const AT_REST =
  "transition-opacity duration-300 delay-100 ease-out group-hover/topic:opacity-0 group-hover/topic:duration-150 group-hover/topic:delay-0 group-focus-within/topic:opacity-0";
const ON_HOVER =
  "pointer-events-none opacity-0 transition-opacity duration-150 ease-out group-hover/topic:opacity-100 group-hover/topic:duration-300 group-hover/topic:delay-100 group-focus-within/topic:opacity-100";

/** The topic as a card — the `cards` view. */
export function TopicCard({ topic }: { topic: Topic }) {
  const files = topic.files ?? 0;
  const chats = topic.chats ?? 0;
  return (
    <Card
      interactive
      accentColor={topic.category?.color}
      data-topic={topic.id}
      className="group/topic relative h-full cursor-pointer"
    >
      <CardBand>
        <CardTitle>
          <NameButton topic={topic} />
        </CardTitle>
        <FavoriteButton
          topic={topic}
          className={topic.favorite ? undefined : "opacity-0 transition-opacity focus-visible:opacity-100 group-hover/topic:opacity-100"}
        />
        <ActionMenu
          actions={actions(topic)}
          label={`Aktionen: ${topic.name}`}
          triggerClassName="size-7 rounded-[var(--ui-radius-control)]"
        />
      </CardBand>
      <CardHairline>{topic.category && <CategoryPill category={topic.category} onHairline />}</CardHairline>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <p
          data-slot="topic-description"
          className={`absolute inset-x-5 top-0 bottom-4 m-0 line-clamp-4 text-sm text-on-surface-variant ${ON_HOVER}`}
        >
          {topic.description}
        </p>
        <CardContent className={`flex flex-col pb-0 ${AT_REST}`}>
          <div className="mb-3 flex min-h-11 min-w-0 flex-col gap-1">
            <MetaLine icon={<Clock size={16} aria-hidden="true" />} label="Genutzt" value={topic.used} />
            {topic.updated && (
              <MetaLine icon={<RefreshCw size={16} aria-hidden="true" />} label="Aktualisiert" value={topic.updated} />
            )}
            {topic.owner && (
              <MetaLine icon={<User size={16} aria-hidden="true" />} label="von" value={topic.owner} />
            )}
          </div>
        </CardContent>
        <CardFooter className={`justify-between ${AT_REST}`}>
          {(files > 0 || chats > 0) && (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-stack-sm">
              {files > 0 && (
                <CountChip icon={<FileText size={12} aria-hidden="true" />} n={files} label={`${files} Dateien`} />
              )}
              {chats > 0 && (
                <CountChip icon={<MessageSquare size={12} aria-hidden="true" />} n={chats} label={`${chats} Nachrichten`} />
              )}
            </div>
          )}
          <VisibilityBadge topic={topic} />
        </CardFooter>
      </div>
    </Card>
  );
}

/** The list's columns: topic, sources, chats, last active, sharing, actions. */
const ROW_COLUMNS =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 md:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_8rem_7.5rem_auto] [&>*:nth-child(2)]:max-md:hidden [&>*:nth-child(3)]:max-md:hidden [&>*:nth-child(4)]:max-md:hidden";

/** The rows' column labels — `GridLayout`'s `listHeader`. */
export function TopicListHeader() {
  return (
    <div aria-hidden="true" className={`${ROW_COLUMNS} border-l-4 border-transparent pr-3 pl-6 text-xs font-medium text-on-surface-variant`}>
      <span>Thema</span>
      <span className="text-right">Quellen</span>
      <span className="text-right">Chats</span>
      <span className="text-right">Zuletzt aktiv</span>
      <span className="text-right">Freigabe</span>
      <span className="w-14" />
    </div>
  );
}

/** The topic as a row — the `list` view (`Card accent`, the category as its edge). */
export function TopicRow({ topic }: { topic: Topic }) {
  const files = topic.files ?? 0;
  const chats = topic.chats ?? 0;
  return (
    <Card
      accent
      tint={!!topic.category}
      accentColor={topic.category?.color ?? cardNeutralAccent}
      interactive
      data-topic={topic.id}
      className={`${ROW_COLUMNS} relative cursor-pointer items-center py-3 pr-3 pl-6`}
    >
      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className="max-w-full truncate font-semibold text-on-surface">
          <NameButton topic={topic} />
        </span>
        {topic.category && <CategoryPill category={topic.category} />}
      </div>
      <div className="flex justify-end">
        <CountChip icon={<FileText size={12} aria-hidden="true" />} n={files} label={`${files} Dateien`} />
      </div>
      <div className="flex justify-end">
        <CountChip icon={<MessageSquare size={12} aria-hidden="true" />} n={chats} label={`${chats} Nachrichten`} />
      </div>
      <span className="truncate text-right text-sm text-on-surface-variant">{topic.used}</span>
      <div className="flex justify-end">
        <VisibilityBadge topic={topic} />
      </div>
      <div className="flex items-center justify-end">
        <FavoriteButton topic={topic} />
        <ActionMenu
          actions={actions(topic)}
          label={`Aktionen: ${topic.name}`}
          triggerClassName="size-7 rounded-[var(--ui-radius-control)]"
        />
      </div>
    </Card>
  );
}

/* -- „Entdecken": the catalog (JLURAG `KbCatalogPanel.tsx`) ---------------- */

/** „Abonnieren", or — once subscribed — „Abonniert" as a pressed toggle. */
function SubscribeButton({ entry }: { entry: CatalogEntry }) {
  return (
    <Button
      size="sm"
      variant={entry.subscribed ? "outline" : "default"}
      className="shrink-0"
      aria-pressed={entry.subscribed}
      aria-label={`${entry.subscribed ? "Abonniert" : "Abonnieren"}: ${entry.name}`}
      title={entry.subscribed ? "Abbestellen" : undefined}
    >
      {entry.subscribed ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Plus className="size-4" aria-hidden="true" />
      )}
      {entry.subscribed ? "Abonniert" : "Abonnieren"}
    </Button>
  );
}

function Documents({ n }: { n: number }) {
  return (
    <Badge>
      <FileText size={12} aria-hidden="true" />
      {n === 1 ? "1 Dokument" : `${n} Dokumente`}
    </Badge>
  );
}

/**
 * A catalog topic as a card: name and „Abonnieren" in the band, the category
 * on the rule, the description, then size and „Stand".
 */
export function CatalogCard({ entry }: { entry: CatalogEntry }) {
  return (
    <Card interactive accentColor={entry.category?.color} data-topic={entry.id} className="h-full cursor-pointer">
      <CardBand>
        <CardTitle>
          <button type="button" className="cursor-pointer text-left" aria-label={`Thema öffnen: ${entry.name}`}>
            {entry.name}
          </button>
        </CardTitle>
        <SubscribeButton entry={entry} />
      </CardBand>
      <CardHairline>{entry.category && <CategoryPill category={entry.category} onHairline />}</CardHairline>
      <CardContent>
        <CardDescription className="line-clamp-3 leading-6 text-on-surface">{entry.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <CardMeta className="text-xs">
          <Documents n={entry.files} />
          <span>Stand {entry.asOf}</span>
        </CardMeta>
      </CardFooter>
    </Card>
  );
}

/** The catalog list's columns: topic, sources, „Stand", subscribe. */
const CATALOG_COLUMNS = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 md:grid-cols-[minmax(0,1fr)_7rem_7rem_9rem] [&>*:nth-child(2)]:max-md:hidden [&>*:nth-child(3)]:max-md:hidden";

/** The catalog rows' column labels — `GridLayout`'s `listHeader`. */
export function CatalogListHeader() {
  return (
    <div aria-hidden="true" className={`${CATALOG_COLUMNS} border-l-4 border-transparent pr-3 pl-4 text-xs font-medium text-on-surface-variant`}>
      <span>Thema</span>
      <span className="text-right">Quellen</span>
      <span className="text-right">Stand</span>
      <span />
    </div>
  );
}

/** A catalog topic as a row — the `list` view. */
export function CatalogRow({ entry }: { entry: CatalogEntry }) {
  return (
    <Card
      accent
      tint={!!entry.category}
      accentColor={entry.category?.color ?? cardNeutralAccent}
      interactive
      data-topic={entry.id}
      className={`${CATALOG_COLUMNS} cursor-pointer items-center py-3 pr-3 pl-4`}
    >
      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className="max-w-full truncate font-semibold text-on-surface">{entry.name}</span>
        {entry.category && <CategoryPill category={entry.category} />}
      </div>
      <div className="flex justify-end">
        <Documents n={entry.files} />
      </div>
      <span className="truncate text-right text-sm text-on-surface-variant">{entry.asOf}</span>
      <div className="flex justify-end">
        <SubscribeButton entry={entry} />
      </div>
    </Card>
  );
}
