/* ---------------------------------------------------------------------------
 * Story data for the `topic-card` fixture: the topic shape and the topics the
 * `GridLayout` stories show. Kept apart from the components so the component
 * file exports components only (react-refresh).
 * ------------------------------------------------------------------------- */

export type TopicVisibility = "personal" | "shared" | "public";

export interface Topic {
  id: string;
  name: string;
  description: string;
  /** Category name and colour — any CSS colour, e.g. `var(--color-category-3)`. */
  category?: { name: string; color: string };
  /** „Genutzt …" — relative, as the app formats it. */
  used: string;
  /** „Aktualisiert …" — omitted while nothing has been ingested. */
  updated?: string;
  files?: number;
  chats?: number;
  visibility: TopicVisibility;
  /** With `shared`: members including the owner. */
  members?: number;
  /** Someone else's topic: shown as „von …" (JLURAG `sharedBy`). */
  owner?: string;
  favorite?: boolean;
}

/** The topics every `GridLayout` story shows — names as a university would have them. */
export const TOPICS: Topic[] = [
  {
    id: "po",
    name: "Prüfungsordnung Informatik",
    description: "Fragen zur Prüfungsordnung des Masterstudiengangs: Fristen, Wiederholungen, Anerkennung.",
    category: { name: "Studium", color: "var(--color-category-1)" },
    used: "vorgestern",
    updated: "vorgestern",
    files: 3,
    chats: 2,
    visibility: "personal",
    favorite: true,
  },
  {
    id: "mhb",
    name: "Modulhandbuch",
    description: "Alle Module mit Inhalten, Leistungspunkten und Prüfungsformen.",
    category: { name: "Lehre", color: "var(--color-category-3)" },
    used: "vor 7 Minuten",
    files: 12,
    visibility: "shared",
    members: 3,
  },
  {
    id: "ki",
    name: "KI in der Lehre",
    description: "Hinweise und Regeln zum Einsatz von KI-Werkzeugen in Lehrveranstaltungen.",
    category: { name: "Recherche", color: "var(--color-category-5)" },
    used: "vor 8 Minuten",
    updated: "gestern",
    files: 5,
    chats: 9,
    visibility: "personal",
  },
  {
    id: "lang",
    name: "Richtlinien zur Sicherung guter wissenschaftlicher Praxis an der Justus-Liebig-Universität",
    description: "Die Richtlinien der JLU zur guten wissenschaftlichen Praxis im Volltext.",
    used: "vor 3 Minuten",
    visibility: "personal",
  },
  {
    id: "mensa",
    name: "Mensa und Cafeterien",
    description: "Öffnungszeiten und Angebote der Mensen.",
    used: "vor 15 Tagen",
    visibility: "public",
  },
  {
    id: "promo",
    name: "Promotionsordnung",
    description: "Die Promotionsordnung des Fachbereichs, mit Anlagen.",
    used: "gestern",
    // Three meta lines — the tallest card, so `uniformRows` has a row to even out.
    updated: "heute",
    files: 2,
    visibility: "shared",
    members: 4,
    owner: "Dr. Anna Weber",
  },
];

/** The categories every overview page filters by — one set for the platform. */
export const CATEGORIES = {
  studium: { name: "Studium", color: "var(--color-category-1)" },
  lehre: { name: "Lehre", color: "var(--color-category-3)" },
  recherche: { name: "Recherche", color: "var(--color-category-5)" },
};

/**
 * „Geteiltes Wissen": topics somebody shared with you, and public topics you
 * subscribed to in „Entdecken" (JLURAG `SharedTopicsView.tsx`) — the last one
 * is the catalog's subscribed entry.
 */
export const SHARED_TOPICS: Topic[] = [
  {
    id: "mhb-bio",
    name: "Modulhandbuch Biologie",
    description: "Die Module des Bachelorstudiengangs Biologie mit Leistungspunkten und Prüfungsformen.",
    used: "vor 28 Tagen",
    updated: "vor 29 Tagen",
    files: 29,
    chats: 2,
    visibility: "shared",
    members: 2,
    owner: "Dr. Anna Weber",
  },
  {
    id: "didaktik",
    name: "Hochschuldidaktik",
    description: "Material des Zentrums für Hochschuldidaktik: Lehrformate, Prüfen, Feedback.",
    category: CATEGORIES.lehre,
    used: "vor 25 Tagen",
    updated: "vor 25 Tagen",
    files: 1,
    chats: 2,
    visibility: "shared",
    members: 2,
    owner: "Jonas Becker",
  },
  {
    id: "klima",
    name: "Klimaschutz an der JLU",
    description: "Maßnahmenpläne nach dem Klimaschutzgesetz, mit Prioritäten und Anmerkungen.",
    category: CATEGORIES.recherche,
    used: "vor 4 Tagen",
    updated: "letzten Monat",
    files: 1,
    chats: 7,
    visibility: "public",
  },
];

/** A topic of the „Entdecken" catalog (JLURAG `KbCatalogEntry`). */
export interface CatalogEntry {
  id: string;
  name: string;
  description: string;
  category?: { name: string; color: string };
  files: number;
  /** „Stand …" — the last ingest, as a date. */
  asOf: string;
  subscribed: boolean;
}

/** The catalog: public topics anyone at the university may subscribe to. */
export const CATALOG: CatalogEntry[] = [
  {
    id: "klima",
    name: "Klimaschutz an der JLU",
    description:
      "Maßnahmenpläne nach dem Klimaschutzgesetz. Beantwortet Fragen zu Prioritäten und Anmerkungen.",
    category: CATEGORIES.recherche,
    files: 1,
    asOf: "16.10.2026",
    subscribed: true,
  },
  {
    id: "lehramt",
    name: "Studienordnung Lehramt",
    description: "Studien- und Prüfungsordnungen der Lehramtsstudiengänge, mit Modulbeschreibungen.",
    category: CATEGORIES.studium,
    files: 4,
    asOf: "02.11.2026",
    subscribed: false,
  },
  {
    id: "bib",
    name: "Universitätsbibliothek",
    description: "Ausleihe, Fernleihe, Öffnungszeiten und Zugänge zu Datenbanken.",
    files: 12,
    asOf: "10.11.2026",
    subscribed: false,
  },
];
