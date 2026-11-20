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
  /** Someone else's topic: shown as „Geteilt von …". */
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
